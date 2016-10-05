var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: './index.js',

  output: {
    path: 'assets',
    publicPath: '/assets/',
    filename: 'bundle.js'
  },

  module: {
    loaders: [{
      test: /\.js$/,
      loader: 'babel'
    }]
  },

  plugins: [
    //new webpack.DefinePlugin({ 'process.env': { NODE_ENV: '"production"' } }),
    //new webpack.optimize.DedupePlugin(),
    //new webpack.optimize.OccurrenceOrderPlugin(),
    //new webpack.optimize.UglifyJsPlugin()
  ]
};
