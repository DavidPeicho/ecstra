import replace from "@rollup/plugin-replace";
import { terser } from "rollup-plugin-terser";

export default [
  {
    input: 'dist/index.js',
    plugins: [
      replace({
        'process.env.NODE_ENV': JSON.stringify('development'),
        delimiters: ['', '']
      })
    ],
    output: [
      {
        format: 'umd',
        name: 'FECS',
        noConflict: true,
        file: 'dist/umd/ecstra.js'
      }
    ]
  },
  {
    input: "dist/index.js",
    plugins: [
      replace({
        'process.env.NODE_ENV': JSON.stringify('production'),
        delimiters: ['', '']
      }),
      terser()
    ],
    output: [
      {
        format: 'umd',
        name: 'FECS',
        noConflict: true,
        file: 'dist/umd/ecstra.min.js'
      }
    ]
  }
];
