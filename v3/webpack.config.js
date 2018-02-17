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
    parts.loadCSS({ modules: true }),
    parts.loadSASS({ modules: true })
  )

const prodConfig = () =>
  merge.smart(
    coreConfig,
    parts.generateSourceMaps({ type: 'source-map' }),
    parts.extractCSS({ modules: true }),
    parts.extractSASS({ modules: true })
  )

module.exports = (env = process.env.NODE_ENV) =>
  env === 'production' ? prodConfig() : devConfig()
