const ExtractTextPlugin = require('extract-text-webpack-plugin')
const webpack = require('webpack')

// Babel
// -----

exports.babelize = ({
  include,
  exclude = /node_modules/,
  options = {},
} = {}) => {
  if (options.presets === undefined) {
    options = {
      presets: [
        ['@babel/preset-env', { modules: false, useBuiltIns: 'usage' }],
      ],
      plugins: [
        '@babel/plugin-syntax-dynamic-import',
        '@babel/plugin-transform-runtime',
      ],
      ...options,
    }
  }
  if (options === false) {
    options = undefined
  }

  return {
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          include,
          exclude,
          use: [{ loader: 'babel-loader', options }],
        },
      ],
    },
  }
}

// ESLint
// ------

exports.lintJS = ({ include, exclude = /node_modules/ } = {}) => ({
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        include,
        exclude,
        use: ['eslint-loader'],
      },
    ],
  },
})

// CSS & SASS
// ----------

exports.extractCSS = ({ include, exclude, modules }) =>
  extractStyling({ ext: 'css', include, exclude, modules })
exports.extractSASS = ({ include, exclude, modules }) =>
  extractStyling({ ext: 'scss', include, exclude, modules, altLang: 'sass' })

exports.loadCSS = ({ include, exclude, modules }) =>
  loadStyling({ ext: 'css', include, exclude, modules })
exports.loadSASS = ({ include, exclude, modules }) =>
  loadStyling({ ext: 'scss', include, exclude, modules, altLang: 'sass' })

// Images & Fonts
// --------------

exports.loadFonts = ({ include, exclude } = {}) => ({
  module: {
    rules: [
      {
        test: /\.(?:woff2?|eot|ttf|otf)$/,
        include,
        exclude,
        use: [
          {
            loader: 'url-loader',
            options: { limit: 10000, name: '[sha256:hash:16].[ext]' },
          },
        ],
      },
    ],
  },
})

exports.loadImages = ({ include, exclude, ieSafeSVGs = true } = {}) => ({
  module: {
    rules: [
      {
        test: /\.(?:jpe?g|png|gif|webp)$/,
        include,
        exclude,
        use: [
          {
            loader: 'url-loader',
            options: { limit: 10000, name: '[sha256:hash:16].[ext]' },
          },
        ],
      },
      {
        test: /\.svg$/,
        include,
        exclude,
        use: [
          {
            loader: 'svg-url-loader',
            options: {
              iesafe: ieSafeSVGs,
              limit: 10000,
              name: '[sha256:hash:16].[ext]',
              stripdeclarations: true,
            },
          },
        ],
      },
    ],
  },
})

exports.html = (options = {}) => {
  options = {
    ...options,
    meta: {
      viewport: 'width=device-width, initial-scale=1',
      ...options.meta,
    },
  }

  const HtmlWebpackPlugin = require('html-webpack-plugin')
  return { plugins: [new HtmlWebpackPlugin(options)] }
}

exports.copyStatic = (...sourceDirs) => {
  const CopyPlugin = require('copy-webpack-plugin')
  return {
    plugins: [new CopyPlugin(sourceDirs)],
  }
}
// Optimizations
// -------------

function isVendor({ context }) {
  return context && context.includes('node_modules')
}

exports.autoVendor = (options) => ({
  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      minChunks: isVendor,
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'runtime',
      minChunks: Infinity,
    }),
    new webpack.HashedModuleIdsPlugin({
      hashFunction: 'sha256',
      hashDigestLength: 6,
    }),
  ],
})

exports.concatenateModules = () => ({
  plugins: [new webpack.optimize.ModuleConcatenationPlugin()],
})

exports.extractCommonChunks = (options = {}) => ({
  plugins: [
    new webpack.optimize.CommonsChunkPlugin({ name: 'common', ...options }),
  ],
})

exports.ignoreDynamicRequiresFor = (requestRegExp, contextRegExp) => ({
  plugins: [new webpack.IgnorePlugin(requestRegExp, contextRegExp)],
})

exports.ignoreMomentLocales = () =>
  exports.ignoreDynamicRequiresFor(/^\.\/locale$/, /moment$/)

exports.inlineRuntime = (options = {}) => {
  const InlinerPlugin = require('html-webpack-inline-chunk-plugin')
  return {
    plugins: [
      new InlinerPlugin({ inlineChunks: ['runtime'], quiet: true, ...options }),
    ],
  }
}

exports.makeNonProductionCodeStrippable = () => ({
  plugins: [
    new webpack.DefinePlugin({ 'process.env.NODE_ENV': '"production"' }),
  ],
})

exports.minifyAll = (options = {}) => {
  const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
  options = { parallel: true, sourceMap: true, ...options }

  return {
    plugins: [
      new webpack.LoaderOptionsPlugin({ minimize: true }),
      new UglifyJSPlugin(options),
    ],
  }
}

exports.optimizeImages = (options = {}) => {
  options = {
    optipng: { enabled: false },
    ...options,
    mozjpeg: { quality: 75, ...(options.mozjpeg || {}) },
  }
  return {
    module: {
      rules: [
        {
          test: /\.(?:jpe?g|png|gif|webp|svg)$/,
          use: [{ loader: 'image-webpack-loader', options }],
        },
      ],
    },
  }
}

exports.compressFiles = (options = {}) => {
  const CompressionPlugin = require('compression-webpack-plugin')
  const { gzip: algorithm } = require('@gfx/zopfli')
  return {
    plugins: [
      new CompressionPlugin(
        {
          test: /\.(?:html|jsx?|css|svg)$/,
          ...options,
          algorithm,
        },
        {
          test: /\.png$/,
          deleteOriginalAssets: true,
          ...options,
          algorithm,
        }
      ),
    ],
  }
}

exports.publishManifest = (options = {}) => {
  const ManifestPlugin = require('webpack-assets-manifest')
  const REGEX_BLACKLIST = /\.(?:map|gz)$/

  return {
    plugins: [
      new ManifestPlugin({
        customize(key, value) {
          return REGEX_BLACKLIST.test(key) ? false : { key, value }
        },
        publicPath: true,
        ...options,
      }),
    ],
  }
}

// Dev UX
// ------

exports.cleanDist = (paths, options) => {
  const CleanWebpackPlugin = require('clean-webpack-plugin')
  return { plugins: [new CleanWebpackPlugin(paths, options)] }
}

exports.dashboard = (options) => {
  const WebpackDashboardPlugin = require('webpack-dashboard/plugin')
  return { plugins: [new WebpackDashboardPlugin(options)] }
}

exports.devServer = ({
  contentBase,
  hot = true,
  https,
  open,
  poll = process.env.POLL,
  port,
  proxy,
} = {}) => {
  const devServer = {
    contentBase,
    historyApiFallback: true,
    https,
    noInfo: true,
    overlay: true,
    port,
    proxy,
  }

  const plugins = []
  if (hot) {
    plugins.push(
      new webpack.HotModuleReplacementPlugin(),
      new webpack.NamedModulesPlugin()
    )
  }

  if (hot === 'only') {
    devServer.hotOnly = true
  } else {
    devServer.hot = !!hot
  }

  if (poll !== undefined) {
    devServer.watchOptions = { poll: !!poll }
  }

  if (typeof open === 'string') {
    devServer.openPage = open
  } else {
    devServer.open = !!open
  }

  return { devServer, plugins }
}

exports.generateSourceMaps = ({ type = 'cheap-module-source-map' } = {}) => ({
  devtool: type,
})

exports.monitor = (options = { launch: true }) => {
  const Monitor = require('webpack-monitor')
  return { plugins: [new Monitor(options)] }
}

exports.safeAssets = () => ({
  plugins: [new webpack.NoEmitOnErrorsPlugin()],
})

exports.useModuleLevelCache = (options) => {
  const HardSourceWebpackPlugin = require('hard-source-webpack-plugin')
  return { plugins: [new HardSourceWebpackPlugin(options)] }
}

// Helper functions
// ----------------

function buildCSSRule({
  ext,
  altLang = null,
  include,
  exclude,
  modules = false,
  useStyle = false,
}) {
  const cssOptions = {
    importLoaders: 1,
    sourceMap: true,
  }
  if (modules === true) {
    modules = {
      camelCase: 'only',
      localIdentName: '_[name]-[local]-[hash:base64:4]',
      modules: true,
    }
  }
  if (modules) {
    Object.assign(cssOptions, modules)
  }

  const result = {
    test: new RegExp(`\\.${ext}$`),
    include,
    exclude,
    use: [
      { loader: 'css-loader', options: cssOptions },
      {
        loader: 'postcss-loader',
        options: {
          plugins: (loader) => [require('postcss-cssnext')()],
          sourceMap: true,
        },
      },
    ],
  }

  if (altLang) {
    result.use.push({
      loader: `${altLang}-loader`,
      options: { sourceMap: true },
    })
  }

  if (useStyle) {
    result.use.unshift('style-loader')
  }

  return result
}

const cssPlugins = new Map()

function extractStyling({ ext, include, exclude, modules, name, altLang }) {
  const cssPluginExisted = cssPlugins.has(name)
  if (!cssPluginExisted) {
    cssPlugins.set(
      name,
      new ExtractTextPlugin({ filename: '[name].[contenthash:8].css' })
    )
  }
  const cssPlugin = cssPlugins.get(name)

  const { test, use } = buildCSSRule({ ext, modules, altLang })

  return {
    plugins: cssPluginExisted ? [] : [cssPlugin],
    module: {
      rules: [
        {
          test,
          include,
          exclude,
          use: cssPlugin.extract({
            fallback: 'style-loader',
            use,
          }),
        },
      ],
    },
  }
}

function loadStyling({ ext, include, exclude, modules, altLang }) {
  return {
    module: {
      rules: [
        buildCSSRule({
          ext,
          altLang,
          include,
          exclude,
          modules,
          useStyle: true,
        }),
      ],
    },
  }
}
