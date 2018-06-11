const Path = require('path')

const PATHS = {
  build: Path.resolve(__dirname, 'dist'),
  source: Path.resolve(__dirname, 'src'),
}

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
        use: [
          { loader: 'style-loader', options: { sourceMap: true } },
          {
            loader: 'css-loader',
            options: {
              camelCase: 'only',
              importLoaders: 1,
              localIdentName: '_[name]-[local]-[hash:base64:4]',
              modules: true,
              sourceMap: true,
            },
          },
          {
            ident: 'postcss',
            loader: 'postcss-loader',
            options: {
              plugins: (loader) => [require('postcss-cssnext')()],
              sourceMap: true,
            },
          },
        ],
      },
      {
        test: /\.scss$/,
        use: [
          { loader: 'style-loader', options: { sourceMap: true } },
          {
            loader: 'css-loader',
            options: {
              camelCase: 'only',
              importLoaders: 1,
              localIdentName: '_[name]-[local]-[hash:base64:4]',
              modules: true,
              sourceMap: true,
            },
          },
          {
            ident: 'postcss',
            loader: 'postcss-loader',
            options: {
              plugins: (loader) => [require('postcss-cssnext')()],
              sourceMap: true,
            },
          },
          { loader: 'sass-loader', options: { sourceMap: true } },
        ],
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
}
