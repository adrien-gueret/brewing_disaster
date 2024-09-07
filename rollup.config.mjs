import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";
import { terser } from "rollup-plugin-terser";

export default {
  input: "./scripts/web3/index.js",
  output: {
    file: "web3.js",
    format: "iife",
    sourcemap: false,
  },
  plugins: [
    resolve({
      browser: true,
      preferBuiltins: false,
    }),
    commonjs(),
    replace({
      "process.env.NODE_ENV": JSON.stringify("production"),
      preventAssignment: true,
    }),
    //terser(),
  ],
};
