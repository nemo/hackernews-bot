var async = require('async');
var _ = require('lodash');
var Request = require('request');
var util = require('util');
var HN_API_BASE = "https://hacker-news.firebaseio.com/v0/";

exports.api = function(options, callback) {
    if (!options) throw new Error("HN.api.options is required");
    if (!options.path) throw new Error("HN.api.options.path is required");

    var urlPath = util.format("%s%s%s.json", HN_API_BASE, options.path, options.id ? ("/" + options.id) : '');

    console.log("urlPath", urlPath);
    Request.get(urlPath, options.query || {}, (err, response, body) => {
        if (err) return callback(err);
        return callback(null, JSON.parse(body));
    })
};

exports.item = function(id, callback) {
    exports.api({
        path: 'item',
        id: id
    }, callback);
};

exports.topStories = function(options, callback) {
    if (_.isFunction(options)) {
        callback = options;
        options = {};
    }

    exports.api({
        path: 'topstories',
        query: options || {}
    }, (err, storyIds) => {
        if (err) return callback(err);

        async.map(_.slice(storyIds, 0, 5), (storyId, cb) => exports.item(storyId, cb), callback)
    });
};

exports.newStories = function(options, callback) {
    if (_.isFunction(options)) {
        callback = options;
        options = {};
    }

    exports.api({
        path: 'newstories',
        query: options || {}
    }, (err, storyIds) => {
        if (err) return callback(err);

        async.map(_.slice(storyIds, 0, 5), (storyId, cb) => exports.item(storyId, cb), callback);
    });
};

exports.bestStories = function(options, callback) {
    if (_.isFunction(options)) {
        callback = options;
        options = {};
    }

    exports.api({
        path: 'beststories',
        query: options || {}
    }, (err, storyIds) => {
        if (err) return callback(err);

        async.map(_.slice(storyIds, 0, 5), (storyId, cb) => exports.item(storyId, cb), callback);
    })
};

exports.askStories = function(options, callback) {
    if (_.isFunction(options)) {
        callback = options;
        options = {};
    }

    exports.api({
        path: 'askstories',
        query: options || {}
    }, (err, storyIds) => {
        if (err) return callback(err);

        async.map(_.slice(storyIds, 0, 5), (storyId, cb) => exports.item(storyId, cb), callback);
    })
};


exports.showStories = function(options, callback) {
    if (_.isFunction(options)) {
        callback = options;
        options = {};
    }

    exports.api({
        path: 'showstories',
        query: options || {}
    }, (err, storyIds) => {
        if (err) return callback(err);

        async.map(_.slice(storyIds, 0, 5), (storyId, cb) => exports.item(storyId, cb), callback);
    })
};


exports.jobStories = function(options, callback) {
    if (_.isFunction(options)) {
        callback = options;
        options = {};
    }

    exports.api({
        path: 'jobstories',
        query: options || {}
    }, (err, storyIds) => {
        if (err) return callback(err);

        async.map(_.slice(storyIds, 0, 5), (storyId, cb) => exports.item(storyId, cb), callback);
    })
};


exports.chain = function(chain, callback) {
    async.map(chain, (funcName, callback) => {
        if (!exports[funcName]) return callback(null, []);

        exports[funcName](callback);
    }, (err, results) => {
        if (err) return callback(err);

        return callback(null, _.flatten(results));
    });
};
