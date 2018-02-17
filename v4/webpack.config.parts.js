const MiniCssExtractPlugin = require('mini-css-extract-plugin')
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
        [
          '@babel/preset-env',
          { corejs: 3, modules: false, useBuiltIns: 'usage' },
        ],
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
            },
          },
        ],
      },
    ],
  },
})

exports.html = (options = {}) => {
  options = { ...options, inject: 'head', scriptLoading: 'defer' }
  const HtmlWebpackPlugin = require('html-webpack-plugin')
  return { plugins: [new HtmlWebpackPlugin(options)] }
}

exports.copyStatic = (...patterns) => {
  const CopyPlugin = require('copy-webpack-plugin')
  return {
    plugins: [new CopyPlugin({ patterns })],
  }
}

// Dev UX
// ------

exports.dashboard = (options) => {
  const WebpackDashboardPlugin = require('webpack-dashboard/plugin')
  return { plugins: [new WebpackDashboardPlugin(options)] }
}

exports.devServer = ({
  contentBase,
  hot = true,
  https,
  logListening = true,
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

  if (logListening) {
    devServer.onListening = () => {
      console.log(
        `Webpack Dev Server listening on ${
          https ? 'https' : 'http'
        }://localhost:${port}/`
      )
    }
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

  return { devServer }
}

exports.errorOverlay = () => {
  const ErrorOverlayPlugin = require('error-overlay-webpack-plugin')
  const path = require('path')

  return {
    // eval-based source maps can't work with this overlay
    devtool: 'cheap-module-source-map',
    // We need absolute filenames for proper click-to-open-editor behavior
    output: {
      devtoolModuleFilenameTemplate(info) {
        return path.resolve(info.absoluteResourcePath).replace(/\\/g, '/')
      },
    },
    plugins: [new ErrorOverlayPlugin()],
  }
}

exports.generateSourceMaps = ({ type = 'cheap-module-source-map' } = {}) => ({
  devtool: type,
})

exports.safeAssets = () => ({
  plugins: [new webpack.NoEmitOnErrorsPlugin()],
})

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
  const cssOptions = { importLoaders: 1, sourceMap: true }
  if (modules === true) {
    cssOptions.localsConvention = 'camelCaseOnly'
    modules = {
      localIdentName: '_[name]-[local]-[hash:base64:4]',
    }
  }
  if (modules) {
    Object.assign(cssOptions, { modules })
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
          plugins: (loader) => [require('postcss-preset-env')()],
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
    cssPlugins.set(name, new MiniCssExtractPlugin({ filename: '[name].css' }))
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
          use: [MiniCssExtractPlugin.loader, ...use],
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
