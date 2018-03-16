# [gulp](https://github.com/gulpjs/gulp)-sane-watch [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url]
Version: **2.0.4**

## Installation

Run `npm install gulp-sane-watch`

## Usage

```js
var gulp = require('gulp');
var saneWatch = require('gulp-sane-watch');

gulp.task('watch', function() {
    saneWatch('css/**/*.css', function() {
        gulp.start('styles');
    });
});
```

```js
var gulp = require('gulp');
var saneWatch = require('gulp-sane-watch');

gulp.task('watch', function() {
    saneWatch('css/**/*.css', {debounce: 300}, function() {
        gulp.start('styles');
    });
});
```

```js
var gulp = require('gulp');
var saneWatch = require('gulp-sane-watch');

gulp.task('watch', function() {
    saneWatch('css/**/*.css', {
        events: ['onChange', 'onAdd']
    }, function() {
        gulp.start('styles');
    });
});
```

```js
var gulp = require('gulp');
var saneWatch = require('gulp-sane-watch');

gulp.task('watch', function() {
    saneWatch('css/**/*.css', {
        debounce: 300,
        onChange: function() {
            gulp.start('change');
        },
        onAdd: function() {
            gulp.start('add');
        },
        onDelete: function() {
            gulp.start('delete');
        }
    });
});
```

```js
var gulp = require('gulp');
var saneWatch = require('gulp-sane-watch');

gulp.task('watch', function() {
    saneWatch('css/**/*.css', {
        saneOptions: {
            poll: true
        }
    }, function() {
        gulp.start('styles');
    });
});
```

## API

### saneWatch(glob, [options, callback])

#### glob
- Type: `String` | `Array`

Creates watcher that will spy on files that were matched by `glob` which can be a
[`node-glob`](https://github.com/isaacs/node-glob) string or array of strings.

#### options

##### saneOptions

This object is passed to [`sane` options](https://github.com/amasad/sane#api) directly (refer to [`sane` documentation](https://github.com/amasad/sane)).

##### debounce
- Type: `Integer`
- Unit: `milliseconds`
- Default: 0

##### verbose
- Type: `Boolean`
- Default: `true`

##### onChange, onAdd, onDelete, onReady
- Type: `function(filename, path, stat)`

This function is called, when some group of events is happens on file-system.

onDelete function parameter list does not include `stat` parameter.

onReady function parameter list does not include any parameter.

##### events
- Type: `Array`
- Default: `['onChange', 'onAdd', 'onDelete']`

List of events, that should be watched by `gulp-sane-watch`. Contains [event names from `sane`](https://github.com/amasad/sane#api).

#### callback
- Type: `function(filename, path, stat)`

This function is called, when some group of events is happens on file-system.

# License
MIT © 2018 Gergely Kovács (gg.kovacs@gmail.com)

[npm-image]: https://badge.fury.io/js/gulp-sane-watch.svg
[npm-url]: https://npmjs.org/package/gulp-sane-watch
[travis-image]: https://travis-ci.org/ggkovacs/gulp-sane-watch.svg?branch=master
[travis-url]: https://travis-ci.org/ggkovacs/gulp-sane-watch
[daviddm-image]: https://david-dm.org/ggkovacs/gulp-sane-watch.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/ggkovacs/gulp-sane-watch
