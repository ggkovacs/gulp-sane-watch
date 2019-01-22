'use strict';

const c = require('ansi-colors');
const PluginError = require('plugin-error');
const sane = require('sane');
const glob2base = require('./glob2base');
const glob = require('glob');
const extend = require('extend');
const debounce = require('debounce');
const path = require('path');

const PLUGIN_NAME = 'gulp-sane-watch';

const defaults = {
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
  const rs = {};

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
  let str = `[${c.green(PLUGIN_NAME)}] ${c.cyan(message)}`;

  if (subMessage) {
    str += ` (${c.magenta(subMessage)})`;
  }

  console.log(str);
}

function gulpSaneWatch(globs, opts, cb) {
  const events = {
    onDelete(filename, path) {
      if (opts.verbose) {
        log('1 file deleted', filename);
      }

      opts.onDelete(filename, path);
    },
    onChange(filename, path, stat) {
      if (opts.verbose) {
        log('1 file changed', filename);
      }

      opts.onChange(filename, path, stat);
    },
    onAdd(filename, path, stat) {
      if (opts.verbose) {
        log('1 file added', filename);
      }

      opts.onAdd(filename, path, stat);
    },
    onReady() {
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
    throw new PluginError(PLUGIN_NAME, `glob should be String or Array, not ${typeof globs}`);
  }

  if (typeof opts === 'function') {
    cb = opts;
    opts = {};
  }

  opts = extend(true, {}, defaults, opts);

  const isDebounce = opts.debounce > 0;
  const eventsLength = opts.events.length;
  let i;

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

  const watchers = [];
  i = globs.length;

  while (i--) {
    const item = parseGlob(globs[i]);

    const saneOpts = extend(true, {}, opts.saneOptions, {
      glob: item.glob
    });

    const watcher = sane(item.dir, saneOpts);

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
