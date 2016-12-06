var _ = require('lodash');
var url = require('url');
var async = require('async');
var util = require('util');
var Botkit = require('botkit');
var HN = require('./hacker-news');
var WebClient = require('@slack/client').WebClient;

/**
* Your function call
* @param {Object} params Execution parameters
*   Members
*   - {Array} args Arguments passed to function
*   - {Object} kwargs Keyword arguments (key-value pairs) passed to function
*   - {String} remoteAddress The IPv4 or IPv6 address of the caller
*
* @param {Function} callback Execute this to end the function call
*   Arguments
*   - {Error} error The error to show if function fails
*   - {Any} returnValue JSON serializable (or Buffer) return value
*/
module.exports = (params, callback) => {
    if (params.kwargs.token !== process.env.SLACK_VERTIFICATION_TOKEN)
        return callback(new Error("Bad verification token."));

    if (params.kwargs.challenge) return callback(null, {challenge: params.kwargs.challenge});


    var mongo = require('./mongo');
    var controller = Botkit.slackbot({
        storage: mongo()
    });

    async.auto({
        team: (callback) => {
            controller.storage.teams.get(params.kwargs.team_id, (err, team) => callback(err, team));
        },
        process: ['team', (results, callback) => {
            console.log("team", results.team);
            if (!results.team) return callback(new Error("No team found."));

            return processEvent(params.kwargs.event, results.team, callback);
        }]
    }, (err, results) => callback(err));
};


function processEvent(event, team, next) {
    console.log("event", event);
    if (!_.includes(event.type, ['message'])) return next && next(); // Unsupported event type

    var message = getMessageFromEvent(event, team);
    if (!message) return next && next();

    console.log("chain", message.chain);
    async.auto({
        received: (callback) => {
            if (!message.chain.length) return callback();

            var funcPath = _.map(message.chain, (curr) => curr.name + "(" + (curr.hasParams && curr.param ? curr.param : "") + ")").join(".");
            sendMessage((team.bot || {}).bot_access_token, {
                text: "Fetching from HN: " + "`hn." + funcPath + "`",
                channel: message.channel_id
            }, callback);
        },
        query: (callback) => {
            if (!message.chain.length) return callback();

            try {
                var processCallback = (err, data) => {
                    if (err) throw err;

                    console.log("data", data);
                    var attachments = _.map(_.filter(data, (post) => post && post.title && post.url && post.url.length && post.title.length), (post) => ({
                        title: post.title,
                        title_link: post.url,
                        footer: util.format("(%s) – %s", url.parse(post.url).host, post.by)
                    }));

                    debugger;
                    var response = {
                        text: attachments.length ? "Here's what I found:" : "Looks like no posts matched that query.",
                        channel: message.channel_id,
                        attachments: attachments
                    };

                    sendMessage((team.bot || {}).bot_access_token, response, callback);
                };

                HN.chain(_.map(message.chain, 'name'), processCallback);
            } catch (err) {
                console.error("err", err);
                return callback && callback();
            }
        }
    }, next);
}

function getMessageFromEvent(event, team) {
    console.log("getMessageFromEvent");
    if (!event) return null;
    if (!event.type) return null;
    if (event.type !== 'message') return null;
    if (event.subtype === 'message_changed') return null;
    if (!event.text && !(event.message || {}).text) return null;
    if (event.bot_id && event.bot_id === ((team || {}).bot || {}).bot_user_id) return null;

    console.log("parsing message");
    var message = {};

    message.channel_id = event.channel;
    message.text = event.text;
    message.type = getMessageType(message.text, ((team || {}).bot || {}).bot_user_id);
    message.user_id = event.user;
    message.timestamp = event.ts;

    console.log("message.type", message.type);

    if (message.type !== 'command') return null;

    message.chain = getCommandChain(message.text);

    console.log("message", message);
    return message;
};

function getMessageType(text, botId) {
    console.log("getMessageType", text, botId);
    var botCommandRegex = new RegExp(util.format("\<@%s\>\\s+(\\S+)\\s?(.*)?", botId), 'ig');

    if (botCommandRegex.test(text)) return "command";

    return "message";
};


function getCommandChain(text) {
    var availableFunctions = [
        {
            name: 'askStories',
            description: "Ask HN",
            match: /ask\_hn|ask|asks|ask\_hn/i
        },
        {
            name: 'showStories',
            match: /show|shows|show\_hn|show\_hns/i
        },
        {
            name: 'topStories',
            match: /top|top_stories/
        },
        {
            name: 'newStories',
            match: /recent|new/
        },
        {
            name: "bestStories",
            match: /best/
        }
    ];

    var parts = _.filter((text || '').split(" "), (part) => {
        if (!part) return false;

        if (!part.length) return false;

        return true;
    }).map((part) => part.toLowerCase().trim());

    var chain = [];
    for (var index = 0; index < parts.length; index ++) {
        var part = parts[index];

        var matchingFunction = _.reduce(availableFunctions, (result, func) => {
            if (func.match && func.match.test(part)) return func;

            return result;
        }, null)

        if (!matchingFunction) continue;

        chain.push(matchingFunction);
    }

    return chain;
}

function sendMessage(token, message, next) {
    var web = new WebClient(token);
    var params = _.assign(message, {
        as_user: false
    });

    web.chat.postMessage(message.channel, message.text, message, (err, data) => {
        if (err) return next && next(err);
        if (!data.ok) return next && next(data);

        return next && next(null, data);
    });
};
