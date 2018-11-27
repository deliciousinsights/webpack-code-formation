// Webpack v3 - Éléments de configuration
// ======================================

const ExtractTextPlugin = require('extract-text-webpack-plugin')
const webpack = require('webpack')

// Babel
// -----
//
// Passage des fichiers `.js` et `.jsx` par Babel, par défaut en preset `env` sans
// transpilation des modules (pour que Webpack puisse faire ses optims) mais avec
// `useBuiltIns: true` (pour minimiser l’impact éventuel de `babel-polyfill`). On
// ignore aussi `node_modules` par défaut.
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
//
// Permet d’assurer le *linting* pendant le build, indépendamment de son recours
// dans l’éditeur / EDI ou en hook de pre-commit Git.  Exclue `node_modules` par
// défaut.  La configuration est supposée externe (`.eslintrc.json` ou clé
// `eslintConfig` dans `package.json`).
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
//
// Tous ces extracteurs (prod) et injecteurs (dev) utilisent PostCSS avec
// cssnext, se basant sur une config partagée type `.browserslistrc`.

// Extraction en fichier à part des sources `.css`, orientée production donc.
// Le fichier produit inclue automatiquement un hash pour le *Long-Term Caching*.
exports.extractCSS = ({ include, exclude, modules }) =>
  extractStyling({ ext: 'css', include, exclude, modules })

// Idem, mais pour les sources `.scss`.  Préfixe la pipeline de chargeurs par
// le transpileur SASS.
exports.extractSASS = ({ include, exclude, modules }) =>
  extractStyling({ ext: 'scss', include, exclude, modules, altLang: 'sass' })

// Injection dans le DOM des sources `.css`, orientée développement et
// chargement dynamique en production (*fallback loader* de l’extracteur).
exports.loadCSS = ({ include, exclude, modules }) =>
  loadStyling({ ext: 'css', include, exclude, modules })

// Idem, mais pour les sources `.scss`.
exports.loadSASS = ({ include, exclude, modules }) =>
  loadStyling({ ext: 'scss', include, exclude, modules, altLang: 'sass' })

// Images & Fonts
// --------------
//
// Charge les fontes en préférant un *inlining* en-dessous de 10Ko,
// sous forme d’URL `data:` en Base64.  Même si on teste ici toutes les
// extensions usuelles de *web fonts*, en pratique WOFF + WOFF2 suffit généralement
// à couvrir tous les navigateurs.  Les fichiers générés sont automatiquement
// hashés, par précaution à 16 caractères (8 suffiraient sans doute).

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

// Charge les images en préférant un *inlining* en-dessous de 10Ko,
// sous forme d’URL `data:` en Base64 (pour les images *raster*, basées
// pixels) ou UTF-8 (pour les SVG).  Les fichiers générés sont automatiquement
// hashés, par précaution à 16 caractères (8 suffiraient sans doute).
// Les SVG inlinées sont retravaillées pour passer correctement sur cette
// !@# d’IE.

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

// Génération dynamique du gabarit HTML
// ------------------------------------
//
// Génère dynamiquement un `index.html` (ou autre, selon options), qui
// comprendra les bonnes balises `<script>` (et éventuellement `<link rel="stylesheet"/>`)
// en fonction des bundles définis dans la configuration.  Peut être appelé plusieurs fois
// avec ses [moult options](https://github.com/webpack-contrib/html-webpack-plugin#readme)
// pour générer plusieurs fichiers.
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

// Extraction automatique des modules NPM dans un unique bundle `vendor` (si on code-splitte
// beaucoup ou qu’on bundle-splitte pas mal par ailleurs, c’est bien mais sous-optimal), et
// extraction à part de la *runtime* Webpack, pour réduire le risque de re-hash intempestif
// sur les bundles lors d’une modification (ça permet en plus l’*inlining* dans le HTML).
//
// En pratique, ce traitement disparaît dans Webpack 4+, car il est automatisé, en mieux, par
// le nouveau `SplitChunksPlugin`, qui est plus performant et pertinent ; `CommonsChunkPlugin`
// est quant à lui retiré. [Voir les détails](https://medium.com/webpack/webpack-4-code-splitting-chunk-graph-and-the-splitchunks-optimization-be739a861366).
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

// Active le *scope hoisting*, qui permet de réduire considérablement l’empreinte
// de la « plomberie » Webpack autour des modules ES.  Automatiquement activé avec
// Webpack 4, au travers d’une autre option.
exports.concatenateModules = () => ({
  plugins: [new webpack.optimize.ModuleConcatenationPlugin()],
})

// Extrait du code commun clairement identifié (généralement au travers d’une option
// `chunks` ou `minChunks`) dans un bundle dédié (par défaut `common`).  Intervient le
// plus souvent en surcouche de `autoVendor`, pour extraire du code commun côté
// applicatif.  Là aussi, obsolétisé par la nouvelle approche, plus performante et
// automatique, de Webpack 4.
exports.extractCommonChunks = (options = {}) => ({
  plugins: [
    new webpack.optimize.CommonsChunkPlugin({ name: 'common', ...options }),
  ],
})

// Méthode générique de non-bundling de `require(…)` dynamiques.  En pratique,
// surtout utilisée via son cas particulier Moment.js (voir méthode suivante).
exports.ignoreDynamicRequiresFor = (requestRegExp, contextRegExp) => ({
  plugins: [new webpack.IgnorePlugin(requestRegExp, contextRegExp)],
})

// Ne bundle pas par défaut les locales de Moment.js (~50Ko min+gz quand même !),
// nous laissant le soin de requérir/importer manuellement ceux dont on a besoin.
exports.ignoreMomentLocales = () =>
  exports.ignoreDynamicRequiresFor(/^\.\/locale$/, /moment$/)

// *Inline* la *runtime* de Webpack dans le HTML généré par `html-webpack-plugin`,
// afin d’économiser une requête HTTP au démarrage.  Dans Webpack 4, nécessite
// l’option `optimization.runtimeChunk: true`.
exports.inlineRuntime = (options = {}) => {
  const InlinerPlugin = require('html-webpack-inline-chunk-plugin')
  return {
    plugins: [
      new InlinerPlugin({ inlineChunks: ['runtime'], quiet: true, ...options }),
    ],
  }
}

// Ajuste le code produit pour que les expressions qui, au final, évaluent
// `process.env.NODE_ENV` soient résolues statiquement à la valeur `"production"`.
// Ainsi, le code conditionnel basé dessus devient évaluable statiquement, ce
// qui permet notamment l’élimination de code mort pour les blocs qui requierent
// une valeur autre que `"production"`.  Fait automatiquement par Webpack 4.
exports.makeNonProductionCodeStrippable = () => ({
  plugins: [
    new webpack.DefinePlugin({ 'process.env.NODE_ENV': '"production"' }),
  ],
})

// Minifie le JS et les CSS
exports.minifyAll = (options = {}) => {
  const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
  // Tant qu’à faire, on optimise le temps de minification…
  options = { parallel: true, sourceMap: true, ...options }

  return {
    plugins: [
      // Le css-loader va réagir à l’option générique `minimize: true` en
      // activant une minification clean basée sur cssnano.
      new webpack.LoaderOptionsPlugin({ minimize: true }),
      new UglifyJSPlugin(options),
    ],
  }
}

// Passe les images (inline ou non) par imagemin, lequel délègue aux optimiseurs
// de l’état de l’art par type d’image : mozjpeg pour les JPEG, pngquant pour les PNG
// (on désactive optipng, moins performant), gifsicle pour les GIF, et svgo pour les SVG.
// On cale par défaut le facteur de qualité des JPEG à 75, amplement suffisant pour 99,9% des cas.
//
// Si vous spritez les images, assurez-vous de faire passer cette optimisation *après* le spriting,
// pas avant (donc *avant* en termes de pipeline de chargeurs…).
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

// On pré-compresse via Zopfli les fichiers textuels, en ajoutant l'extension
// `.gz`et en gardant les originaux, pour permettre le « GZip Statique » sur les
// serveurs d'assets / CDN.  Les PNG ont aussi tout à gagner à se prendre une
// couche Zopfli, mais sans changer leur extension ni garder la version
// d’origine, du coup.
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

// Extrait le manifeste des assets produits dans un fichier JSON à part (par
// défaut, `manifest.json` dans le `output.path`), afin qu’une couche serveur
// produisant le HTML puisse l’utiliser pour écrire les bonnes balises `<link
// rel="stylesheet"…/>` et `<script>`.
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

// Purge le dossier de build (`output.path`), ce qui est notamment utile quand les noms de fichiers
// changent parfois d’un build à l’autre, par exemple en raison de leur hash.
exports.cleanDist = (paths, options) => {
  const CleanWebpackPlugin = require('clean-webpack-plugin')
  return { plugins: [new CleanWebpackPlugin(paths, options)] }
}

// Injecte le « serveur » de Webpack-Dashboard, pour que la CLI de celui-ci puisse s’interfacer avec
// le moteur de Webpack.
exports.dashboard = (options) => {
  const WebpackDashboardPlugin = require('webpack-dashboard/plugin')
  return { plugins: [new WebpackDashboardPlugin(options)] }
}

// Personnalisation du serveur de webpack-Dev-Server.  On est en mode `hot` par défaut (`hot`, pas `hotOnly`),
// avec dans ce cas le plugin HMR injecté ainsi que celui qui donne leurs noms utiles aux modules (plutôt que
// des IDs strictement numériques, totalement inutilisables au débogage).  On active aussi de base le *deep linking*
// (option `historyApiFallback` à `true`) : toute URL non reconnue, hors proxying éventuel, renverra le `/index.html`.
//
// Par rapport aux options de base du bloc `devServer`, on ajoute un peu de confort :
//
// - Au lieu d’options booléennes séparées `hot` et `hotOnly`, on a `hot` qui peut valoir `true`, `false` ou `'only'`.
// - Au lieu d’options séparées `open` et `openPage`, on a une option `open` qui peut valoir `true`, `false` ou l’URL à ouvrir.
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

// Active la génération de *source maps*.  Le type par défaut,
// `cheap-module-source-map`, est un bon choix pour le développement (si le
// ligne à ligne suffit ; dans le cas contraire, on préfèrera `source-map`, un
// poil moins rapide mais qui permet les points d’arrêt colonnaires).  En
// production, on préfèrera spécifier `source-map` ou `hidden-source-map` pour
// un maximum de détails.  Webpack 4 utilise par défaut `'eval'` en
// développement, mais ce mode, certes très rapide, ne fournit pas le source
// pré-transpilation (original), ce qui craint un peu…
exports.generateSourceMaps = ({ type = 'cheap-module-source-map' } = {}) => ({
  devtool: type,
})

// Injecte le « serveur » de Webpack Monitor, dont l’outil CLI est le client.  Permet d’enregistrer
// et de comparer, d’un build à l’autre, toutes les stats et détails, pour vérifier que le build
// évolue « dans le bon sens »…
exports.monitor = (options = { launch: true }) => {
  const Monitor = require('webpack-monitor')
  return { plugins: [new Monitor(options)] }
}

// Empêche Webpack de produire des assets (en mémoire ou sur disque) lorsqu’1+ asset rencontre une erreur.
// Permet d’éviter les builds « le cul entre deux chaises ».  Automatique en production dans Webpack 4.
exports.safeAssets = () => ({
  plugins: [new webpack.NoEmitOnErrorsPlugin()],
})

// Active le plugin `HardDisk`, qui cache de façon persistente la plupart des étapes intermédiaires de
// traitement de modules par les chargeurs et les plugins, au moyen du mécanisme Webpack de *records*.
// Sans doute l’opti la plus impactante à mettre en place pour réduire les temps de builds, en dev comme
// en prod.  Webpack 5 devrait en réduire considérablement l’intérêt, on verra bien…
exports.useModuleLevelCache = (options) => {
  const HardSourceWebpackPlugin = require('hard-source-webpack-plugin')
  return { plugins: [new HardSourceWebpackPlugin(options)] }
}

// Fonctions utilitaires internes
// ------------------------------

// Détermine si un module a `node_modules` dans son chemin.  Utilisé pour le « vendoring automatique ».
function isVendor({ context }) {
  return context && context.includes('node_modules')
}

// Construit une pipeline de chargeurs CSS, avec ou sans `style-loader` en fin de chaîne (début de tableau, donc),
// assurant notamment PostCSS avec css-next mais aussi, en début de pipeline (fin de tableau), un éventuel
// transpileur si `altLang` est fourni (ex. `sass`, `stylus`, `less`).  Cœur de génération des règles pour les
// extracteurs (prod) et injecteurs (dev) de style.
//
// L’option `modules`, si elle est juste booléenne, se transforme en une série d’options fines pour de meilleures
// pratiques : export *camel-case only* et construction plus « débogable » des noms de classes dynamiques.
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

// Afin de ne pas multiplier les plugins d’extraction, on en fait un par option
// (optionnelle d’ailleur) `name`, et on maintient une map.  Seuls les nouveaux
// noms entraînent un ajout dans `plugins`.
const cssPlugins = new Map()

// Construction générique d’une pipeline d’extraction CSS.  Se repose en interne sur
// `buildCSSRule(…)`.
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
          use: cssPlugin.extract({ fallback: 'style-loader', use }),
        },
      ],
    },
  }
}

// Construction générique d’une pipeline d’injection CSS.  Se repose en interne sur
// `buildCSSRule(…)`.
function loadStyling({ ext, include, exclude, modules, altLang }) {
  return {
    module: {
      rules: [
        buildCSSRule({
          altLang,
          exclude,
          ext,
          include,
          modules,
          useStyle: true,
        }),
      ],
    },
  }
}
