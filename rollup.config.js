"use strict";

import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import cleanup from 'rollup-plugin-cleanup';
import strip from 'rollup-plugin-strip';
import filesize from 'rollup-plugin-filesize';
import progress from 'rollup-plugin-progress';
import * as fs from 'fs';
import * as path from 'path';
import uglify from 'rollup-plugin-uglify';

const BABEL_PLUGIN_REPLACE = {
  './resources/inline-invariant': require('./graphql/resources/inline-invariant'),
  'transform-import-duplicate': require('./babel-plugin-transform-import-duplicate'),
};

const DEBUG = false;

// Load Original babel config
const babelConfig = JSON.parse(fs.readFileSync(path.join(
  __dirname,
  'graphql',
  '.babelrc'
), 'utf-8'));

const pkg = JSON.parse(fs.readFileSync(path.join(
  __dirname,
  'graphql',
  'package.json'
)));

const rxPkg = JSON.parse(fs.readFileSync(path.join(
  __dirname,
  'package.json'
)));

const external = Object.keys(pkg.dependencies || {})
  .concat(Object.keys(rxPkg.dependencies || {}))
  .concat([
    'rxjs/Observable',

    'graphql/type',
    'graphql/language',
    'graphql/language/source',
    'graphql/language/kinds',
    'graphql/language/parser',
    'graphql/language/ast',
    'graphql/validation',
    'graphql/validation/validate',
    'graphql/error',
    'graphql/utilities',
    'graphql/type/schema',
    'graphql/jsutils/find',
    'graphql/jsutils/invariant',
    'graphql/jsutils/isNullish',
    'graphql/utilities/typeFromAST',
    'graphql/execution/values',
    'graphql/type/definition',
    'graphql/type/schema',
    'graphql/type/introspection',
    'graphql/type/directives',
    'graphql/type/scalars',
    'graphql/subscription',
    'graphql/subscription/mapAsyncIterator',
  ]);

// Modify babel config.
babelConfig.plugins.unshift(
  ['transform-import-duplicate', {
    exclude: ['node_modules/**'],
    external,
    newFiles: [
      path.join(__dirname, "graphql", "src", "type", "reactiveDirectives.js"),
      path.join(__dirname, "graphql", "src", "utilities", "asyncIterator.js"),
    ],
    mapping: {
      [path.join(__dirname, "graphql", "src", "(.+?)\.js$")]:
      path.join(__dirname, "node_modules", "graphql", "$1.js.flow"),
    }
  }]
);
babelConfig.plugins.push('external-helpers');
babelConfig.babelrc = false;
babelConfig.runtimeHelpers = true;
babelConfig.presets[0][1].modules = false;

// Replace local plugins with required version.
babelConfig.plugins = babelConfig.plugins.map((plugin) => {
  let name = plugin;
  let args = [];
  if ( Array.isArray(plugin) ) {
    name = plugin.shift();
    args = plugin;
  }
  if ( typeof name === 'string' ) {
    const replaceIndex = Object.keys(BABEL_PLUGIN_REPLACE).indexOf(name);
    if (replaceIndex !== -1) {
      name = BABEL_PLUGIN_REPLACE[name];
    }
  }

  return args.length > 0 ? [name, ...args] : name;
});

const productionPlugins = [
  strip(),
  cleanup({
    maxEmptyLines: 1,
    comments: "none",
  }),
  uglify(),
];
if ( DEBUG ) {
  productionPlugins.length = 0;
}

export default {
    entry: 'src/index.js',
    format: 'cjs',
    plugins: [
      filesize(),
      progress(),
      nodeResolve({
        jsnext: true,
        module: true,
      }),
      commonjs({
        include: [
          'node_modules/graphql/**',
          'node_modules/iterall/**',
          'node_modules/rxjs/**',
        ],
      }),
      babel(babelConfig),
      ...productionPlugins,
    ],
    dest: 'dist/bundle.js',
    external,
};
