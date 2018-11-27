// Webpack v4 - Configuration principale
// =====================================

const merge = require('webpack-merge')
const parts = require('./webpack.config.parts')
const Path = require('path')

// Chemins principaux
// ------------------

const PATHS = {
  build: Path.resolve(__dirname, 'dist'),
  // Les entries peuvent être relatives, mais au CWD, alors autant forcer
  // l’absolu par rapport au fichier de config.
  source: Path.resolve(__dirname, 'src'),
  static: Path.resolve(__dirname, 'static'),
}

// Config partagée dev/prod
// ------------------------

const coreConfig = merge(
  {
    // Point d’entrée de l’application. En utilisant un objet, on facilite
    // l’extraction d’autres entrées auto (type vendor).
    entry: { main: [PATHS.source] },

    // Sortie produite par le build.
    output: {
      // Format des URLs de fichiers d’origine dans les source maps.  On vire le
      // `?query` par défaut, qui est moche et ne sert à rien
      devtoolModuleFilenameTemplate: 'webpack:///[resource-path]',
      // Schéma des noms de fichiers bundles. Le `[name]` sera remplacé par le
      // nom du bundle, basé sur celui de l’entrée (ex. `main`). Ce nom peut
      // contenir des chemins au début, le tout relatif à `output.path`.
      filename: '[name].js',
      // Chemin absolu racine de production des fichiers bundlés.
      path: PATHS.build,
      // Préfixe de chemin des URLs pour les fichiers produits.  Ici, on est
      // « racine domaine », mais si on prévoit un déploiement (dev ou prod)
      // dans un sous-chemin, il est impératif de le caler ici.
      publicPath: '/',
    },
    // Cette nouvelle série d’options de Webpack 4 remplace pas mal d’anciennes
    // manips, notamment tout ce qui touche à `CommonsChunkPlugin`.
    optimization: {
      // Extraction à part de la *runtime* Webpack
      runtimeChunk: true,
      splitChunks: {
        // Auto-splitting intelligent de tous les chunks (initiaux et
        // asynchrones) (par défaut, ça ne fait que les asynchrones).
        chunks: 'all',
      },
    },
  },
  // On utilise des source maps ; par défaut ici, on sera en `eval-source-map`,
  // qui a ceci de mieux que le `eval` de base qu’il utilise le source
  // d’origine, pas le transpilé / transformé.
  parts.generateSourceMaps(),
  // Passage des JS/JSX à travers Babel, par défaut en `preset-env` sans
  // transpilation de modules, pour que Webpack puisse faire ses optims majeures
  // (*tree shaking*, *scope hoisting*).  On limite à nos propres sources, pour
  // aller plus vite
  parts.babelize({ include: PATHS.source }),

  // Annulation du bundling par défaut de tous les locales Moment en raison du
  // require dynamique (`require('./locale/' + locale)`) dans son code source.
  // On s’économise bien 50Ko min+gz.
  parts.ignoreMomentLocales(),

  // ESLint sur nos propres JS, intégré au build : ça remontera notamment dans
  // l’overlay.
  parts.lintJS({ include: PATHS.source }),

  // Copie récursivement le(s) répertoire(s) passé(s) dans le dossier de
  // destination.
  parts.copyStatic(PATHS.static),

  // Prise en compte des assets images, avec inlining auto si inférieures à
  // 10Ko.
  parts.loadImages(),

  // Prise en compte des assets webfonts, avec inlining auto si inférieures à
  // 10Ko.
  parts.loadFonts(),

  // Génération et maintenance auto du `index.html`, avec les bonnes balises
  // `<script>` et `<link rel="styleheet"/>`
  parts.html({ title: 'Webpack 4 - Premiers Pas', inlineRuntime: true }),
  // Pas de production de fichiers à jour si 1+ asset a un problème
  parts.safeAssets()
  // A des soucis au premier build de nouveau cache sur WP4 récents…
  // (https://github.com/mzgoddard/hard-source-webpack-plugin/issues/526)
  // parts.useModuleLevelCache()
)

// Config complémentaire de dev
// ----------------------------

const devConfig = () =>
  // Le `merge.smart` devrait en fait être le mode par défaut : il fusionne
  // intelligemment les pipelines de loaders, à clé (ex. `test`) égale.
  merge.smart(
    coreConfig,

    // Mode explicite, qui nous évite de devoir le préciser dans la CLI
    { mode: 'development' },

    // Personnalisation du Webpack-Dev-Server lancé en dev…
    parts.devServer({
      // …port personnalisé (par défaut 8080)
      port: 3004,

      // …démo proxy (pour avoir un seul port frontal en dépit de couches
      // backend distinctes qui produisent le HTML, les réponses API, etc.).
      proxy: {
        '/api': {
          target: 'https://jsonplaceholder.typicode.com',
          pathRewrite: { '^/api': '' },
          changeOrigin: true,
        },
      },
    }),

    // Overlay haut de gamme pour erreurs d'exécution dans le browser
    parts.errorOverlay(),

    // Webpack-Dashboard ; sympa pour superviser le build et ses contenus
    parts.dashboard(),

    // Chargement à la volée des CSS ; PostCSS+cssnext est là de base, et on
    // active les CSS Modules au niveau du `css-loader`.
    parts.loadCSS({ modules: true }),

    // Idem, mais avec la transpilation SASS en début de pipeline (SASS3 :
    // extension `.scss`).
    parts.loadSASS({ modules: true })
  )

// Config complémentaire de prod
// -----------------------------

const prodConfig = () =>
  merge.smart(
    // Nettoyage du dossier cible (`dist/`), vu qu’avec les hashes dans les noms
    // de fichiers, ceux-ci vont potentiellement changer d’un build à l’autre.
    parts.cleanDist(),
    coreConfig,
    {
      mode: 'production',
      output: {
        // On ajoute un hash court (basé MD5 par défaut) aux noms de fichiers
        // pour améliorer leur mise en cache (*Long-Term Caching*) au moyen
        // d’expirations très longues.
        filename: '[name].[chunkhash:8].js',
      },
      stats: { optimizationBailout: true },
    },
    // Changement du type de source maps pour les mettre dans des fichiers à
    // part, et avec le plus fort niveau de détail possible.
    parts.generateSourceMaps({ type: 'source-map' }),

    // Extraction dans des fichiers à part des CSS, d’où qu’elles viennent.
    parts.extractCSS({ modules: true }),
    parts.extractSASS({ modules: true }),
    // Minification du JS et des CSS
    parts.minifyAll(),

    // Optimisation des images (utilise `imagemin` en interne, opère aussi bien
    // sur les JPEG que sur les PNG, GIF, WEBP et SVG).
    parts.optimizeImages(),

    // Pré-compression (`.gz` basée Zopfli) des fichiers textuels (HTML, CSS,
    // JS, SVG) et des PNG (basée Zopfli, sans extension complémentaire).
    parts.compressFiles(),

    // Publier le manifeste des assets et de leurs versions « fingerprintées »,
    // pour exploitation potentielle par de la génération tierce de HTML.
    parts.publishManifest()
  )

// On exporte une fonction : elle recevra en argument la valeur composée à
// partir des arguments `--env` de la CLI ; on n’en passe pas, donc à défaut
// elle prend le `process.env.NODE_ENV` en vigueur et renvoie la config
// appropriée.
module.exports = (env = process.env.NODE_ENV) =>
  env === 'production' ? prodConfig() : devConfig()
