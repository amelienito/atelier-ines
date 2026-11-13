# Atelier — le hub d'Inès

Suivi des binds : **bibliothèque perso** (binds pour elle, bind exchange, fanfics) et **activité pro** (commandes clientes), avec la to-do du jour au milieu et les tableaux façon carnet en dessous.

Site statique (HTML/CSS/JS, aucune installation) → hébergé sur GitHub Pages.

## Ce que fait le site

- Deux côtés séparés (perso / pro), chacun avec sa liste d'étapes par défaut, et un bouton plein écran par côté.
- **+** sur un côté → nouveau projet : on décoche les étapes inutiles pour ce livre, on peut ajouter des étapes « autre » (ex. Envoi du colis).
- Barre de progression par projet, tri par urgence en glissant ⋮⋮.
- **Aujourd'hui** : on choisit les étapes du jour ; cocher ici coche l'étape dans le projet. Le lendemain, ce qui n'est pas fait est reporté.
- Dernière étape cochée → rappel des **livrables** à cocher. Le projet reste en rouge tant que ce n'est pas fini, puis part tout seul dans les **Archives** (rien n'est perdu, on peut le remettre en cours).
- Tableaux croisés titres × étapes (cases cliquables, cases hachurées = étape pas concernée, dates début/fin).
- **Réglages** : listes d'étapes et de livrables par défaut, synchro en ligne, sauvegarde/import, remise à zéro.

Au premier lancement, le site affiche quelques projets d'exemple (tirés des photos). Pour partir d'une page blanche : Réglages → « Repartir de zéro ».

## Mettre en ligne

1. Dépôt public `atelier-ines` avec ces fichiers à la racine.
2. Settings → Pages → Source : *Deploy from a branch* → `main` / `/ (root)`.
3. Adresse : `https://amelienito.github.io/atelier-ines/`

## Synchro ordi ↔ téléphone (optionnelle mais conseillée)

Sans synchro, les données restent dans le navigateur de l'appareil. Avec, elles vont dans un fichier `data.json` d'un **dépôt privé** (avec un historique de chaque modif, donc une sauvegarde automatique).

1. Créer un dépôt **privé** `atelier-ines-data` en cochant **Add a README file**.
2. GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → Generate new token :
   - Repository access : *Only select repositories* → `atelier-ines-data`
   - Permissions → Repository permissions → **Contents : Read and write**
   - Durée : la plus longue proposée
3. Sur chaque appareil d'Inès : Réglages → coller le jeton → Connecter.

Si le jeton expire, la pastille en haut passe en « Synchro en panne » : refaire un jeton et le recoller.

## Fichiers

- `index.html` — la page
- `style.css` — l'apparence (couleurs en haut du fichier)
- `app.js` — tout le fonctionnement (listes d'étapes par défaut tout en haut)
- `manifest.json`, icônes — pour « Ajouter à l'écran d'accueil » sur iPhone
