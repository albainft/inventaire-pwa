# PWA Gestion Inventaire

App mobile pour gérer inventaire avec scanner QR code.

- Formulaire saisie articles
- Panier avec édition
- Scanner QR code (caméra)
- Offline mode (localStorage)
- Sync automatique Sheets

---

## Etape 1 : Déployer Google Apps Script

### 1.1 Ouvrir Google Sheets

Allez à votre Sheets:
https://docs.google.com/spreadsheets/d/1g1803avEZ2aHa85WJAORtfF7NxMxwD7tfoKZORB75rg/edit

### 1.2 Créer Apps Script

```
Extensions → Apps Script
(Ou: Tools → Script editor si ancienne interface)
```

### 1.3 Copier le code

- Supprimer le code par défaut
- Copier-coller tout le contenu de `Code.gs`
- Enregistrer (Ctrl+S ou Cmd+S)

### 1.4 Déployer

```
Cliquer "Deploy" (en haut à droite)
→ New deployment
→ Select type: Web app
→ Execute as: Votre compte
→ Who has access: Anyone
→ Deploy
```

### 1.5 Copier l'URL

Après Deploy, AppSheet vous donne une URL:
```
https://script.google.com/macros/d/DEPLOYMENT_ID/usercontent
```

**Copier la partie `DEPLOYMENT_ID`**

### 1.6 Ajouter l'URL au code

Dans `app.js`, ligne 11:
```javascript
const GAS_URL = 'https://script.google.com/macros/d/YOUR_DEPLOYMENT_ID/usercontent';
```

Remplacer `YOUR_DEPLOYMENT_ID` par votre ID.

---

## Etape 2 : Héberger sur GitHub Pages

### 2.1 Créer compte GitHub

Si vous n'avez pas:
https://github.com/signup

### 2.2 Créer un nouveau repo

```
GitHub → New repository
Repository name: inventaire-pwa
Public: Oui
Add README: Non
Create repository
```

### 2.3 Uploader les fichiers

Vous avez 5 fichiers à uploader:
- `index.html`
- `app.js`
- `manifest.json`
- `service-worker.js`
- `README.md`

Dans GitHub:
```
Cliquer "Add file" → Upload files
Drag-drop les 5 fichiers
Cliquer "Commit changes"
```

### 2.4 Activer GitHub Pages

```
Settings → Pages
Build and deployment:
  Source: Deploy from a branch
  Branch: main
  Folder: / (root)
Save
```

GitHub vous donne une URL:
```
https://votreusername.github.io/inventaire-pwa
```

### 2.5 Attendre quelques minutes

GitHub compile le site. Après 1-2 min, la page est accessible.

---

## Etape 3 : Télécharger sur téléphone

### iPhone (Safari)

```
1. Ouvrir Safari
2. Aller à: https://votreusername.github.io/inventaire-pwa
3. Attendre que la page charge
4. Cliquer icone partage (↑ dans la barre)
5. Scroller et cliquer "Sur l'écran d'accueil"
6. Cliquer "Ajouter"
7. App téléchargée dans l'écran d'accueil
```

### Android (Chrome)

```
1. Ouvrir Chrome
2. Aller à: https://votreusername.github.io/inventaire-pwa
3. Attendre que la page charge
4. Menu (3 points) → "Installer l'app"
5. Cliquer "Installer"
6. App téléchargée dans l'écran d'accueil
```

---

## Utilisation

### Ajouter un article

```
Onglet "Ajouter"
1. Remplir Type, Marque, Couleur (obligatoires)
2. Remplir Prix achat, Prix vente (obligatoires)
3. Optionnel: Catégories, TVA
4. Cliquer "Ajouter"
Article enregistré dans Sheets
```

### Utiliser le panier

```
Onglet "Panier"

Option 1: Scanner QR
  1. Cliquer "Demarrer camera"
  2. Scanner le QR code d'un article
  3. Article s'ajoute au panier

Option 2: Entrer ID manuellement
  1. Dans le champ texte, taper l'ID
  2. Appuyer Entree
  3. Article s'ajoute au panier

Modifier le panier:
  - Quantité: Changer la valeur
  - Prix: Changer la valeur
  - Supprimer: Cliquer bouton "Supprimer"
  - Réduction: Entrer % au bas

Valider:
  1. Vérifier le total final
  2. Cliquer "Valider"
  3. Articles passent au statut "vendu" dans Sheets
  4. Panier se vide
```

### Offline mode

```
L'app fonctionne sans internet:
- Scanner QR: Fonctionne offline
- Ajouter article: Fonctionne offline (sauvegardé local)
- Panier: Sauvegardé automatiquement (localStorage)

Quand vous reconnectez:
- Les données sync automatiquement à Sheets
```

---

## Troubleshooting

### "Erreur: Tous les champs obligatoires"

→ Vérifier que Type, Marque, Couleur, Prix achat, Prix vente sont remplis

### "Article non trouve"

→ Vérifier l'ID tapé ou scanné correspond à un ID dans Sheets

### "Erreur: Impossible d'accéder à Sheets"

→ Vérifier que:
  1. DEPLOYMENT_ID dans app.js est correct
  2. Apps Script a été déployé
  3. Vous avez une connexion internet
  4. L'ID du Sheets dans Code.gs est correct

### "Camera ne fonctionne pas"

→ Vérifier:
  1. Vous avez autorisé l'accès caméra (popup du navigateur)
  2. Vous êtes sur HTTPS (GitHub Pages = HTTPS)
  3. Vous avez une caméra sur le device
  4. Sur Android: Chrome, pas Safari

### "Panier vide après refresh"

→ C'est normal. Le panier est sauvegardé en localStorage.
   Si vous fermez l'app complètement, il se réinitialise.
   Cliquer "Valider" pour sauvegarder dans Sheets.

---

## Architecture

```
Frontend (PWA):
  index.html        → Interface HTML
  app.js            → Logique JavaScript
  manifest.json     → Config téléchargement
  service-worker.js → Offline mode

Backend (Google Apps Script):
  Code.gs           → Lire/écrire Sheets

Données:
  Google Sheets     → Base de données

Hébergement:
  GitHub Pages      → Front (static)
  Google Apps Script → Back (serverless)
  Google Sheets     → Data (cloud)
```

---

## Notes

- Pas d'authentification (accès direct)
- Offline mode: données en localStorage
- Sync auto: quand connexion active
- Pas de limite utilisateurs
- Pas de limite stockage (Sheets limit)

---

## Support

Question? Vérifier:
1. Les IDs sont corrects (Sheets ID, Deployment ID)
2. Apps Script est déployé
3. GitHub Pages est activé
4. Vous avez une connexion internet pour sync

---

**Created:** 2026-09-07  
**Version:** 1.0  
**License:** MIT
