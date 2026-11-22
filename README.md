# Atelier — le hub d'Inès

Suivi des binds : **bibliothèque perso** d'un côté, **activité pro** de l'autre, et au milieu ce qu'Inès fait **aujourd'hui**. Pensé pour l'ordi, l'iPad et l'iPhone.

En ligne : https://amelienito.github.io/atelier-ines/

## Ce que fait le site

Le tableau reprend le croquis d'Inès : la bibliothèque perso à gauche, l'activité pro à droite, la feuille du jour posée sur la couture, et dessous le carnet. La couleur ne sert qu'à une chose : montrer ce qui est fait, comme un coup de surligneur (rose pour le perso, vert pour le pro, réglables).

- **Les livres** : une ligne par livre, avec une case par étape (surlignée quand elle est faite), la prochaine étape à cocher sur place, le soleil pour la prévoir aujourd'hui, la date « à rendre » pour les commandes (en rouge à trois jours), une vignette si le livre a une photo. On les range dans son ordre d'urgence en les faisant glisser (souris, ou appui long au doigt). Le bouton d'agrandissement met un espace en plein écran, avec toutes les étapes restantes à prévoir pour aujourd'hui.
- **Aujourd'hui** : étapes des livres et tâches libres, rangées par espace. Une tâche cochée se surligne puis s'en va (« N tâches faites aujourd'hui » pour les revoir). L'ordre se change en glissant. Ce qui n'est pas fait est gardé le lendemain (« d'hier »).
- **Le carnet** : le pourcentage de tout l'atelier (étapes et livrables), toute la liste d'un trait (un bâtonnet par case), les étapes cochées ces sept derniers jours, puis le tableau croisé de chaque espace comme dans son cahier (en-têtes verticaux, une case par étape qu'on surligne d'un clic, dates de début et de fin, pourcentage par livre).
- **Fin d'un livre** : à la dernière étape, la fenêtre des livrables ; le livre reste en rouge tant qu'ils ne sont pas cochés, puis il part sur l'étagère des **livres terminés** (photo, date, durée).
- **Barre d'outils** : Drive, Gmail, Shopify, Enbooken, Pinterest, Cosmos et **Pour Inès** (l'outil de mise en page, `pour-ines.html`), la **musique** et la taille de l'affichage.
- **Musique** : la sélection de Music Discovery (`js/music.js`). Rien ne se lance tout seul ; une fois lancée, elle se range en petit dans un coin. Calme, posé ou un peu de tout. Rien n'est écrit dans les données d'Inès. Le bouton se masque dans Réglages.
- **Sans Internet** : `sw.js` garde une copie de l'atelier et de Pour Inès. En ligne, tout vient toujours du réseau (jamais d'ancienne version).
- **Réglages** : jour / nuit, couleur de chaque espace, étapes, livrables et types par défaut, carnet et favoris affichés ou non. Sur chaque appareil : taille, vibrations, sons, animations réduites, bouton Musique.
- **Confort** : recherche ⌘K / Ctrl+K, annuler ⌘Z / Ctrl+Z (et bouton « Annuler » après chaque action importante).

## Mémoire

1. **Sur l'appareil** : stockage du navigateur + copie de secours (IndexedDB) + une copie par jour gardée 30 jours.
2. **En ligne** : `data.json` dans le dépôt privé `amelienito/atelier-ines-data`. Chaque modification = une version datée (avec le nom de l'appareil). Réglages → Mémoire & synchro → Historique pour revenir en arrière.
3. **Photos de couverture** : `covers/…jpg` dans le même dépôt privé.

Si deux appareils modifient en même temps, les changements sont fusionnés projet par projet (le plus récent gagne, rien ne ressuscite après suppression).

## Connecter un appareil

Sur un appareil déjà connecté : Réglages → Mémoire & synchro → **Copier le lien** (ou Envoyer…). On ouvre ce lien sur l'autre appareil → « Connecter ». C'est tout.

Le lien contient le jeton GitHub : à envoyer en privé seulement.

Sur iPhone/iPad, ajouter le site à l'écran d'accueil (Safari → Partager → « Sur l'écran d'accueil »), puis rouvrir le lien une fois dans l'appli : l'appli installée a son propre stockage et iOS ne l'efface jamais.

Le jeton expire le **13/11/2027** : en refaire un (fine-grained, accès au seul dépôt `atelier-ines-data`, Contents : Read and write) et reconnecter avec. Les données ne sont pas touchées par l'expiration.

## Fichiers

Après une modification, augmenter le numéro `?v=…` dans `index.html` (sinon les navigateurs peuvent garder l'ancienne version jusqu'à 10 minutes).


- `index.html` — la page
- `style.css` — l'apparence (couleurs en haut, coups de surligneur en masques SVG)
- `fonts/` — Mona Sans (licence OFL), servie par le site
- `js/data.js` — modèles par défaut (étapes, livrables, types, surligneurs), structure des données, fusion
- `js/views.js` — tout l'affichage
- `js/actions.js` — tout ce qui modifie quelque chose (+ annuler)
- `js/sync.js` — mémoire locale, synchro GitHub, historique, couvertures, lien de connexion
- `js/fx.js` — vibrations, sons, traits de surligneur, glisser-déposer
- `js/music.js` — le lecteur Music Discovery
- `js/main.js` — démarrage, mise à jour automatique
- `sw.js` — copie hors ligne
- `pour-ines.html` — l'outil de mise en page (fichier autonome)
