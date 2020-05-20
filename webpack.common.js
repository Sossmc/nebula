const path = require('path')

module.exports = {
  module: {
    rules: [
      {
        test: /\.(js)$/,
        loader: 'eslint-loader',
        exclude: /node_modules/,
        enforce: 'pre',
        options: {
          fix: true,
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpe?g|gif|svg|eot|ttf|woff|woff2)$/i,
        loader: 'file-loader',
      },
    ],
  },
  output: {
    filename: 'nebula-vis.min.js',
    library: 'nebula-vis',
    libraryTarget: 'umd',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
}
