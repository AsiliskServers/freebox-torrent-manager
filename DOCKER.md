# 🐳 Déploiement Docker

## Prérequis

- Docker installé
- Docker Compose (optionnel mais recommandé)

## Démarrage rapide avec Docker Compose

```bash
# 1. Cloner le repository
git clone https://github.com/AsiliskServers/freebox-torrent-manager.git
cd freebox-torrent-manager

# 2. Créer le dossier pour les données persistantes
mkdir -p data

# 3. Lancer l'application
docker-compose up -d

# 4. Accéder à l'application
# Ouvrir http://localhost:3000 dans votre navigateur
```

## Commandes utiles

```bash
# Voir les logs en temps réel
docker-compose logs -f

# Redémarrer l'application
docker-compose restart

# Arrêter l'application
docker-compose down

# Reconstruire l'image après modification du code
docker-compose up -d --build
```

## Déploiement avec Docker seul

```bash
# Build de l'image
docker build -t freebox-torrent-manager .

# Lancer le conteneur
docker run -d \
  --name freebox-torrent-manager \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -e NUXT_PUBLIC_FREEBOX_API_URL=http://mafreebox.freebox.fr \
  -e DATA_DIR=/app/data \
  freebox-torrent-manager

# Voir les logs
docker logs -f freebox-torrent-manager

# Arrêter et supprimer le conteneur
docker stop freebox-torrent-manager
docker rm freebox-torrent-manager
```

## Configuration

### Variables d'environnement

Vous pouvez modifier les variables d'environnement dans le fichier `docker-compose.yml` :

```yaml
environment:
  - NUXT_HOST=0.0.0.0
  - NUXT_PORT=3000
  - NUXT_PUBLIC_FREEBOX_API_URL=http://mafreebox.freebox.fr  # URL de votre Freebox
  - DATA_DIR=/app/data  # Dossier pour persister le token
  - NODE_ENV=production
```

### Personnaliser le port

Pour utiliser un autre port que 3000 :

```yaml
ports:
  - "8080:3000"  # Accessible sur http://localhost:8080
```

## Persistence des données

Le token d'authentification Freebox est stocké dans le dossier `./data` qui est monté comme volume Docker. Cela permet de :

- Conserver l'authentification après redémarrage du conteneur
- Éviter de re-valider l'application sur l'écran LCD de la Freebox

**Important** : Ne supprimez pas le dossier `./data` si vous voulez garder votre authentification.

## Production

Pour un déploiement en production, pensez à :

1. Utiliser un reverse proxy (nginx, Traefik) devant l'application
2. Configurer le HTTPS
3. Limiter l'accès réseau au strict nécessaire
4. Mettre en place des sauvegardes du dossier `data/`

Exemple avec Traefik :

```yaml
version: '3.8'

services:
  freebox-torrent-manager:
    build: .
    container_name: freebox-torrent-manager
    environment:
      - NUXT_PUBLIC_FREEBOX_API_URL=http://mafreebox.freebox.fr
      - DATA_DIR=/app/data
    volumes:
      - ./data:/app/data
    networks:
      - web
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.freebox.rule=Host(`torrents.example.com`)"
      - "traefik.http.routers.freebox.entrypoints=websecure"
      - "traefik.http.routers.freebox.tls.certresolver=letsencrypt"

networks:
  web:
    external: true
```

## Troubleshooting

### L'application ne démarre pas

```bash
# Vérifier les logs
docker-compose logs

# Vérifier que le port 3000 n'est pas déjà utilisé
netstat -tuln | grep 3000
```

### Problème de connexion à la Freebox

Vérifiez que l'URL de la Freebox est correcte dans `docker-compose.yml` :
- Par défaut : `http://mafreebox.freebox.fr`
- Si ça ne fonctionne pas, essayez l'IP directe : `http://192.168.x.x` (IP de votre Freebox)

### Token perdu après redémarrage

Vérifiez que le volume est bien monté :
```bash
docker-compose exec freebox-torrent-manager ls -la /app/data
```

Le fichier `.freebox-token.json` doit être présent.
