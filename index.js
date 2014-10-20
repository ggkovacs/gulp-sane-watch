'use strict';

/**
 * Requires
 */
var util = require('gulp-util');
var PluginError = util.PluginError;
var sane = require('sane');
var glob2base = require('glob2base');
var glob = require('glob');
var extend = require('extend');

/**
 * PLUGIN_NAME
 * @type {String}
 */
var PLUGIN_NAME = 'gulp-sane-watch';

/**
 * Defaults
 * @type {Object}
 */
var defaults = {
    callbackDelay: 0,
    onChange: noop,
    onAdd: noop,
    onDelete: noop
};

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
 * @param {String|Array} globs
 * @param {Object}       opts
 * @param {Function}     cb
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

    if (typeof cb === 'function') {
        opts.onChange = cb;
    }

    opts = extend(true, defaults, opts);

    var watcher;
    var timeout = {
        onChange: null,
        onAdd: null,
        onDelete: null
    };

    globs.forEach(function(item) {
        item = parseGlob(item);
        watcher = new sane.Watcher(item.dir, item.glob, opts)
            .on('change', function(filename, path) {
                log('1 file changed', filename);
                callbackWithDelay('change', filename, path);
            })
            .on('add', function(filename, path) {
                log('1 file added', filename);
                callbackWithDelay('add', filename, path);
            })
            .on('delete', function(filename, path) {
                log('1 file deleted', filename);
                callbackWithDelay('delete', filename, path);
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

    /**
     * Callback with delay
     * @param {String} eventName
     */
    function callbackWithDelay(eventName, filename, path) {
        eventName = 'on' + eventName.charAt(0).toUpperCase() + eventName.slice(1);
        if (opts.callbackDelay > 0) {
            clearTimeout(timeout[eventName]);
            timeout[eventName] = setTimeout(function() {
                opts[eventName](filename, path);
            }, opts.callbackDelay);
        } else {
            opts[eventName](filename, path);
        }
    }
}

module.exports = gulpSaneWatch;
