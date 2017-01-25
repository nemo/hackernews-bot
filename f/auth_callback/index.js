var Request          = require('request')
var async            = require('async');
var ejs              = require('ejs');
var template         = __dirname + '/view.ejs';
var Botkit           = require('botkit');

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
    var authCode = params.kwargs.code;

    // if (authCode) return ejs.renderFile(template, {
    //     message: "Code",
    //     content: authCode
    // }, {}, (err, response) => callback(err, new Buffer(response || '')));

    if (!authCode) return ejs.renderFile(template, {
        message: "Failure",
        content: params.kwargs.error || "No auth code given. Try again? "
    }, {}, (err, response) => callback(err, new Buffer(response || '')));

    var mongo = require('./mongo');
    var controller = Botkit.slackbot({
        storage: mongo()
    });

    async.auto({
        auth: (callback) => {
            //post code, app ID, and app secret, to get token
            var authAddress = 'https://slack.com/api/oauth.access?'
            authAddress += 'client_id=' + process.env.SLACK_ID
            authAddress += '&client_secret=' + process.env.SLACK_SECRET
            authAddress += '&code=' + authCode
            authAddress += '&redirect_uri=' + process.env.SLACK_REDIRECT;

            Request.get(authAddress, function (error, response, body) {
                if (error) return callback(error);

                var auth = JSON.parse(body);

                if (!auth.ok) return callback(new Error(auth.error));

                callback(null, auth);
            });
        },
        identity: ['auth', (results, callback) => {
            //first, get authenticating user ID
            var auth = (results || {}).auth || {};
            var url = 'https://slack.com/api/auth.test?'
            url += 'token=' + auth.access_token

            Request.get(url, (error, response, body) => {
                if (error) return callback(error);
                try {
                    identity = JSON.parse(body);

                    var team = {
                        id: identity.team_id,
                        identity: identity,
                        auth: auth,
                        createdBy: identity.user_id,
                        url: identity.url,
                        name: identity.team
                    };

                    return callback(null, identity);
                } catch(e) {
                    return callback(e);
                }
            });
        }],
        user: ['identity', (results, callback) => {
            var auth = (results || {}).auth || {};
            var identity = (results || {}).identity || {};

            // what scopes did we get approved for?
            var scopes = auth.scope.split(/\,/);

            controller.storage.users.get(identity.user_id, (err, user) => {
                if (!user) {
                    user = {
                        id: identity.user_id,
                        access_token: auth.access_token,
                        scopes: scopes,
                        team_id: identity.team_id,
                        user: identity.user,
                    };
                }

                controller.storage.users.save(user, function(err, id) {
                    if (err) return callback(err)
                    return callback(null, user);
                });
            });
        }],
        team: ['identity', (results, callback) => {
            var auth = (results || {}).auth || {};
            var identity = (results || {}).identity || {};
            var scopes = auth.scope.split(/\,/);

            controller.storage.teams.get(identity.team_id, (err, team) => {
                if (!team) {
                    team = {
                        id: identity.team_id,
                        identity: identity,
                        bot: auth.bot,
                        auth: auth,
                        createdBy: identity.user_id,
                        url: identity.url,
                        name: identity.team,
                        access_token: auth.access_token
                    }
                }

                controller.storage.teams.save(team, (err, id) => {
                    if (err) return callback(err);
                    return callback(null, team);
                });
            });
        }]
    }, (err, results) => {
        if (err) return ejs.renderFile(template, {
            message: "Failure",
            content: err && err.message
        }, {}, (err, response) => callback(err, new Buffer(response || '')));

        ejs.renderFile(template, {
            message: "Success!",
            content: "You can now invite @hackernewsbot to your channels and use it!"
        }, {}, (err, response) => callback(err, new Buffer(response || '')));
    });
};
