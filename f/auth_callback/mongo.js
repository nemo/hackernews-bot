var db = require('monk');
/**
 * botkit-storage-mongo - MongoDB driver for Botkit
 *
 * @param  {Object} config
 * @return {Object}
 */
module.exports = function() {
    if (!process.env.MONGO_URL) throw new Error('Need to provide mongo address.');

    var Teams = db(process.env.MONGO_URL).get('teams'),
        Users = db(process.env.MONGO_URL).get('users'),
        Channels = db(process.env.MONGO_URL).get('channels');

    var unwrapFromList = function(cb) {
        return function(err, data) {
            if (err) return cb(err);
            cb(null, data);
        };
    };

    var storage = {
        teams: {
            get: function(id, cb) {
                Teams.findOne({id: id}, unwrapFromList(cb));
            },
            save: function(data, cb) {
                Teams.findOneAndUpdate({
                    id: data.id
                }, data, {
                    upsert: true,
                    new: true
                }, cb);
            },
            all: function(cb) {
                Teams.find({}, cb);
            }
        },
        users: {
            get: function(id, cb) {
                Users.findOne({id: id}, unwrapFromList(cb));
            },
            save: function(data, cb) {
                Users.findOneAndUpdate({
                    id: data.id
                }, data, {
                    upsert: true,
                    new: true
                }, cb);
            },
            all: function(cb) {
                Users.find({}, cb);
            }
        },
        channels: {
            get: function(id, cb) {
                Channels.findOne({id: id}, unwrapFromList(cb));
            },
            save: function(data, cb) {
                Channels.findOneAndUpdate({
                    id: data.id
                }, data, {
                    upsert: true,
                    new: true
                }, cb);
            },
            all: function(cb) {
                Channels.find({}, cb);
            }
        }
    };

    return storage;
};
