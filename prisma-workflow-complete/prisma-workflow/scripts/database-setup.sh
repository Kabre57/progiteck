#!/bin/bash

# Script de configuration de la base de données PostgreSQL pour Prisma Workflow
# Ce script configure une base de données PostgreSQL locale pour le développement

set -e

echo "🐘 Configuration de la base de données PostgreSQL pour Prisma Workflow"
echo "=================================================================="

# Variables de configuration
DB_NAME="intervention_dev"
DB_USER="postgres"
DB_PASSWORD="password"
DB_HOST="localhost"
DB_PORT="5432"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages colorés
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Vérifier si PostgreSQL est installé
check_postgresql() {
    print_step "Vérification de l'installation PostgreSQL..."
    
    if ! command -v psql &> /dev/null; then
        print_error "PostgreSQL n'est pas installé ou n'est pas dans le PATH"
        print_message "Veuillez installer PostgreSQL avant de continuer"
        print_message "Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
        print_message "macOS: brew install postgresql"
        print_message "Windows: Téléchargez depuis https://www.postgresql.org/download/"
        exit 1
    fi
    
    print_message "PostgreSQL est installé ✓"
}

# Vérifier si le service PostgreSQL est en cours d'exécution
check_postgresql_service() {
    print_step "Vérification du service PostgreSQL..."
    
    if ! pg_isready -h $DB_HOST -p $DB_PORT &> /dev/null; then
        print_warning "Le service PostgreSQL ne semble pas être en cours d'exécution"
        print_message "Tentative de démarrage du service..."
        
        # Essayer de démarrer le service selon l'OS
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            sudo systemctl start postgresql || print_error "Impossible de démarrer PostgreSQL"
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            brew services start postgresql || print_error "Impossible de démarrer PostgreSQL"
        fi
        
        # Vérifier à nouveau
        if ! pg_isready -h $DB_HOST -p $DB_PORT &> /dev/null; then
            print_error "Impossible de se connecter à PostgreSQL"
            print_message "Veuillez démarrer manuellement le service PostgreSQL"
            exit 1
        fi
    fi
    
    print_message "Service PostgreSQL en cours d'exécution ✓"
}

# Créer la base de données si elle n'existe pas
create_database() {
    print_step "Création de la base de données '$DB_NAME'..."
    
    # Vérifier si la base de données existe déjà
    if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
        print_warning "La base de données '$DB_NAME' existe déjà"
        read -p "Voulez-vous la recréer ? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_message "Suppression de la base de données existante..."
            dropdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME
        else
            print_message "Conservation de la base de données existante"
            return 0
        fi
    fi
    
    # Créer la base de données
    createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME
    print_message "Base de données '$DB_NAME' créée ✓"
}

# Configurer les variables d'environnement
setup_environment() {
    print_step "Configuration des variables d'environnement..."
    
    # Créer le fichier .env s'il n'existe pas
    if [ ! -f .env ]; then
        print_message "Création du fichier .env..."
        cp .env.example .env
    fi
    
    # Mettre à jour l'URL de la base de données dans .env
    DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME?schema=public"
    
    if grep -q "DATABASE_URL=" .env; then
        # Remplacer la ligne existante
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|DATABASE_URL=.*|DATABASE_URL=\"$DATABASE_URL\"|" .env
        else
            sed -i "s|DATABASE_URL=.*|DATABASE_URL=\"$DATABASE_URL\"|" .env
        fi
    else
        # Ajouter la ligne
        echo "DATABASE_URL=\"$DATABASE_URL\"" >> .env
    fi
    
    print_message "Variables d'environnement configurées ✓"
}

# Installer les dépendances npm
install_dependencies() {
    print_step "Installation des dépendances npm..."
    
    if [ ! -f package.json ]; then
        print_error "Fichier package.json non trouvé"
        exit 1
    fi
    
    npm install
    print_message "Dépendances installées ✓"
}

# Générer le client Prisma
generate_prisma_client() {
    print_step "Génération du client Prisma..."
    
    npm run db:generate
    print_message "Client Prisma généré ✓"
}

# Exécuter les migrations
run_migrations() {
    print_step "Exécution des migrations Prisma..."
    
    npm run db:migrate
    print_message "Migrations exécutées ✓"
}

# Peupler la base de données
seed_database() {
    print_step "Peuplement de la base de données..."
    
    npm run db:seed
    print_message "Base de données peuplée ✓"
}

# Fonction principale
main() {
    echo
    print_message "Début de la configuration..."
    echo
    
    check_postgresql
    check_postgresql_service
    create_database
    setup_environment
    install_dependencies
    generate_prisma_client
    run_migrations
    seed_database
    
    echo
    print_message "🎉 Configuration terminée avec succès !"
    echo
    print_message "Vous pouvez maintenant :"
    print_message "  - Exécuter 'npm run dev' pour démarrer l'application"
    print_message "  - Exécuter 'npm run db:studio' pour ouvrir Prisma Studio"
    print_message "  - Consulter la documentation dans README.md"
    echo
}

# Vérifier si le script est exécuté directement
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi

