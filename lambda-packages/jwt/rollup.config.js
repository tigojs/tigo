import path from 'path';
import { babel } from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import pkg from './package.json';

const extensions = ['.ts'];

const resolve = function (...args) {
  return path.resolve(__dirname, ...args);
};

export default {
  input: resolve('./main.ts'),
  output: {
    file: resolve('./', pkg.main),
    format: 'cjs',
    exports: 'default',
  },
  external: ['jsonwebtoken'],
  plugins: [
    nodeResolve({
      extensions,
      modulesOnly: true,
    }),
    babel({
      exclude: 'node_modules/**',
      babelHelpers: 'runtime',
      extensions,
    }),
  ],
};
