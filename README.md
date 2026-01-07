# 🚀 Freebox Torrent Manager

<div align="center">

[![Version](https://img.shields.io/badge/version-1.1.0-blue)](https://github.com/AsiliskServers/freebox-torrent-manager/releases/tag/v1.1.0)
[![Nuxt 3](https://img.shields.io/badge/Nuxt-3.20-00DC82?logo=nuxt.js&logoColor=white)](https://nuxt.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vue 3](https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vue.js&logoColor=white)](https://vuejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

**Interface web moderne et intuitive pour piloter le moteur torrent de votre Freebox Ultra**

[Fonctionnalités](#-fonctionnalités) • [Installation](#-installation) • [Docker](#-docker) • [Configuration](#️-configuration) • [Contribution](#-contribution)

</div>

---
<img width="1901" height="941" alt="image" src="https://github.com/user-attachments/assets/67e0ea89-9fc1-439f-898f-90bd518d4a65" />

## ✨ Fonctionnalités

### 🔐 Authentification
- Enregistrement unique avec validation LCD
- Token persistant (reconnexion automatique)
- Gestion sécurisée des sessions

### 📊 Dashboard en temps réel
- Statistiques globales (total, en cours, en attente, en partage, terminés, erreurs)
- Mise à jour automatique toutes les 2 secondes
- Bouton de rafraîchissement manuel
- Compteur "En attente" incluant les torrents arrêtés

### ⬇️ Gestion des téléchargements
- **Ajout flexible** : URL, liens magnet, fichiers .torrent
- **Upload multiple** : plusieurs URLs ou fichiers en une fois
- **Drag & Drop** : glissez-déposez vos .torrent
- **Dossier de destination** : configuration dynamique avec concaténation automatique
- **Détection de doublons** : message d'erreur inline lors de l'ajout
- **Actions complètes** : démarrer, arrêter, reprendre, supprimer
- **Suppression intelligente** : avec ou sans les fichiers téléchargés

### 🔍 Organisation
- **Recherche** : filtrage instantané par nom
- **Filtres** : par statut (tous, en partage, en cours, en attente, terminés, erreurs)
- **Tri** : par nom, taille, ratio, temps restant, date d'ajout
- **Ordre** : ascendant/descendant

### 📈 Informations détaillées
- Barre de progression avec pourcentage
- Vitesses download/upload en temps réel
- ETA (temps restant estimé)
- Ratio actuel et ratio cible
- Nombre de seeders
- Date d'ajout (format intelligent)
- Logs d'erreur pour les téléchargements en échec

### 🎨 Interface
- Design moderne avec **Nuxt UI** et **Tailwind CSS**
- Mode sombre natif
- Responsive (adaptée mobile/tablette)
- Icônes **Heroicons**

---

## 🚀 Installation

### Prérequis

- **Node.js** 20+
- **npm** ou **pnpm**
- Une **Freebox Ultra** accessible sur votre réseau local

### Étapes

```bash
# 1. Cloner le repository
git clone https://github.com/your-username/freebox-torrent-manager.git
cd freebox-torrent-manager

# 2. Installer les dépendances
npm install

# 3. Copier le fichier d'environnement
cp .env.example .env

# 4. (Optionnel) Modifier .env si nécessaire
# NUXT_PUBLIC_FREEBOX_API_URL=http://mafreebox.freebox.fr

# 5. Lancer en développement
npm run dev
```

L'application sera accessible sur **http://localhost:3000**

### Production

```bash
# Build
npm run build

# Preview
npm run preview
```

---

## 🐳 Docker

### Docker Compose (Recommandé)

```bash
# Créer le dossier de données
mkdir -p data

# Lancer l'application
docker-compose up -d

# Voir les logs
docker-compose logs -f
```

### Docker seul

```bash
# Build
docker build -t freebox-torrent-manager .

# Run
docker run -d \
  --name freebox-torrent-manager \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -e NUXT_PUBLIC_FREEBOX_API_URL=http://mafreebox.freebox.fr \
  freebox-torrent-manager
```

📚 Documentation complète : [DOCKER.md](./DOCKER.md)

---

## ⚙️ Configuration

### Variables d'environnement

Créez un fichier `.env` à la racine :

```env
# URL de votre Freebox
NUXT_PUBLIC_FREEBOX_API_URL=http://mafreebox.freebox.fr

# Informations de l'application (optionnel)
NUXT_FREEBOX_APP_ID=freebox.torrent.manager
NUXT_FREEBOX_APP_NAME=Freebox Torrent Manager
NUXT_FREEBOX_APP_VERSION=1.0.0
NUXT_FREEBOX_DEVICE_NAME=Nuxt App
```

### Première utilisation

1. Ouvrez http://localhost:3000
2. Cliquez sur "Enregistrer l'application"
3. **Validez sur l'écran LCD de votre Freebox** (vous avez 2 minutes)
4. Une fois validé, vous êtes connecté automatiquement
5. Les prochains démarrages se feront sans re-validation

---

## 🏗️ Architecture

```
freebox-torrent-manager/
├── 📁 components/          # Composants Vue réutilisables
│   └── DownloadItem.vue   # Item de téléchargement
├── 📁 middleware/          # Middlewares Nuxt
│   └── auth.ts            # Protection des routes
├── 📁 pages/               # Pages de l'application
│   ├── index.vue          # Dashboard principal
│   └── login.vue          # Authentification
├── 📁 server/              # Backend Nitro
│   ├── api/               # Routes API
│   │   ├── auth.ts        # Authentification
│   │   ├── downloads.ts   # CRUD téléchargements
│   │   └── downloads/
│   │       ├── erase.delete.ts  # Suppression avec fichiers
│   │       ├── log.ts           # Logs d'erreur
│   │       ├── stats.ts         # Statistiques
│   │       └── upload.ts        # Upload .torrent
│   └── utils/
│       └── token-storage.ts    # Persistance token
├── 📁 stores/              # Stores Pinia
│   ├── auth.ts            # Gestion auth
│   └── downloads.ts       # Gestion téléchargements
├── 📁 types/               # Définitions TypeScript
│   ├── freebox-api.ts
│   ├── freebox-auth.ts
│   └── freebox-downloads.ts
├── 📄 .env.example         # Template environnement
├── 📄 docker-compose.yml   # Configuration Docker
├── 📄 Dockerfile           # Image Docker
├── 📄 nuxt.config.ts       # Configuration Nuxt
└── 📄 package.json         # Dépendances
```

---

## 🛠️ Stack Technique

| Catégorie | Technologies |
|-----------|-------------|
| **Frontend** | Vue 3 (Composition API), Nuxt 3.20 |
| **Backend** | Nitro 2.12 (server routes) |
| **UI** | Nuxt UI, Tailwind CSS, Heroicons |
| **State** | Pinia |
| **Language** | TypeScript 5.4 (strict mode) |
| **API** | Freebox OS API v15.0 |
| **Build** | Vite 6.4 |
| **Deploy** | Docker, Docker Compose |

---

## 📖 Utilisation

### Ajouter un torrent

**Via URL/Magnet :**
1. Cliquez sur "+ Ajouter un torrent"
2. Collez l'URL ou le lien magnet
3. (Optionnel) Spécifiez un dossier de destination
4. Cliquez sur "Ajouter"

**Via fichier .torrent :**
- Glissez-déposez le fichier dans la zone prévue
- Ou cliquez pour sélectionner un/plusieurs fichiers

**Upload multiple :**
- Plusieurs URLs : une par ligne dans le champ texte
- Plusieurs fichiers : sélection multiple avec Ctrl/Cmd

### Actions sur un torrent

- **▶️ Démarrer** : Lance le téléchargement
- **⏸️ Arrêter** : Met en pause
- **🔄 Reprendre** : Relance après erreur
- **🗑️ Supprimer** : 
  - "Supprimer" : garde les fichiers téléchargés
  - "Supprimer avec fichiers" : efface tout

### Recherche et filtres

- **Barre de recherche** : filtrage instantané par nom
- **Onglets** : Total / En partage / En cours / Terminés / Erreurs
- **Tri** : cliquez sur les en-têtes de colonnes
- **Ordre** : cliquez à nouveau pour inverser

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Consultez [CONTRIBUTING.md](./CONTRIBUTING.md) pour les guidelines.

### Développement

```bash
# Installer les dépendances
npm install

# Dev avec hot-reload
npm run dev

# Type checking
npm run typecheck

# Build production
npm run build
```

---

## 🔒 Sécurité

Pour signaler une vulnérabilité, consultez [SECURITY.md](./SECURITY.md).

---

## 📄 Licence

Ce projet est sous licence MIT. Voir [LICENSE](./LICENSE) pour plus de détails.

---

## 🙏 Remerciements

- [Freebox](https://www.free.fr/freebox/) pour l'API officielle
- [Nuxt](https://nuxt.com) pour le framework exceptionnel
- [Nuxt UI](https://ui.nuxt.com) pour les composants magnifiques

---

<div align="center">

**⭐ Si ce projet vous est utile, n'oubliez pas de lui donner une étoile !**

Made with ❤️ by the community

</div>
