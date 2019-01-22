/* global describe, it, beforeEach, afterEach */

'use strict';

const should = require('chai').should(); // eslint-disable-line no-unused-vars
const fs = require('fs');
const path = require('path');
const temp = require('temp').track();
const watch = require('../index.js');

describe('watch', () => {
  let tempDir;
  let watchers = [];

  beforeEach((done) => {
    tempDir = temp.mkdirSync('gulp-sane-watch');
    done();
  });

  afterEach((done) => {
    watchers.forEach((watcher) => {
      watcher.close();
    });

    temp.cleanupSync();
    done();
  });

  function once(done) {
    const f = function() {
      if (!f.called) {
        f.called = true;
        done();
      }
    };

    return f;
  }

  function allReady(watchers, cb) {
    let total = watchers.length;

    const makeReadyHandler = function() {
      total--;
      if (total === 0) {
        cb();
      }
    };

    for (let i = 0, l = total; i < l; i++) {
      watchers[i].on('ready', makeReadyHandler);
    }
  }

  it('should detect file creation', (done) => {
    done = once(done);

    const tempFile = path.join(tempDir, 'test.txt');
    const glob = path.join(tempDir, '*.txt');
    watchers = watch(glob, { verbose: false }, (filename, dir) => {
      const full = path.join(dir, filename);
      full.should.equal(tempFile);
      done();
    });

    allReady(watchers, () => {
      fs.writeFileSync(tempFile, 'created');
    });
  });

  it('should detect file change', (done) => {
    done = once(done);

    const tempFile = path.join(tempDir, 'test.txt');
    fs.writeFileSync(tempFile, 'created');
    const glob = path.join(tempDir, '*.txt');
    watchers = watch(glob, { verbose: false }, (filename, dir) => {
      const full = path.join(dir, filename);
      full.should.equal(tempFile);
      done();
    });

    allReady(watchers, () => {
      fs.writeFileSync(tempFile, 'changed');
    });
  });

  it('should detect file move', (done) => {
    done = once(done);

    const tempFile = path.join(tempDir, 'test.txt');
    const tempDir2 = temp.mkdirSync('gulp-sane-watch-2');
    const tempFile2 = path.join(tempDir2, 'test.txt');
    fs.writeFileSync(tempFile2, 'created');
    const glob = path.join(tempDir, '*.txt');
    watchers = watch(glob, { verbose: false }, (filename, dir) => {
      const full = path.join(dir, filename);
      full.should.equal(tempFile);
      done();
    });

    allReady(watchers, () => {
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

  it('should detect deleted directories', (done) => {
    done = once(done);

    const tempSubDir = path.join(tempDir, 'subdir');
    const tempFile = path.join(tempSubDir, 'test.txt');
    const tempDir2 = temp.mkdirSync('gulp-sane-watch-2');
    const tempSubDir2 = path.join(tempDir2, 'subdir');
    fs.mkdirSync(tempSubDir);
    fs.writeFileSync(tempFile, 'created');
    const glob = path.join(tempDir, '**', '*.txt');
    watchers = watch(glob, { verbose: false }, (filename, dir) => {
      const full = path.join(dir, filename);
      full.should.contain(path.join(tempSubDir));
      done();
    });

    allReady(watchers, () => {
      fs.renameSync(tempSubDir, tempSubDir2);
    });
  });

  it('should debounce callback', function(done) {
    let calledCount = 0;
    const helper = function() {
      calledCount++;
    };

    const tempFile = path.join(tempDir, 'test.txt');
    const glob = path.join(tempDir, '*.txt');
    watchers = watch(glob, {
      verbose: false,
      debounce: 300
    }, (filename, dir) => {
      const full = path.join(dir, filename);
      full.should.equal(tempFile);
      helper();
    });

    this.timeout(0);

    allReady(watchers, () => {
      fs.writeFileSync(tempFile, 'created');
      setTimeout(() => {
        fs.writeFileSync(tempFile, 'changed 1');
      }, 100);
      setTimeout(() => {
        fs.writeFileSync(tempFile, 'changed 2');
      }, 200);
      setTimeout(() => {
        calledCount.should.equal(1);
        done();
      }, 1000);
    });
  });

  it('should debounce events', function(done) {
    const calledCount = {
      changed: 0,
      added: 0,
      deleted: 0
    };
    const helper = function(event) {
      calledCount[event]++;
    };

    const tempFile = path.join(tempDir, 'test.txt');
    const glob = path.join(tempDir, '*.txt');

    watchers = watch(glob, {
      verbose: false,
      debounce: 300,
      onAdd(filename, dir) {
        const full = path.join(dir, filename);
        full.should.equal(tempFile);
        helper('added');
      },
      onChange(filename, dir) {
        const full = path.join(dir, filename);
        full.should.equal(tempFile);
        helper('changed');
      },
      onDelete(filename, dir) {
        const full = path.join(dir, filename);
        full.should.equal(tempFile);
        helper('deleted');
      }
    });

    this.timeout(0);

    allReady(watchers, () => {
      const timeout = 1000;

      fs.writeFileSync(tempFile, 'created');
      setTimeout(() => {
        fs.writeFileSync(tempFile, 'changed 1');
      }, 100);
      setTimeout(() => {
        fs.writeFileSync(tempFile, 'changed 2');
      }, 200);

      setTimeout(() => {
        calledCount.changed.should.equal(1);
        calledCount.added.should.equal(1);
        fs.unlinkSync(tempFile);
        setTimeout(() => {
          calledCount.deleted.should.equal(1);
          done();
        }, 1000);
      }, timeout);
    });
  });

  it('should support multiple globs', function(done) {
    const tempFile1 = path.join(tempDir, 'test.txt');
    const tempFile2 = path.join(tempDir, 'test.tst');
    const glob1 = path.join(tempDir, '*.txt');
    const glob2 = path.join(tempDir, '*.tst');

    const changed = {};
    changed[tempFile1] = false;
    changed[tempFile2] = false;

    fs.writeFileSync(tempFile1, 'created');

    watchers = watch([glob1, glob2], { verbose: false }, (filename, dir) => {
      const full = path.join(dir, filename);
      changed[full] = true;
    });

    this.timeout(0);
    allReady(watchers, () => {
      fs.writeFileSync(tempFile1, 'changed');
      fs.writeFileSync(tempFile2, 'created');

      setTimeout(() => {
        changed[tempFile1].should.equal(true);
        changed[tempFile2].should.equal(true);
        done();
      }, 1000);
    });
  });

  it('should support subdirectories', (done) => {
    done = once(done);

    const tempDir2 = path.join(tempDir, 'subdir');
    const tempFile = path.join(tempDir2, 'subtest.txt');
    const glob = path.join(tempDir, '**', '*.txt');

    fs.mkdirSync(tempDir2);

    watchers = watch(glob, { verbose: false }, (filename, dir) => {
      const full = path.join(dir, filename);
      if (full === tempDir2) {
        return;
      }

      full.should.equal(tempFile);
      done();
    });

    allReady(watchers, () => {
      fs.writeFileSync(tempFile, 'created');
    });
  });

  it('should support newly created subdirectories', (done) => {
    done = once(done);

    const tempDir2 = path.join(tempDir, 'subdir');
    const tempFile = path.join(tempDir2, 'subtest.txt');
    const glob = path.join(tempDir, '**', '*.txt');

    watchers = watch(glob, { verbose: false }, (filename, dir, stat) => {
      const full = path.join(dir, filename);
      if (stat && stat.isDirectory()) {
        return;
      }

      full.should.equal(tempFile);
      done();
    });

    allReady(watchers, () => {
      fs.mkdirSync(tempDir2);
      setTimeout(() => {
        fs.writeFileSync(tempFile, 'created');
      }, 400);
    });
  });

  it('should support separate callbacks', function(done) {
    done = once(done);

    const tempDir2 = path.join(tempDir, 'subdir');
    const globs1 = [
      path.join(tempDir, '**', '*.txt'),
      path.join(tempDir, '**', '*.tst')
    ];
    const globs2 = [
      path.join(tempDir, '**', '*.css'),
      path.join(tempDir, '**', '*.js')
    ];

    const tempFile1 = path.join(tempDir, 'test.txt');
    const tempFile2 = path.join(tempDir2, 'test.tst');
    const tempFile3 = path.join(tempDir, 'test.js');
    const tempFile4 = path.join(tempDir2, 'test.css');

    const files1 = {};
    const files2 = {};
    files1[tempFile1] = false;
    files1[tempFile2] = false;
    files2[tempFile3] = false;
    files2[tempFile4] = false;

    const watchers1 = watch(globs1, { verbose: false }, (filename, dir) => {
      const full = path.join(dir, filename);
      if (typeof files1[full] === 'undefined') {
        return;
      }

      files1[full] = true;
    });

    const watchers2 = watch(globs2, { verbose: false }, (filename, dir) => {
      const full = path.join(dir, filename);
      if (typeof files2[full] === 'undefined') {
        return;
      }

      files2[full] = true;
    });

    watchers = watchers1.concat(watchers2);

    this.timeout(0);
    allReady(watchers, () => {
      fs.mkdirSync(tempDir2);
      setTimeout(() => {
        let file;
        for (file in files1) {
          fs.writeFileSync(file, 'created');
        }

        for (file in files2) {
          fs.writeFileSync(file, 'created');
        }

        setTimeout(() => {
          let file;
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

    const tempFile = path.join(tempDir, 'test.txt~.part');
    const glob = path.join(tempDir, '*.txt');

    let calledCount = 0;
    watchers = watch(glob, { verbose: false }, () => {
      calledCount++;
    });

    this.timeout(0);
    allReady(watchers, () => {
      fs.writeFileSync(tempFile, 'created');
      setTimeout(() => {
        calledCount.should.equal(0);
        done();
      }, 1000);
    });
  });

  it('should support Windows with posix globs', (done) => {
    done = once(done);
    if (path.sep === '/') {
      console.warn('Platform is not Windows - run this test on Windows to see actual result');
    }
    const tempFile = path.join(tempDir, 'test.txt');
    fs.writeFileSync(tempFile, 'created');
    const glob = path.join(tempDir, '*.txt').replace(new RegExp('\\\\', 'g'), '/');
    watchers = watch(glob, { verbose: false }, (filename, dir) => {
      const full = path.join(dir, filename);
      full.should.equal(tempFile);
      done();
    });

    allReady(watchers, () => {
      fs.writeFileSync(tempFile, 'changed');
    });
  });

  it('should support posix with Windows globs', (done) => {
    done = once(done);
    if (path.sep === '\\') {
      console.warn('Platform is not posix - run this test on a posix system to see the actual result');
    }
    const tempFile = path.join(tempDir, 'test.txt');
    fs.writeFileSync(tempFile, 'created');
    const glob = path.join(tempDir, '*.txt').replace(new RegExp('/', 'g'), '\\');
    watchers = watch(glob, { verbose: false }, (filename, dir) => {
      const full = path.join(dir, filename);
      full.should.equal(tempFile);
      done();
    });

    allReady(watchers, () => {
      fs.writeFileSync(tempFile, 'changed');
    });
  });
});
