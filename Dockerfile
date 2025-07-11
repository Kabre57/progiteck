# Utiliser une image Node.js officielle comme base pour la construction
FROM node:18-alpine as build

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste du code source de l'application
COPY . .

# Construire l'application frontend
RUN npm run build

# Utiliser une image Nginx légère pour servir l'application
FROM nginx:alpine

# Copier la configuration Nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers de build de l'application depuis l'étape de build
COPY --from=build /app/dist /usr/share/nginx/html

# Exposer le port 80 de Nginx
EXPOSE 80

# Commande pour démarrer Nginx
CMD ["nginx", "-g", "daemon off;"]


