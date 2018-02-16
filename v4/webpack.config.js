const merge = require('webpack-merge')
const parts = require('./webpack.config.parts')
const Path = require('path')

const PATHS = {
  build: Path.resolve(__dirname, 'dist'),
  source: Path.resolve(__dirname, 'src'),
}

const coreConfig = merge(
  {
    entry: { main: [PATHS.source] },
    output: {
      devtoolModuleFilenameTemplate: 'webpack:///[resource-path]',
      filename: 'main.js',
      path: PATHS.build,
      publicPath: '/',
    },
  },
  parts.generateSourceMaps(),
  parts.babelize({ include: PATHS.source }),
  parts.lintJS({ include: PATHS.source }),
  parts.loadImages(),
  parts.loadFonts()
)

const devConfig = () =>
  merge.smart(
    coreConfig,
    { mode: 'development' },
    parts.devServer({ port: 3004 }),
    parts.errorOverlay(),
    parts.loadCSS({ modules: true }),
    parts.loadSASS({ modules: true })
  )

const prodConfig = () =>
  merge.smart(
    coreConfig,
    { mode: 'production' },
    parts.generateSourceMaps({ type: 'source-map' }),
    parts.extractCSS({ modules: true }),
    parts.extractSASS({ modules: true })
  )

module.exports = (env = process.env.NODE_ENV) =>
  env === 'production' ? prodConfig() : devConfig()
