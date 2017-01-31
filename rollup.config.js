import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import cleanup from 'rollup-plugin-cleanup';
import strip from 'rollup-plugin-strip';
import filesize from 'rollup-plugin-filesize';
import progress from 'rollup-plugin-progress';
// import uglify from 'rollup-plugin-uglify';

export default {
    entry: 'js/index.js',
    //format: 'iife',
    format: 'cjs',
    plugins: [
      filesize(),
      progress(),
      nodeResolve({ jsnext: true, module: true }),
      commonjs({
        include: 'node_modules/**',
      }),
      babel({
        babelrc: false,
        runtimeHelpers: true,
        presets: [
          ["es2015", { "modules": false }],
        ],
        plugins: ["external-helpers", "syntax-flow", "transform-flow-strip-types", "transform-object-rest-spread"],
      }),
      strip(),
      cleanup({
        maxEmptyLines: 1,
        comments: "none",
      }),
      // uglify(),
    ],
    dest: 'dist/bundle.js',
    external: [ 'graphql', 'iterall', 'rxjs' ],
};
