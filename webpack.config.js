const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  mode: 'development',
  entry: './src/main.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    chunkFilename: '[name].bundle.js',
  },
  resolve: {
    alias: {
      '@src': path.resolve(__dirname, 'src/'),
      '@config': path.resolve(__dirname, 'config/'),
    },
  },
  devServer: {
    proxy: {
      // proxy URLs to backend development server
      '/data/*': {
        target: 'http://localhost:8081',
        secure: false,
        changeOrigin: true,
      },
      '/comp/*': {
        target: 'http://localhost:8081',
        secure: false,
        changeOrigin: true,
      },
    },
    contentBase: path.join(__dirname, 'dist'),
    port: 8080,
    host: '0.0.0.0',
    hot: true,
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        enforce: 'pre',
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'eslint-loader',
        options: {
          cache: true,
          fix: true,
        },
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
          },
        },
      },
    ],
  },
  plugins: [new HtmlWebpackPlugin({ title: 'Coordination Demo' })],
}
