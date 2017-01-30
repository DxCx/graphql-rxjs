var _patched = require('./graphql-build');
var _graphql = require('graphql');

const MODIFIED = [
  "execute",
  "executeReactive",
  "graphql",
  "graphqlReactive"
]

function getPatched(funcName) {
  return {
    enumerable: true,
    get: function get() {
      return _patched[funcName];
    },
  };
}

function getOriginal(funcName) {
  return {
    enumerable: true,
    get: function get() {
      return _graphql[funcName];
    },
  };
}

function autoGetter(funcName) {
  const func = MODIFIED.indexOf(funcName) === -1 ? getOriginal : getPatched;
  return func(funcName);
}

Object.defineProperty(exports, "__esModule", {
  value: true
});

Object.keys(_patched).forEach(function (funcName) {
  Object.defineProperty(exports, funcName, autoGetter(funcName));
});
