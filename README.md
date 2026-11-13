# Atelier — le hub d'Inès

Suivi des binds : **bibliothèque perso** d'un côté, **activité pro** de l'autre, et au milieu ce qu'Inès fait **aujourd'hui**. Pensé pour l'ordi, l'iPad et l'iPhone.

En ligne : https://amelienito.github.io/atelier-ines/

## Ce que fait le site

- **Projets** avec emoji, couverture (dégradé ou photo), type, cliente/contact, dates, notes. Tout se modifie directement en cliquant dessus.
- **Étapes** : à la création, on touche celles dont on n'a pas besoin, on ajoute des étapes « autre ». Progression en perles (ou barre). Bouton ✓ pour cocher l'étape en cours depuis la carte, ☀ pour la mettre dans « Aujourd'hui ».
- **Aujourd'hui** : étapes de projets + tâches libres, suggestions « À suivre ». Ce qui n'est pas fait est gardé le lendemain (« d'hier »).
- **Fin d'un livre** : quand toutes les étapes sont faites, une fenêtre de fête rappelle le dossier de livrables ; une fois coché, le livre rejoint l'étagère des **livres terminés**.
- **Vue d'ensemble** : les tableaux façon carnet (cases cliquables), repliables.
- **Personnalisation** : thème clair/sombre/auto, fond, cartes aérées/compactes, perles ou barre, couleurs, noms et emojis des espaces, étapes/livrables/types par défaut. Sur chaque appareil : vibrations, sons, animations réduites.
- **Confort** : glisser-déposer (souris, ou appui long au doigt), recherche ⌘K / Ctrl+K, annuler ⌘Z / Ctrl+Z (et bouton « Annuler » après chaque action importante).

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
- `style.css` — l'apparence (couleurs et thèmes en haut)
- `js/data.js` — modèles par défaut (étapes, livrables, types, palettes), structure des données, fusion
- `js/views.js` — tout l'affichage
- `js/actions.js` — tout ce qui modifie quelque chose (+ annuler)
- `js/sync.js` — mémoire locale, synchro GitHub, historique, couvertures, lien de connexion
- `js/fx.js` — vibrations, sons, confettis, glisser-déposer
- `js/main.js` — démarrage
