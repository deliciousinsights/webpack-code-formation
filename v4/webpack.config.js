const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const Path = require('path')

const PATHS = {
  build: Path.resolve(__dirname, 'dist'),
  source: Path.resolve(__dirname, 'src'),
}
const PROD = process.env.NODE_ENV === 'production'

const cssLoader = {
  loader: 'css-loader',
  options: {
    importLoaders: 1,
    localsConvention: 'camelCaseOnly',
    modules: { localIdentName: '_[name]-[local]-[hash:base64:4]' },
    sourceMap: true,
  },
}
const postCSSLoader = {
  ident: 'postcss',
  loader: 'postcss-loader',
  options: {
    plugins: (loader) => [require('postcss-preset-env')()],
    sourceMap: true,
  },
}
const sassLoader = { loader: 'sass-loader', options: { sourceMap: true } }
const styleLoader = { loader: 'style-loader' }

module.exports = {
  entry: [PATHS.source],
  mode: PROD ? 'production' : 'development',
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
                [
                  '@babel/preset-env',
                  { corejs: 3, modules: false, useBuiltIns: 'usage' },
                ],
              ],
            },
          },
          'eslint-loader',
        ],
      },
      {
        test: /\.css$/,
        use: PROD
          ? [MiniCssExtractPlugin.loader, cssLoader, postCSSLoader]
          : [styleLoader, cssLoader, postCSSLoader],
      },
      {
        test: /\.scss$/,
        use: PROD
          ? [MiniCssExtractPlugin.loader, cssLoader, postCSSLoader, sassLoader]
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
          },
        },
      },
    ],
  },
  plugins: PROD ? [new MiniCssExtractPlugin({ filename: 'main.css' })] : [],
}
