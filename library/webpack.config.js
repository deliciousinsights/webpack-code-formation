// Webpack (sortie Library) - Configuration
// ========================================

const Path = require('path')

// Chemins principaux
// ------------------

const PATHS = {
  build: Path.resolve(__dirname, 'dist'),
  // Les entries peuvent être relatives, mais au CWD, alors
  // autant forcer l’absolu par rapport au fichier de config.
  source: Path.resolve(__dirname, 'src'),
}

module.exports = {
  // Point d’entrée de la bibliothèque
  entry: PATHS.source,
  output: {
    path: PATHS.build,
    // Nom du fichier produit, et donc du module à requérir
    filename: 'string-tricks.js',
    // Noms d’exploitation
    library: {
      // Exports nommés CommonJS / CommonJS2
      commonjs: 'stringTricks',
      // Nom du module dans le `define(…)` AMD
      amd: 'string-tricks',
      // Nom de la variable « globale » en utilisation basique
      root: 'stringTricks',
    },
    // Type d’enrobage d’exploitation : UMD permet tout le monde
    libraryTarget: 'umd',
    // On préfère nommer nos modules AMD lors du `define(…)`.
    umdNamedDefine: true,
  },
}
