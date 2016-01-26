'use strict';

var path = require('path');
var findIndex = require('find-index');

var flattenGlob = function(arr) {
    var out = [];
    var flat = true;
    var i;
    var l;

    for (i = 0, l = arr.length; i < l; i++) {
        if (typeof arr[i] !== 'string') {
            flat = false;
            break;
        }
        out.push(arr[i]);
    }

    if (flat) {
        out.pop();
    }

    return out;
};

var flattenExpansion = function(set) {
    var first = set[0];
    var toCompare = set.slice(1);

    var id = findIndex(first, function(v, idx) {
        var matched;

        if (typeof v !== 'string') {
            return true;
        }

        matched = toCompare.every(function(arr) {
            return v === arr[idx];
        });

        return !matched;
    });

    return first.slice(0, id);
};

var setToBase = function(set) {
    if (set.length <= 1) {
        return flattenGlob(set[0]);
    }

    return flattenExpansion(set);
};

module.exports = function(glob) {
    var set = glob.minimatch.set;
    var baseParts = setToBase(set);
    var basePath = path.normalize(baseParts.join(path.sep)) + path.sep;

    return basePath;
};
