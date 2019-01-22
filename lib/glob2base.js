'use strict';

const path = require('path');
const findIndex = require('find-index');

const flattenGlob = function(arr) {
  const out = [];
  let flat = true;
  let i;
  let l;

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

const flattenExpansion = function(set) {
  const [first] = set;
  const toCompare = set.slice(1);

  const id = findIndex(first, (v, idx) => {
    if (typeof v !== 'string') {
      return true;
    }

    const matched = toCompare.every(arr => v === arr[idx]);

    return !matched;
  });

  return first.slice(0, id);
};

const setToBase = function(set) {
  if (set.length <= 1) {
    return flattenGlob(set[0]);
  }

  return flattenExpansion(set);
};

module.exports = function(glob) {
  const { set } = glob.minimatch;
  const baseParts = setToBase(set);
  const basePath = path.normalize(baseParts.join(path.sep)) + path.sep;

  return basePath;
};
