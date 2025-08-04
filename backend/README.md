# 🚀 Progitek System Backend

Backend API TypeScript pour le système de gestion technique Progitek.

## 📋 Prérequis

- Node.js 18+ 
- PostgreSQL 14+
- pnpm ou yarn

## 🛠️ Installation

1. **Cloner le projet**
```bash
git clone <repository-url>
cd progitek-backend
```

2. **Installer les dépendances**
```bash
pnpm install
```

3. **Configuration environnement**
```bash
cp .env.example .env
# Éditer .env avec vos paramètres
```

4. **Base de données**
```bash
# Générer le client Prisma
pnpm run db:generate

# Exécuter les migrations
pnpm run db:migrate

# Peupler la base (optionnel)
pnpm run db:seed
```

## 🚀 Démarrage

### Développement
```bash
pnpm run dev
```

### Production
```bash
pnpm run build
pnpm start
```

## 📚 API Documentation

### Authentification
- `POST /api/auth/login` - Connexion
- `POST /api/auth/refresh` - Rafraîchir le token
- `GET /api/auth/profile` - Profil utilisateur

### Missions
- `GET /api/missions` - Liste des missions
- `GET /api/missions/{numIntervention}` - Détails d'une mission
- `POST /api/missions` - Créer une mission
- `PUT /api/missions/{numIntervention}` - Modifier une mission
- `DELETE /api/missions/{numIntervention}` - Supprimer une mission

### Clients
- `GET /api/clients` - Liste des clients
- `GET /api/clients/{id}` - Détails d'un client
- `POST /api/clients` - Créer un client
- `PUT /api/clients/{id}` - Modifier un client
- `DELETE /api/clients/{id}` - Supprimer un client

### Techniciens
- `GET /api/techniciens` - Liste des techniciens
- `GET /api/techniciens/{id}` - Détails d'un technicien
- `POST /api/techniciens` - Créer un technicien
- `PUT /api/techniciens/{id}` - Modifier un technicien
- `DELETE /api/techniciens/{id}` - Supprimer un technicien

## 🔐 Authentification

L'API utilise JWT avec refresh tokens :

```bash
# Connexion
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@progitek.com","motDePasse":"admin123"}'

# Utilisation du token
curl -X GET http://localhost:3000/api/missions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🏗️ Architecture

```
src/
├── config/          # Configuration (DB, logs)
├── controllers/     # Contrôleurs API
├── middleware/      # Middleware Express
├── routes/          # Définition des routes
├── types/           # Types TypeScript
├── utils/           # Utilitaires
└── server.ts        # Point d'entrée
```

## 🔧 Scripts Disponibles

- `pnpm run dev` - Développement avec hot reload
- `pnpm run build` - Build production
- `pnpm start` - Démarrer en production
- `pnpm run db:generate` - Générer client Prisma
- `pnpm run db:migrate` - Migrations base de données
- `pnpm run db:seed` - Peupler la base
- `pnpm run lint` - Linter TypeScript
- `pnpm test` - Tests unitaires

## 🌍 Variables d'Environnement

Voir `.env.example` pour la liste complète des variables.

### Essentielles
- `DATABASE_URL` - URL PostgreSQL
- `JWT_SECRET` - Secret pour les tokens
- `JWT_REFRESH_SECRET` - Secret pour refresh tokens
- `CORS_ORIGIN` - URL du frontend

## 📊 Monitoring

- Health check : `GET /api/health`
- Logs : `logs/progitek.log`
- Métriques : Port 9090 (si activé)

## 🧪 Tests

```bash
pnpm test
```

## 🚀 Déploiement

Voir `GUIDE_DEPLOIEMENT.md` pour les instructions complètes.

## 📞 Support

- Email : support@progitek.com
- Documentation : `/docs`