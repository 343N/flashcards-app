const path = require('path');
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin")
const nodeWebExternals = require("webpack-node-externals");

module.exports = {
  entry: './src/app.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  externals: [nodeWebExternals()],
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    fallback: {
        "fs": false,
        "path": false, 
        "http": false, 
        "constants": false, 
        "zlib": false, 
        "stream": false, 
    }
  },
  devtool: 'source-map',
  target: "node",
  mode: "development",
  output: {
    filename: 'app-bundle.js',
    path: path.resolve(__dirname, '.'),
  },
};