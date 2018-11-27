const Path = require('path')

const PATHS = {
  build: Path.resolve(__dirname, 'dist'),
  source: Path.resolve(__dirname, 'src'),
}

module.exports = {
  entry: PATHS.source,
  output: {
    path: PATHS.build,
    filename: 'string-tricks.js',
    library: {
      commonjs: 'stringTricks',
      amd: 'string-tricks',
      root: 'stringTricks',
    },
    libraryTarget: 'umd',
    umdNamedDefine: true,
  },
}
