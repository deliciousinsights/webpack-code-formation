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
    ],
  },
}
