const Path = require('path')

module.exports = {
  entry: './src',
  output: {
    filename: 'main.js',
    path: Path.resolve(__dirname, './dist'),
  },
}
