const Path = require('path')

module.exports = {
  entry: './src',
  output: {
    devtoolModuleFilenameTemplate: 'webpack:///[resource-path]',
    filename: 'main.js',
    path: Path.resolve(__dirname, './dist'),
  },
  devtool: 'cheap-module-source-map',
}