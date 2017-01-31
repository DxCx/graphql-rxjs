import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import cleanup from 'rollup-plugin-cleanup';

export default {
    entry: 'js/index.js',
    //format: 'iife',
    format: 'cjs',
    plugins: [
      babel({
        babelrc: false,
        runtimeHelpers: true,
        presets: [
          ["es2015", { "modules": false }],
        ],
        plugins: ["external-helpers", "syntax-flow", "transform-flow-strip-types", "transform-object-rest-spread"],
      }),
      nodeResolve({ jsnext: true, module: true }),
      commonjs({
        include: 'node_modules/**',
      }),
      cleanup({
        maxEmptyLines: 1,
        comments: "none",
      }),
    ],
    dest: 'dist/bundle.js',
    external: [ 'graphql', 'iterall', 'rxjs' ],
};
