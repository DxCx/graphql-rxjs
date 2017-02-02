const pathModule = require('path')
const fs = require('fs')
const nodeResolveSync = require('resolve').sync;
const wrapListener = require('babel-plugin-detective/wrap-listener');
const miniMatch = require('minimatch');
//var commonjsPlugin = require('rollup-plugin-commonjs');

// TODO:
// Cacheing

function resolveTarget(inPath) {
  let nodeModule = inPath.match(/node_modules\/(.+?)\..+?$/);
  if ( (null === nodeModule) || (nodeModule.length === 0) ) {
    throw new Error(`couldn't resolve ${inPath} back to node_module`);
  }
  nodeModule = nodeModule[1];

  if ( nodeModule.endsWith('index') ) {
    nodeModule = pathModule.dirname(nodeModule);
  }

 //return '\0commonjs-external:' + nodeModule;
  return nodeModule;
}

function handleMapping(path, file, externals, originalPath, target) {
  const filesEqual = fs.readFileSync(originalPath, "utf-8") === fs.readFileSync(target, "utf-8");
  if ( false === filesEqual ) {
    return;
  }
  const resolvedTarget = resolveTarget(target);

  if ( externals.indexOf(resolvedTarget) <= -1 ) {
    throw new Error(`${resolvedTarget} is not an external, please add it to both plugin and rollup externals`);
  }

  path.node.value = resolvedTarget;
}

function listener(path, file, opts) {
  const mapping = opts.mapping;
  const exclude = opts.exclude || [];
  const externals = opts.external || [];

  if ( undefined === mapping ) {
    throw new Error('mapping option is missing');
  }

  if (false === path.isLiteral()) {
    return;
  }
  const relPath = pathModule.relative(__dirname, file.parserOpts.sourceFileName);

  let excluded = exclude.reduce((lastResult, globPath) => {
    if ( lastResult === true ) {
      return lastResult;
    }

    return miniMatch(relPath, globPath);
  }, false);

  // Skip non-relative
  excluded = excluded || (!path.node.value) || (false === path.node.value.startsWith('.'));
  if (excluded) {
    return;
  }

  const dirName = pathModule.dirname(file.parserOpts.sourceFileName);
  const importPath = nodeResolveSync(pathModule.join(dirName, path.node.value));

  const matching = Object.keys(mapping).map((key) => {
    const regexKey = new RegExp(key);
    const match = importPath.match(regexKey);
    if ( !match || match.length === 0 ) {
      return undefined;
    }
    return importPath.replace(regexKey, mapping[key]);
  })
  .filter((v) => v)
  .map((v) => pathModule.resolve(v));

  if ( matching.length === 0 ) {
    return;
  } else if ( matching.length !== 1 ) {
    throw new Error('more then one matching! please check your config');
  }

  return handleMapping(path, file, externals, importPath, matching[0]);
}

module.exports = function(babel) {
  return wrapListener(listener, 'graphql')(babel);
}
