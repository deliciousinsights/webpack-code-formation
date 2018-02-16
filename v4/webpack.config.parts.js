const MiniCssExtractPlugin = require('mini-css-extract-plugin')

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

// Dev UX
// ------

exports.generateSourceMaps = ({ type = 'cheap-module-source-map' } = {}) => ({
  devtool: type,
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
