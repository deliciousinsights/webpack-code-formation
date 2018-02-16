const ExtractTextPlugin = require('extract-text-webpack-plugin')
const Path = require('path')

const PATHS = {
  build: Path.resolve(__dirname, 'dist'),
  source: Path.resolve(__dirname, 'src'),
}
const PROD = process.env.NODE_ENV === 'production'

const cssLoader = {
  loader: 'css-loader',
  options: {
    camelCase: 'only',
    importLoaders: 1,
    localIdentName: '_[name]-[local]-[hash:base64:4]',
    modules: true,
    sourceMap: true,
  },
}
const postCSSLoader = {
  ident: 'postcss',
  loader: 'postcss-loader',
  options: {
    plugins: (loader) => [require('postcss-cssnext')()],
    sourceMap: true,
  },
}
const sassLoader = { loader: 'sass-loader', options: { sourceMap: true } }
const styleLoader = { loader: 'style-loader', options: { sourceMap: true } }

module.exports = {
  entry: [PATHS.source],
  output: {
    devtoolModuleFilenameTemplate: 'webpack:///[resource-path]',
    filename: 'main.js',
    path: PATHS.build,
    // Because file:// usage for now, so image URLs get b0rked otherwise…
    // (Always a good idea anyhow, esp. over HTTP).
    publicPath: PATHS.build + '/',
  },
  devtool: 'cheap-module-source-map',
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        include: PATHS.source,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', { modules: false, useBuiltIns: 'usage' }],
              ],
            },
          },
          'eslint-loader',
        ],
      },
      {
        test: /\.css$/,
        use: PROD
          ? ExtractTextPlugin.extract({
              use: [cssLoader, postCSSLoader],
              fallback: styleLoader,
            })
          : [styleLoader, cssLoader, postCSSLoader],
      },
      {
        test: /\.scss$/,
        use: PROD
          ? ExtractTextPlugin.extract({
              use: [cssLoader, postCSSLoader, sassLoader],
              fallback: styleLoader,
            })
          : [styleLoader, cssLoader, postCSSLoader, sassLoader],
      },
      {
        test: /\.(?:jpe?g|gif|png)$/,
        use: {
          loader: 'url-loader',
          options: { limit: 10000, name: '[sha256:hash:16].[ext]' },
        },
      },
      {
        test: /\.svg$/,
        use: {
          loader: 'svg-url-loader',
          options: {
            iesafe: true,
            limit: 10000,
            name: '[sha256:hash:16].[ext]',
            stripdeclarations: true,
          },
        },
      },
    ],
  },
  plugins: PROD ? [new ExtractTextPlugin({ filename: 'main.css' })] : [],
}
