'use strict';

var c = require('ansi-colors');
var PluginError = require('plugin-error');
var sane = require('sane');
var glob2base = require('./glob2base');
var glob = require('glob');
var extend = require('extend');
var debounce = require('debounce');
var path = require('path');

var PLUGIN_NAME = 'gulp-sane-watch';

var defaults = {
    debounce: 0,
    onChange: null,
    onAdd: null,
    onDelete: null,
    onReady: null,
    verbose: true,
    saneOptions: {},
    events: [
        'onDelete',
        'onChange',
        'onAdd'
    ]
};

function parseGlob(str) {
    var rs = {};

    if (str.indexOf('/' >= 0) && path.sep === '\\') {
        str = str.replace(new RegExp('/', 'g'), path.sep);
    } else if (str.indexOf('\\') >= 0 && path.sep === '/') {
        str = str
            .replace(new RegExp('\\\\', 'g'), path.sep)
            .replace(new RegExp('//', 'g'), path.sep);
    }

    rs.dir = glob2base(new glob.Glob(str));
    rs.glob = str.replace(rs.dir, '').split(path.sep).join('/');

    if (/^.\//.test(rs.glob) || /^.\\/.test(rs.glob)) {
        rs.glob = rs.glob.substr(2);
    }

    return rs;
}

function log(message, subMessage) {
    var str = '[' + c.green(PLUGIN_NAME) + '] ' + c.cyan(message);

    if (subMessage) {
        str += ' (' + c.magenta(subMessage) + ')';
    }

    console.log(str);
}

function gulpSaneWatch(globs, opts, cb) {
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

    var isDebounce = opts.debounce > 0;
    var eventsLength = opts.events.length;
    var i;

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
    } else if (isDebounce) {
        i = eventsLength;

        while (i--) {
            if (typeof opts[opts.events[i]] === 'function') {
                opts[opts.events[i]] = debounce(opts[opts.events[i]], opts.debounce);
            }
        }
    }

    var watchers = [];
    i = globs.length;

    while (i--) {
        var item = parseGlob(globs[i]);

        var saneOpts = extend(true, {}, opts.saneOptions, {
            glob: item.glob
        });

        var watcher = sane(item.dir, saneOpts);

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
