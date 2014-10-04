# [gulp](https://github.com/gulpjs/gulp)-sane-watch
Version: **0.1.x**

## Installation (soon)

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
## API

### saneWatch(glob, [options, callback])

#### glob
Type: `String` || `Array`

#### Options
This object is passed to [`sane` options](https://github.com/amasad/sane#api) directly (refer to [`sane` documentation](https://github.com/amasad/sane)).

#### Callback `function(filepath, root)`
This function is called, when some group of events is happens (change, add, delete) on file-system.
* filepath
* root

# License
MIT (c) 2014 Gergely Kovács (gg.kovacs@gmail.com)
