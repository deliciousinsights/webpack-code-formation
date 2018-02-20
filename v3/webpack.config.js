const merge = require('webpack-merge')
const parts = require('./webpack.config.parts')
const Path = require('path')

const PATHS = {
  build: Path.resolve(__dirname, 'dist'),
  source: Path.resolve(__dirname, 'src'),
  static: Path.resolve(__dirname, 'static'),
}

const coreConfig = merge(
  {
    entry: { main: [PATHS.source] },
    output: {
      devtoolModuleFilenameTemplate: 'webpack:///[resource-path]',
      chunkFilename: '[name].js',
      filename: '[name].js',
      path: PATHS.build,
      publicPath: '/',
    },
  },
  parts.generateSourceMaps(),
  parts.babelize({ include: PATHS.source }),
  parts.ignoreMomentLocales(),
  parts.lintJS({ include: PATHS.source }),
  parts.copyStatic(PATHS.static),
  parts.autoVendor(),
  parts.loadImages(),
  parts.loadFonts(),
  parts.html({ title: 'Webpack 3 - Premiers Pas' }),
  parts.safeAssets(),
  parts.useModuleLevelCache()
)

const devConfig = () =>
  merge.smart(
    coreConfig,
    parts.devServer({
      port: 3003,
      proxy: {
        '/api': {
          target: 'https://jsonplaceholder.typicode.com',
          pathRewrite: { '^/api': '' },
          changeOrigin: true,
        },
      },
    }),
    parts.dashboard(),
    parts.loadCSS({ modules: true }),
    parts.loadSASS({ modules: true })
  )

const prodConfig = () =>
  merge.smart(
    parts.cleanDist([PATHS.build]),
    coreConfig,
    {
      output: {
        chunkFilename: '[name].[chunkhash:8].js',
        filename: '[name].[chunkhash:8].js',
      },
    },
    parts.generateSourceMaps({ type: 'source-map' }),
    parts.makeNonProductionCodeStrippable(),
    parts.concatenateModules(),
    parts.extractCSS({ modules: true }),
    parts.extractSASS({ modules: true }),
    parts.minifyAll(),
    parts.optimizeImages(),
    parts.compressFiles(),
    parts.inlineRuntime(),
    parts.publishManifest(),
    process.env.WEBPACK_MONITOR === 'true' ? parts.monitor() : undefined
  )

module.exports = (env = process.env.NODE_ENV) =>
  env === 'production' ? prodConfig() : devConfig()
