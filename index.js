'use strict';

/**
 * Requires
 */
var util = require('gulp-util');
var PluginError = util.PluginError;
var sane = require('sane');

/**
 * PLUGIN_NAME
 * @type {String}
 */
var PLUGIN_NAME = 'gulp-sane-watch';

/**
 * Gulp Sane Watch
 * @param  {String|Array}   globs
 * @param  {Object}   options
 * @param  {Function} callback
 */
function gulpSaneWatch(globs, options, callback) {
    if (typeof globs === 'undefined') {
        throw new PluginError(PLUGIN_NAME, 'glob argument required');
    }

    if (typeof globs === 'string') {
        globs = [globs];
    }

    if (!Array.isArray(globs)) {
        throw new PluginError(PLUGIN_NAME, 'glob should be String or Array, not ' + (typeof globs));
    }

    if (typeof options === 'function') {
        callback = options;
        options = {};
    }

    if (typeof options === 'undefined') {
        options = {};
    }

    if (typeof callback === 'undefined') {
        callback = function() {};
    }

    globs.forEach(function(glob) {
        var watcher = sane(glob[0], glob[1], options);
        watcher.on('change', function(filepath, root, stat) {
            util.log(util.colors.cyan('1 file changed'), '(' + util.colors.magenta(filepath) + ')');
            callback(filepath, root, stat);
        });
        watcher.on('add', function(filepath, root, stat) {
            util.log(util.colors.cyan('1 file added'), '(' + util.colors.magenta(filepath) + ')');
            callback(filepath, root, stat);
        });
        watcher.on('delete', function(filepath, root, stat) {
            util.log(util.colors.cyan('1 file deleted'), '(' + util.colors.magenta(filepath) + ')');
            callback(filepath, root, stat);
        });
    });
}

module.exports = gulpSaneWatch;
