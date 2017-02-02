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

const babelTransformDuplicate = require('./babel-plugin-transform-import-duplicate.js');

const pkg = JSON.parse(fs.readFileSync('./package.json')),
      external = Object.keys(pkg.peerDependencies || {})
      .concat([
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
      ]);

export default {
    entry: 'graphql/src/index.js',
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
      babel({
        babelrc: false,
        runtimeHelpers: true,
        plugins: [
          [babelTransformDuplicate, {
              exclude: ['node_modules/**'],
              external,
              mapping: {
                [path.join(__dirname, "graphql", "src", "(.+?)\.js$")]:
                 path.join(__dirname, "node_modules", "graphql", "$1.js.flow"),
              }
          }],
          "syntax-async-functions",
          "transform-class-properties",
          "transform-flow-strip-types",
          "transform-object-rest-spread",
          "transform-es2015-template-literals",
          "transform-es2015-literals",
          "transform-es2015-function-name",
          "transform-es2015-arrow-functions",
          "transform-es2015-block-scoped-functions",
          ["transform-es2015-classes", {loose: true}],
          "transform-es2015-object-super",
          "transform-es2015-shorthand-properties",
          "transform-es2015-duplicate-keys",
          "transform-es2015-computed-properties",
          "check-es2015-constants",
          ["transform-es2015-spread", {loose: true}],
          "transform-es2015-parameters",
          ["transform-es2015-destructuring", {loose: true}],
          "transform-es2015-block-scoping",
          "transform-regenerator",
          "transform-es3-property-literals",
          "external-helpers",
        ],
      }),
      strip(),
      cleanup({
        maxEmptyLines: 1,
        comments: "none",
      }),
      uglify(),
    ],
    dest: 'dist/bundle.js',
    external,
};
