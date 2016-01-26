'use strict';

var util = require('gulp-util');
var PluginError = util.PluginError;
var sane = require('sane');
var glob2base = require('./glob2base');
var glob = require('glob');
var extend = require('extend');
var debounce = require('debounce');

var PLUGIN_NAME = 'gulp-sane-watch';

var defaults = {
    debounce: 0,
    onChange: null,
    onAdd: null,
    onDelete: null,
    onReady: null,
    verbose: true,
    saneOptions: {},
    events: ['onDelete', 'onChange', 'onAdd']
};

function parseGlob(str) {
    var rs = {};

    rs.dir = glob2base(new glob.Glob(str));
    rs.glob = str.replace(rs.dir, '');

    return rs;
}

function log(message, subMessage) {
    var str = '[' + util.colors.green(PLUGIN_NAME) + '] ' + util.colors.cyan(message);

    if (subMessage) {
        str += ' (' + util.colors.magenta(subMessage) + ')';
    }

    console.log(str);
}

function gulpSaneWatch(globsArg, optsArg, cbArg) {
    var globs = globsArg;
    var opts = optsArg;
    var cb = cbArg;
    var watchers;
    var i;
    var isDebounce;
    var watcher;
    var item;
    var saneOpts;
    var eventsLength;

    var events = {
        onDelete: function(filename, path) {
            if (opts.verbose) {
                log('1 file deleted', filename);
            }

            opts.onDelete(filename, path);
        },
        onChange: function(filename, path, stat) {
            if (opts.verbose) {
                log('1 file changed', filename);
            }

            opts.onChange(filename, path, stat);
        },
        onAdd: function(filename, path, stat) {
            if (opts.verbose) {
                log('1 file added', filename);
            }

            opts.onAdd(filename, path, stat);
        },
        onReady: function() {
            if (opts.verbose) {
                log('ready');
            }
        }
    };

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

    opts = extend(true, {}, defaults, opts);
    isDebounce = opts.debounce > 0;
    eventsLength = opts.events.length;

    if (typeof cb === 'function') {
        if (isDebounce) {
            cb = debounce(cb, opts.debounce);
        }

        if (opts.events) {
            i = eventsLength;

            while (i--) {
                opts[opts.events[i]] = cb;
            }
        } else {
            opts.onChange = opts.onAdd = opts.onDelete = cb;
        }
    } else {
        i = eventsLength;

        while (i--) {
            if (typeof opts[opts.events[i]] === 'function') {
                if (isDebounce) {
                    opts[opts.events[i]] = debounce(opts[opts.events[i]], opts.debounce);
                } else {
                    opts[opts.events[i]] = opts[event];
                }
            }
        }
    }

    watchers = [];
    i = globs.length;

    while (i--) {
        item = parseGlob(globs[i]);

        saneOpts = extend(true, {}, opts.saneOptions, {
            glob: item.glob
        });

        watcher = sane(item.dir, saneOpts);

        if (opts.onChange && opts.events.indexOf('onChange') !== -1) {
            watcher.on('change', events.onChange);
        }

        if (opts.onAdd && opts.events.indexOf('onAdd') !== -1) {
            watcher.on('add', events.onAdd);
        }

        if (opts.onDelete && opts.events.indexOf('onDelete') !== -1) {
            watcher.on('delete', events.onDelete);
        }

        if (opts.onReady && opts.events.indexOf('onReady') !== -1) {
            watcher.on('ready', events.onReady);
        }

        watchers.push(watcher);
    }

    return watchers;
}

module.exports = gulpSaneWatch;
