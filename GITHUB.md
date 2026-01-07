# 📝 Guide de mise en ligne sur GitHub

## Étapes pour pousser le projet

### 1. Initialiser Git (si ce n'est pas déjà fait)

```bash
git init
git add .
git commit -m "🎉 Initial commit - Freebox Torrent Manager v1.0.0"
```

### 2. Créer un repository sur GitHub

1. Aller sur https://github.com/new
2. Nom du repo : `freebox-torrent-manager`
3. Description : `Modern web interface to manage torrents on Freebox Ultra`
4. Choisir Public ou Private
5. **NE PAS** initialiser avec README, .gitignore ou LICENSE (déjà présents)
6. Cliquer sur "Create repository"

### 3. Lier le repository local à GitHub

```bash
# Remplacer YOUR_USERNAME par votre nom d'utilisateur GitHub
git remote add origin https://github.com/AsiliskServers/freebox-torrent-manager.git

# Vérifier
git remote -v
```

### 4. Pousser le code

```bash
# Première fois
git branch -M main
git push -u origin main

# Par la suite
git push
```

### 5. Configuration post-upload

Une fois sur GitHub, configurez :

#### Topics (tags)
Ajoutez ces topics au repo pour le rendre visible :
- `freebox`
- `torrent`
- `manager`
- `nuxt3`
- `vue3`
- `typescript`
- `freebox-ultra`
- `docker`
- `tailwindcss`

#### About section
Cochez :
- ✅ Website: `https://your-username.github.io/freebox-torrent-manager` (si GitHub Pages)
- ✅ Topics: (ajoutés ci-dessus)

#### Settings à vérifier
- **Branches** : Protéger la branche `main`
- **Security** : Activer Dependabot
- **Pages** : Désactiver (pas nécessaire)

## 📋 Checklist avant de push

✅ Vérifications effectuées :
- [x] `.gitignore` complet (node_modules, .env, token, etc.)
- [x] Pas de fichiers sensibles (tokens, mots de passe)
- [x] `.env.example` présent et à jour
- [x] README.md complet et formaté
- [x] LICENSE présent (MIT)
- [x] CONTRIBUTING.md présent
- [x] SECURITY.md présent
- [x] CHANGELOG.md présent
- [x] Docker configuré (Dockerfile + docker-compose.yml)
- [x] package.json à jour (repo URL, author, keywords)
- [x] Code nettoyé (pas de console.log de debug)
- [x] TypeScript sans erreurs

## 🔧 Commandes Git utiles

```bash
# Voir le statut
git status

# Voir les fichiers ignorés
git status --ignored

# Vérifier qu'aucun fichier sensible n'est tracké
git ls-files | grep -E '\.env$|token|secret'

# Ajouter des fichiers
git add .

# Commit
git commit -m "✨ feat: nouvelle fonctionnalité"
git commit -m "🐛 fix: correction de bug"
git commit -m "📝 docs: mise à jour documentation"
git commit -m "♻️ refactor: refactorisation du code"

# Push
git push

# Créer une release
git tag -a v1.0.0 -m "Version 1.0.0"
git push origin v1.0.0
```

## 🎨 Badges pour le README

Une fois le repo créé, ajoutez ces badges dans le README :

```markdown
![GitHub stars](https://img.shields.io/github/stars/YOUR_USERNAME/freebox-torrent-manager)
![GitHub forks](https://img.shields.io/github/forks/YOUR_USERNAME/freebox-torrent-manager)
![GitHub issues](https://img.shields.io/github/issues/YOUR_USERNAME/freebox-torrent-manager)
![GitHub last commit](https://img.shields.io/github/last-commit/YOUR_USERNAME/freebox-torrent-manager)
```

## 🚀 Après la mise en ligne

1. **Créer une Release** : GitHub > Releases > Draft a new release
2. **Activer Discussions** : Settings > Features > Discussions
3. **Ajouter des labels** : Issues > Labels (enhancement, bug, question, etc.)
4. **Créer un template d'issue** : .github/ISSUE_TEMPLATE/
5. **Partager** : Reddit, forums, réseaux sociaux

## 📝 Exemple de description GitHub

```
🚀 Interface web moderne pour gérer vos torrents sur Freebox Ultra

✨ Fonctionnalités :
• Authentification automatique avec token persistant
• Dashboard temps réel avec statistiques
• Ajout de torrents (URL, magnet, fichiers)
• Recherche, filtres et tri avancés
• Docker ready avec docker-compose
• UI moderne avec Nuxt 3, Vue 3 et TypeScript

📦 Stack : Nuxt 3 • Vue 3 • TypeScript • Pinia • Tailwind CSS • Docker
```

---

**🎉 Votre projet est maintenant prêt à être partagé avec le monde !**
