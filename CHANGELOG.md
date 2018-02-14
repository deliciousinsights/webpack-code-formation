# Évolutions de la codebase de démo Webpack

## v1.3.0 — 29/06/2020

- Gel de maintenance sur l’arbo v3 (elle reste pour consultation seulement).
- Mise à jour intégrale des dépendances et de leur utilisation en configuration.
- Désactivation du plugin HardSource, qui ne marche plus parfaitement bien avec
  les Webpack 4 et Node.js récents, en attendant Webpack 5 qui n’en aura plus
  besoin…
- Mise à jour des utilisations de core-js en retirant @babel/polyfill, déprécié.
- Mise à jour du plugin d’_inlining_ de scripts dans le HTML, et passage des
  scripts d’un chargement synchrone en fin de `<body>` a un chargement déféré
  depuis le `<head>`.

## v1.2.0 — 03/12/2018 (post session novembre 2018)

_Sauf indication contraire, l’ensemble des évolutions sont v3 et v4._

- Ajout d’une démo de `svg-url-loader` avec une SVG en fond de la *hero unit* : la _Data
  URL_ ne pèse plus qu’1Ko au lieu d’1,3Ko en Base64
- Ajout d’une démo de CopyWebpackPlugin pour les fichiers statiques
  (`static/robots.txt`).
- Ajout d’une démo de _tree shaking_ nette au sein de `hacker-case.js` avec un
  export inutilisé et une dépendance interne du coup superflue (v4 seulement,
  avant activaton du _code splitting_). Les abandons de _tree shaking_ sont
  logués sur la sortie d’erreur lors du `npm run build`, avec leur raison, pour
  plus de clarté.
- Ajout d’une démo de _preloading_ (qui pourrait être du _prefetching_ juste en
  changeant le mot-clé) avec un deuxième niveau de chargement dynamique (_code
  splitting_) depuis `hacker-case.js` vers `deeper-hacker.js` (v4 seulement).
- Le templating HTML propose de base un _meta viewport_ propre.
- L’optimisation des images inclue désormais les WebP.
- Réactivation de la compression Zopfli sur les fichiers textuels _et_ les PNG,
  qui sont pas mal rabotés du coup !
- Le manifeste ne se préoccupe plus des `.map` et `.gz`.
- Retrait de la démo d'intégration avec un serveur Node existant : _bad practice._
