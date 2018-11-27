// Webpack v3 - Configuration principale
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
      //
      // L’option `filename` est utilisée pour les *entry chunks*, la
      // `chunkFilename` pour les *async chunks*.
      chunkFilename: '[name].js',
      filename: '[name].js',
      // Chemin absolu racine de production des fichiers bundlés.
      path: PATHS.build,
      // Préfixe de chemin des URLs pour les fichiers produits.  Ici, on est
      // « racine domaine », mais si on prévoit un déploiement (dev ou prod)
      // dans un sous-chemin, il est impératif de le caler ici.
      publicPath: '/',
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

  // Extraction automatique des modules venant de npm/`node_modules` dans un
  // chunk unique `vendor`.  C’est un peu le service minimum, mais ce n’est pas
  // 100% optimal pour autant. Webpack 4, avec sa stratégie automatique, va plus
  // loin (mais en prod seulement).  Le faire en dev permet de considérablement
  // réduire les builds incrémentaux.  On en profite aussi pour extraire la
  // *runtime* Webpack dans un bundle à part, afin d’éviter la modification de
  // hashes par effet de bord dans des bundles non concernés.
  parts.autoVendor(),

  // Prise en compte des assets images, avec inlining auto si inférieures à
  // 10Ko.
  parts.loadImages(),

  // Prise en compte des assets webfonts, avec inlining auto si inférieures à
  // 10Ko.
  parts.loadFonts(),

  // Génération et maintenance auto du `index.html`, avec les bonnes balises
  // `<script>` et `<link rel="styleheet"/>`
  parts.html({ title: 'Webpack 3 - Premiers Pas' }),

  // Pas de production de fichiers à jour si 1+ asset a un problème
  parts.safeAssets(),

  // Activation du cache HardDisk, sans doute l’œpti la plus impactante pour le
  // dev comme pour la prod, qui permet d’éviter d’avoir à en mettre en œuvre
  // plein d’autres (HappyPack, Dll/DllReference…) tant qu’on n’atteint pas des
  // builds pharaoniques.
  parts.useModuleLevelCache()
)

// Config complémentaire de dev
// ----------------------------

const devConfig = () =>
  // Le `merge.smart` devrait en fait être le mode par défaut : il fusionne
  // intelligemment les pipelines de loaders, à clé (ex. `test`) égale.
  merge.smart(
    coreConfig,

    // Personnalisation du Webpack-Dev-Server lancé en dev…
    parts.devServer({
      // …port personnalisé (par défaut 8080)
      port: 3003,

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
    parts.cleanDist([PATHS.build]),
    coreConfig,
    {
      output: {
        // On ajoute un hash court (basé MD5 par défaut) aux noms de fichiers
        // pour améliorer leur mise en cache (*Long-Term Caching*) au moyen
        // d’expirations très longues.
        //
        // L’option `filename` est utilisée pour les *entry chunks*, la
        // `chunkFilename` pour les *async chunks*.
        chunkFilename: '[name].[chunkhash:8].js',
        filename: '[name].[chunkhash:8].js',
      },
    },
    // Changement du type de source maps pour les mettre dans des fichiers à
    // part, et avec le plus fort niveau de détail possible.
    parts.generateSourceMaps({ type: 'source-map' }),

    // On permet l’analyse statique des conditions basées sur
    // `process.env.NODE_ENV`, afin que les minifieurs (notamment JS, donc
    // UglifyJS) puissent considérer ces blocs comme du code mort le cas
    // échéant, et donc les éliminer (*Dead Code Elimination*, DCE).
    parts.makeNonProductionCodeStrippable(),

    // *Scope hoisting*, lorsque c’est possible, sur les modules ES.
    parts.concatenateModules(),
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

    // Inlining du *runtime chunk* (extrait par notre `autoVendor()` dans la
    // config commune) directement dans le HTML, pour s’économiser une requête
    // HTTP (la runtime est très, très inférieure à 30Ko, le jeu en vaut donc la
    // chandelle).
    parts.inlineRuntime(),

    // Publier le manifeste des assets et de leurs versions « fingerprintées »,
    // pour exploitation potentielle par de la génération tierce de HTML.
    parts.publishManifest(),

    // Si l’environnement demande l’activation de Webpack Monitor, on l’ajoute
    // (voir nos scripts dans `package.json`)
    process.env.WEBPACK_MONITOR === 'true' ? parts.monitor() : undefined
  )

// On exporte une fonction : elle recevra en argument la valeur composée à
// partir des arguments `--env` de la CLI ; on n’en passe pas, donc à défaut
// elle prend le `process.env.NODE_ENV` en vigueur et renvoie la config
// appropriée.
module.exports = (env = process.env.NODE_ENV) =>
  env === 'production' ? prodConfig() : devConfig()
