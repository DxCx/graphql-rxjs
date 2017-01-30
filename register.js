'use strict';

var graphql = require('graphql');
var _patched = require('./graphql-build');

const PATCHED = [
  "executeReactive",
  "graphqlReactive"
]

function patchFunction(funcName) {
  Object.defineProperty(graphql, funcName, {
    enumerable: true,
    get: function get() {
      return _patched[funcName];
    },
  });
}

PATCHED.forEach(patchFunction);
