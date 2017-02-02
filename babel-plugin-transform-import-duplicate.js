const pathModule = require('path')
const fs = require('fs')
const nodeResolveSync = require('resolve').sync;
const wrapListener = require('babel-plugin-detective/wrap-listener');
const miniMatch = require('minimatch');

const FILES_EQUAL_CACHE = {};
function filesEqual(source, target) {
  if ( false === FILES_EQUAL_CACHE.hasOwnProperty(source) ) {
    FILES_EQUAL_CACHE[source] = {};
  }

  if ( false === FILES_EQUAL_CACHE[source].hasOwnProperty(target) ) {
    const equal = fs.readFileSync(source, "utf-8") === fs.readFileSync(target, "utf-8");
    FILES_EQUAL_CACHE[source][target] = equal;
  }

  return FILES_EQUAL_CACHE[source][target];
}

function resolveTarget(inPath) {
  let nodeModule = inPath.match(/node_modules\/(.+?)\..+?$/);
  if ( (null === nodeModule) || (nodeModule.length === 0) ) {
    throw new Error(`couldn't resolve ${inPath} back to node_module`);
  }
  nodeModule = nodeModule[1];

  if ( nodeModule.endsWith('index') ) {
    nodeModule = pathModule.dirname(nodeModule);
  }

  return nodeModule;
}

function handleMapping(path, file, externals, originalPath, target) {
  if ( false === filesEqual(originalPath, target) ) {
    // Files are not equal, cannot replace.
    return;
  }

  // Files are equal, resolve dependancy and replace import
  const resolvedTarget = resolveTarget(target);
  if ( externals.indexOf(resolvedTarget) <= -1 ) {
    // Sanity to make sure it is known export.
    throw new Error(`${resolvedTarget} is not an external, please add it to both plugin and rollup externals`);
  }

  path.node.value = resolvedTarget;
}

function handleImport(path, file, opts) {
  const dirName = pathModule.dirname(file.parserOpts.sourceFileName);
  const importPath = nodeResolveSync(pathModule.join(dirName, path.node.value));

  // Search for the mapping;
  const matching = Object.keys(opts.mapping).map((key) => {
    const regexKey = new RegExp(key);
    const match = importPath.match(regexKey);
    if ( !match || match.length === 0 ) {
      return undefined;
    }
    return importPath.replace(regexKey, opts.mapping[key]);
  })
  .filter((v) => v)
  .map((v) => pathModule.resolve(v));

  if ( matching.length === 0 ) {
    // Mapping does not exists
    return;
  } else if ( matching.length !== 1 ) {
    // More then one mapping.
    throw new Error('more then one matching! please check your config');
  }

  // Mapping found :)
  return handleMapping(path, file, opts.externals, importPath, matching[0]);
}

function onImportListener(path, file, opts) {
  const mapping = (opts && opts.mapping) || undefined;
  const exclude = opts.exclude || [];
  const externals = opts.external || [];

  // Make sure mapping exists
  if ( undefined === mapping ) {
    throw new Error('mapping option is missing');
  }

  opts.exclude = exclude;
  opts.externals = externals;

  // filter literal values
  if (false === path.isLiteral()) {
    return;
  }
  const relPath = pathModule.relative(__dirname, file.parserOpts.sourceFileName);

  // Filter excluded & non-relative.
  let excluded = exclude.reduce((lastResult, globPath) => {
    if ( lastResult === true ) {
      return lastResult;
    }

    return miniMatch(relPath, globPath);
  }, false);

  // filter non-relative
  excluded = excluded || (!path.node.value) || (false === path.node.value.startsWith('.'));
  if (excluded) {
    return;
  }

  return handleImport(path, file, opts);
}

module.exports = wrapListener(onImportListener, 'transform-import-duplicate');
