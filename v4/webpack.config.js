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
      filename: '[name].js',
      path: PATHS.build,
      publicPath: '/',
    },
    optimization: {
      runtimeChunk: true,
      splitChunks: {
        chunks: 'initial',
      },
    },
  },
  parts.generateSourceMaps(),
  parts.babelize({ include: PATHS.source }),
  parts.ignoreMomentLocales(),
  parts.lintJS({ include: PATHS.source }),
  parts.copyStatic(PATHS.static),
  parts.loadImages(),
  parts.loadFonts(),
  parts.html({ title: 'Webpack 4 - Premiers Pas', inlineRuntime: true }),
  parts.safeAssets()
  // A des soucis au premier build de nouveau cache sur WP4 récents…
  // (https://github.com/mzgoddard/hard-source-webpack-plugin/issues/526)
  // parts.useModuleLevelCache()
)

const devConfig = () =>
  merge.smart(
    coreConfig,
    { mode: 'development' },
    parts.devServer({
      port: 3004,
      proxy: {
        '/api': {
          target: 'https://jsonplaceholder.typicode.com',
          pathRewrite: { '^/api': '' },
          changeOrigin: true,
        },
      },
    }),
    parts.errorOverlay(),
    parts.dashboard(),
    parts.loadCSS({ modules: true }),
    parts.loadSASS({ modules: true })
  )

const prodConfig = () =>
  merge.smart(
    parts.cleanDist(),
    coreConfig,
    {
      mode: 'production',
      output: {
        filename: '[name].[chunkhash:8].js',
      },
      stats: { optimizationBailout: true },
    },
    parts.generateSourceMaps({ type: 'source-map' }),
    parts.extractCSS({ modules: true }),
    parts.extractSASS({ modules: true }),
    parts.minifyAll(),
    parts.optimizeImages(),
    parts.compressFiles(),
    parts.publishManifest()
  )

module.exports = (env = process.env.NODE_ENV) =>
  env === 'production' ? prodConfig() : devConfig()
