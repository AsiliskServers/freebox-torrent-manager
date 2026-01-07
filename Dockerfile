# Étape 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci

# Copier le code source
COPY . .

# Build de l'application
RUN npm run build

# Étape 2: Production
FROM node:20-alpine

WORKDIR /app

# Copier les fichiers nécessaires depuis le builder
COPY --from=builder /app/.output /app/.output
COPY --from=builder /app/package*.json ./

# Variables d'environnement par défaut
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000
ENV NODE_ENV=production

# Exposer le port
EXPOSE 3000

# Démarrer l'application
CMD ["node", ".output/server/index.mjs"]
