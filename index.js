'use strict';

/**
 * Requires
 */
var util = require('gulp-util');
var PluginError = util.PluginError;
var sane = require('sane');
var glob2base = require('glob2base');
var glob = require('glob');

/**
 * PLUGIN_NAME
 * @type {String}
 */
var PLUGIN_NAME = 'gulp-sane-watch';

/**
 * Noop
 */
function noop() {}

/**
 * Parse glob
 * @param  {String} str
 * @return {Object}
 */
function parseGlob(str) {
    var rs = {};
    rs.dir = glob2base(new glob.Glob(str));
    rs.glob = str.replace(rs.dir, '');
    return rs;
}

/**
 * Gulp Sane Watch
 * @param {String|Array}   globs
 * @param {Object}   opts
 * @param {Function} cb
 */
function gulpSaneWatch(globs, opts, cb) {
    if (typeof globs === 'undefined') {
        throw new PluginError(PLUGIN_NAME, 'glob argument required');
    }

    if (typeof globs === 'string') {
        globs = [globs];
    }

    if (!Array.isArray(globs)) {
        throw new PluginError(PLUGIN_NAME, 'glob should be String or Array, not ' + (typeof globs));
    }

    if (typeof opts === 'function') {
        cb = opts;
        opts = {};
    }

    if (typeof cb === 'undefined') {
        cb = noop;
    }

    globs.forEach(function(item) {
        item = parseGlob(item);
        var watcher = sane(item.dir, item.glob, opts || {});

        watcher.on('change', function(filepath, root) {
            log('1 file changed', filepath);
            cb(filepath, root, 'change');
        });

        watcher.on('add', function(filepath, root) {
            log('1 file added', filepath);
            cb(filepath, root, 'add');
        });

        watcher.on('delete', function(filepath, root) {
            log('1 file deleted', filepath);
            cb(filepath, root, 'delete');
        });
    });

    /**
     * Log
     * @param {String} msg
     * @param {String} param
     */
    function log(msg, param) {
        console.log('[' + util.colors.green(PLUGIN_NAME) + '] ' + util.colors.cyan(msg) + ' (' + util.colors.magenta(param) + ')');
    }
}

module.exports = gulpSaneWatch;
