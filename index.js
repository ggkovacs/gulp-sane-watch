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
var debounce = require('debounce');

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
    debounce: 0,
    onChange: noop,
    onAdd: noop,
    onDelete: noop,
    verbose: true,
    saneOptions: {},
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
 * Log
 * @param {String} msg
 * @param {String} param
 */
function log(msg, param) {
    console.log('[' + util.colors.green(PLUGIN_NAME) + '] ' + util.colors.cyan(msg) + ' (' + util.colors.magenta(param) + ')');
}

/**
 * Gulp Sane Watch
 * @param  {String|Array} globs
 * @param  {Object}       opts
 * @param  {Function}     cb        Overrides other callbacks in opts
 * @return {Array}        watchers
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
        // Merge add and change events
        if (opts.debounce) {
            cb = debounce(cb, opts.debounce);
        }

        opts.onChange = opts.onAdd = opts.onDelete = cb;
    } else if (opts.debounce) {
        ['onDelete', 'onChange', 'onAdd'].forEach(function(event) {
            if (typeof opts[event] === 'function') {
                opts[event] = debounce(opts[event], opts.debounce);
            }
        });
    }

    opts = extend(true, {}, defaults, opts);

    var watchers = [];

    globs.forEach(function(item) {
        item = parseGlob(item);
        var saneOpts = extend(true, {}, opts.saneOptions, {glob: item.glob});
        watchers.push(
            sane(item.dir, saneOpts)
                .on('change', function(filename, path, stat) {
                    if (opts.verbose) {
                        log('1 file changed', filename);
                    }

                    opts.onChange(filename, path, stat);
                })
                .on('add', function(filename, path, stat) {
                    if (opts.verbose) {
                        log('1 file added', filename);
                    }

                    opts.onAdd(filename, path, stat);
                })
                .on('delete', function(filename, path) {
                    if (opts.verbose) {
                        log('1 file deleted', filename);
                    }

                    opts.onDelete(filename, path);
                })
        );
    });

    return watchers;
}

module.exports = gulpSaneWatch;
