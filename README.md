# [gulp](https://github.com/gulpjs/gulp)-sane-watch
Version: **0.0.4**

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
## API

### saneWatch(glob, [options, callback])

#### glob
Type: `String`|`Array`

Creates watcher that will spy on files that were matched by `glob` which can be a
[`node-glob`](https://github.com/isaacs/node-glob) string or array of strings.

#### options
This object is passed to [`sane` options](https://github.com/amasad/sane#api) directly (refer to [`sane` documentation](https://github.com/amasad/sane)).

##### debounce
Type: `Integer`

Unit: `milliseconds`

Default: 0

##### verbose
Type: `Boolean`

Default: `true`

##### onChange, onAdd, onDelete
Type: `function(filename, path, stat)`

This function is called, when some group of events is happens on file-system.

#### callback
Type: `function(filename, path, stat)`

This function is called, when some group of events is happens on file-system.

# License
MIT (c) 2014 Gergely Kovács (gg.kovacs@gmail.com)
