var Request          = require('request')
var async            = require('async');
var ejs              = require('ejs');
var template         = __dirname + "/view.ejs";

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
    ejs.renderFile(template, process.env, {}, (err, response) => callback(err, new Buffer(response || '')));
};
