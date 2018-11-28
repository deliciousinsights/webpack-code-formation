# Exercice : configuration nue Babel + Stylus

Le dossier `src/` contient trois sources :

- `index.html`, que vous ouvrirez dans votre navigateur, et qui doit à terme
  utiliser les bons styles et exécuter le script
- `index.js`, qui est la source pré-Babel du script. Elle ne passera pas telle
  quelle dans le navigateur.
- `index.styl`, la feuille de style, importée depuis le script et qui sera donc
  auto-injectée (une fois transpilée par Stylus) dans le document.

# Étapes

1. Installez Webpack 4 et sa CLI
2. Configurez les scripts npm `build` et `start`
3. Regardez ce que donne le build en mode zéro-config
4. Procédez aux ajustements structurels (dossier de sortie, etc.)
5. Installez et configurez Babel en `preset-env`
6. Installez et configurez le chargement CSS pour une base Stylus (`stylus`, `stylus-loader`)
7. Vérifiez que le build produit désormais le bon résultat, et que ça marche
   dans `index.html`
