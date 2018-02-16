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
            options: { importLoaders: 1, sourceMap: true },
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
            options: { importLoaders: 1, sourceMap: true },
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
    ],
  },
}
