const merge = require('webpack-merge')
const common = require('./webpack.common.js')

module.exports = merge(common, {
  mode: 'development',
  entry: './src/index-dev.js',
  devtool: 'cheap-module-eval-source-map',
  devServer: {
    contentBase: './public',
    port: 8080,
    open: true,
  },
})
