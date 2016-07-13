/* global describe, it, beforeEach, afterEach */
'use strict';

var should = require('chai').should(); // eslint-disable-line no-unused-vars
var fs = require('fs');
var path = require('path');
var temp = require('temp').track();
var watch = require('../index.js');

describe('watch', function() {
    var tempDir;
    var watchers = [];

    beforeEach(function(done) {
        tempDir = temp.mkdirSync('gulp-sane-watch');
        done();
    });

    afterEach(function(done) {
        watchers.forEach(function(watcher) {
            watcher.close();
        });

        temp.cleanupSync();
        done();
    });

    function once(done) {
        var f = function() {
            if (!f.called) {
                f.called = true;
                done();
            }
        };

        return f;
    }

    function allReady(watchers, cb) {
        var total = watchers.length;

        var makeReadyHandler = function() {
            total--;
            if (total === 0) {
                cb();
            }
        };

        for (var i = 0, l = total; i < l; i++) {
            watchers[i].on('ready', makeReadyHandler);
        }
    }

    it('should detect file creation', function(done) {
        done = once(done);

        var tempFile = path.join(tempDir, 'test.txt');
        var glob = path.join(tempDir, '*.txt');
        watchers = watch(glob, {verbose: false}, function(filename, dir) {
            var full = path.join(dir, filename);
            full.should.equal(tempFile);
            done();
        });

        allReady(watchers, function() {
            fs.writeFileSync(tempFile, 'created');
        });
    });

    it('should detect file change', function(done) {
        done = once(done);

        var tempFile = path.join(tempDir, 'test.txt');
        fs.writeFileSync(tempFile, 'created');
        var glob = path.join(tempDir, '*.txt');
        watchers = watch(glob, {verbose: false}, function(filename, dir) {
            var full = path.join(dir, filename);
            full.should.equal(tempFile);
            done();
        });

        allReady(watchers, function() {
            fs.writeFileSync(tempFile, 'changed');
        });
    });

    it('should detect file move', function(done) {
        done = once(done);

        var tempFile = path.join(tempDir, 'test.txt');
        var tempDir2 = temp.mkdirSync('gulp-sane-watch-2');
        var tempFile2 = path.join(tempDir2, 'test.txt');
        fs.writeFileSync(tempFile2, 'created');
        var glob = path.join(tempDir, '*.txt');
        watchers = watch(glob, {verbose: false}, function(filename, dir) {
            var full = path.join(dir, filename);
            full.should.equal(tempFile);
            done();
        });

        allReady(watchers, function() {
            fs.renameSync(tempFile2, tempFile);
        });
    });

    // it('should detect moved directories', function(done) {
    //     done = once(done);

    //     var tempSubDir = path.join(tempDir, 'subdir');
    //     var tempDir2 = temp.mkdirSync('gulp-sane-watch-2');
    //     var tempFile2 = path.join(tempDir2, 'test.txt');
    //     fs.writeFileSync(tempFile2, 'created');
    //     var glob = path.join(tempDir, '**', '*.txt');
    //     watchers = watch(glob, {verbose: false}, function(filename, dir) {
    //         var full = path.join(dir, filename);
    //         full.should.equal(tempSubDir);
    //         done();
    //     });

    //     allReady(watchers, function() {
    //         fs.renameSync(tempDir2, tempSubDir);
    //     });
    // });

    it('should detect deleted directories', function(done) {
        done = once(done);

        var tempSubDir = path.join(tempDir, 'subdir');
        var tempFile = path.join(tempSubDir, 'test.txt');
        var tempDir2 = temp.mkdirSync('gulp-sane-watch-2');
        var tempSubDir2 = path.join(tempDir2, 'subdir');
        fs.mkdirSync(tempSubDir);
        fs.writeFileSync(tempFile, 'created');
        var glob = path.join(tempDir, '**', '*.txt');
        watchers = watch(glob, {verbose: false}, function(filename, dir) {
            var full = path.join(dir, filename);
            full.should.equal(path.join(tempSubDir));
            done();
        });

        allReady(watchers, function() {
            fs.renameSync(tempSubDir, tempSubDir2);
        });
    });

    it('should debounce callback', function(done) {
        var calledCount = 0;
        var helper = function() {
            calledCount++;
        };

        var tempFile = path.join(tempDir, 'test.txt');
        var glob = path.join(tempDir, '*.txt');
        watchers = watch(glob, {verbose: false, debounce: 300}, function(filename, dir) {
            var full = path.join(dir, filename);
            full.should.equal(tempFile);
            helper();
        });

        this.timeout(0);

        allReady(watchers, function() {
            fs.writeFileSync(tempFile, 'created');
            setTimeout(function() {
                fs.writeFileSync(tempFile, 'changed 1');
            }, 100);
            setTimeout(function() {
                fs.writeFileSync(tempFile, 'changed 2');
            }, 200);
            setTimeout(function() {
                calledCount.should.equal(1);
                done();
            }, 1000);
        });
    });

    it('should debounce events', function(done) {
        var calledCount = {
            changed: 0,
            added: 0,
            deleted: 0
        };
        var helper = function(event) {
            calledCount[event]++;
        };

        var tempFile = path.join(tempDir, 'test.txt');
        var glob = path.join(tempDir, '*.txt');

        watchers = watch(glob, {
            verbose: false,
            debounce: 300,
            onAdd: function(filename, dir) {
                var full = path.join(dir, filename);
                full.should.equal(tempFile);
                helper('added');
            },
            onChange: function(filename, dir) {
                var full = path.join(dir, filename);
                full.should.equal(tempFile);
                helper('changed');
            },
            onDelete: function(filename, dir) {
                var full = path.join(dir, filename);
                full.should.equal(tempFile);
                helper('deleted');
            }
        });

        this.timeout(0);

        allReady(watchers, function() {
            var timeout = 1000;

            fs.writeFileSync(tempFile, 'created');
            setTimeout(function() {
                fs.writeFileSync(tempFile, 'changed 1');
            }, 100);
            setTimeout(function() {
                fs.writeFileSync(tempFile, 'changed 2');
            }, 200);

            setTimeout(function() {
                calledCount.changed.should.equal(1);
                calledCount.added.should.equal(1);
                fs.unlinkSync(tempFile);
                setTimeout(function() {
                    calledCount.deleted.should.equal(1);
                    done();
                }, 1000);
            }, timeout);
        });
    });

    it('should support multiple globs', function(done) {
        var tempFile1 = path.join(tempDir, 'test.txt');
        var tempFile2 = path.join(tempDir, 'test.tst');
        var glob1 = path.join(tempDir, '*.txt');
        var glob2 = path.join(tempDir, '*.tst');

        var changed = {};
        changed[tempFile1] = false;
        changed[tempFile2] = false;

        fs.writeFileSync(tempFile1, 'created');

        watchers = watch([glob1, glob2], {verbose: false}, function(filename, dir) {
            var full = path.join(dir, filename);
            changed[full] = true;
        });

        this.timeout(0);
        allReady(watchers, function() {
            fs.writeFileSync(tempFile1, 'changed');
            fs.writeFileSync(tempFile2, 'created');

            setTimeout(function() {
                changed[tempFile1].should.equal(true);
                changed[tempFile2].should.equal(true);
                done();
            }, 1000);
        });
    });

    it('should support subdirectories', function(done) {
        done = once(done);

        var tempDir2 = path.join(tempDir, 'subdir');
        var tempFile = path.join(tempDir2, 'subtest.txt');
        var glob = path.join(tempDir, '**', '*.txt');

        fs.mkdirSync(tempDir2);

        watchers = watch(glob, {verbose: false}, function(filename, dir) {
            var full = path.join(dir, filename);
            if (full === tempDir2) {
                return;
            }

            full.should.equal(tempFile);
            done();
        });

        allReady(watchers, function() {
            fs.writeFileSync(tempFile, 'created');
        });
    });

    it('should support newly created subdirectories', function(done) {
        done = once(done);

        var tempDir2 = path.join(tempDir, 'subdir');
        var tempFile = path.join(tempDir2, 'subtest.txt');
        var glob = path.join(tempDir, '**', '*.txt');

        watchers = watch(glob, {verbose: false}, function(filename, dir, stat) {
            var full = path.join(dir, filename);
            if (stat && stat.isDirectory()) {
                return;
            }

            full.should.equal(tempFile);
            done();
        });

        allReady(watchers, function() {
            fs.mkdirSync(tempDir2);
            setTimeout(function() {
                fs.writeFileSync(tempFile, 'created');
            }, 400);
        });
    });

    it('should support separate callbacks', function(done) {
        done = once(done);

        var tempDir2 = path.join(tempDir, 'subdir');
        var globs1 = [
            path.join(tempDir, '**', '*.txt'),
            path.join(tempDir, '**', '*.tst')
        ];
        var globs2 = [
            path.join(tempDir, '**', '*.css'),
            path.join(tempDir, '**', '*.js')
        ];

        var tempFile1 = path.join(tempDir, 'test.txt');
        var tempFile2 = path.join(tempDir2, 'test.tst');
        var tempFile3 = path.join(tempDir, 'test.js');
        var tempFile4 = path.join(tempDir2, 'test.css');

        var files1 = {};
        var files2 = {};
        files1[tempFile1] = false;
        files1[tempFile2] = false;
        files2[tempFile3] = false;
        files2[tempFile4] = false;

        var watchers1 = watch(globs1, {verbose: false}, function(filename, dir) {
            var full = path.join(dir, filename);
            if (typeof files1[full] === 'undefined') {
                return;
            }

            files1[full] = true;
        });

        var watchers2 = watch(globs2, {verbose: false}, function(filename, dir) {
            var full = path.join(dir, filename);
            if (typeof files2[full] === 'undefined') {
                return;
            }

            files2[full] = true;
        });

        watchers = watchers1.concat(watchers2);

        this.timeout(0);
        allReady(watchers, function() {
            fs.mkdirSync(tempDir2);
            setTimeout(function() {
                var file;
                for (file in files1) {
                    fs.writeFileSync(file, 'created');
                }

                for (file in files2) {
                    fs.writeFileSync(file, 'created');
                }

                setTimeout(function() {
                    var file;
                    for (file in files1) {
                        files1[file].should.equal(true);
                    }

                    for (file in files2) {
                        files2[file].should.equal(true);
                    }

                    done();
                }, 1000);
            }, 400);
        });
    });

    it('should properly find files by extension', function(done) {
        done = once(done);

        var tempFile = path.join(tempDir, 'test.txt~.part');
        var glob = path.join(tempDir, '*.txt');

        var calledCount = 0;
        watchers = watch(glob, {verbose: false}, function() {
            calledCount++;
        });

        this.timeout(0);
        allReady(watchers, function() {
            fs.writeFileSync(tempFile, 'created');
            setTimeout(function() {
                calledCount.should.equal(0);
                done();
            }, 1000);
        });
    });
});
