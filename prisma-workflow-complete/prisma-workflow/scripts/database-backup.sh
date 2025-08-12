#!/bin/bash

# Script de sauvegarde et restauration de la base de données PostgreSQL
# Usage: ./database-backup.sh [backup|restore] [filename]

set -e

# Variables de configuration
DB_NAME="intervention_dev"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"
BACKUP_DIR="./backups"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions utilitaires
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

# Afficher l'aide
show_help() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "COMMANDS:"
    echo "  backup [filename]    Créer une sauvegarde de la base de données"
    echo "  restore <filename>   Restaurer la base de données depuis une sauvegarde"
    echo "  list                 Lister les sauvegardes disponibles"
    echo "  clean               Nettoyer les anciennes sauvegardes (> 30 jours)"
    echo ""
    echo "OPTIONS:"
    echo "  -h, --help          Afficher cette aide"
    echo ""
    echo "EXAMPLES:"
    echo "  $0 backup                          # Sauvegarde avec nom automatique"
    echo "  $0 backup my-backup                # Sauvegarde avec nom personnalisé"
    echo "  $0 restore backup-2024-08-06.sql   # Restaurer depuis une sauvegarde"
    echo "  $0 list                            # Lister les sauvegardes"
    echo ""
}

# Créer le répertoire de sauvegarde
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        print_message "Répertoire de sauvegarde créé: $BACKUP_DIR"
    fi
}

# Vérifier la connexion à la base de données
check_database_connection() {
    if ! pg_isready -h $DB_HOST -p $DB_PORT &> /dev/null; then
        print_error "Impossible de se connecter à PostgreSQL"
        print_message "Vérifiez que le service PostgreSQL est en cours d'exécution"
        exit 1
    fi
}

# Créer une sauvegarde
create_backup() {
    local filename="$1"
    
    print_step "Création de la sauvegarde..."
    
    # Générer un nom de fichier si non fourni
    if [ -z "$filename" ]; then
        filename="backup-$(date +%Y-%m-%d_%H-%M-%S).sql"
    else
        # Ajouter l'extension .sql si nécessaire
        if [[ "$filename" != *.sql ]]; then
            filename="${filename}.sql"
        fi
    fi
    
    local backup_path="$BACKUP_DIR/$filename"
    
    # Vérifier si le fichier existe déjà
    if [ -f "$backup_path" ]; then
        print_warning "Le fichier de sauvegarde existe déjà: $backup_path"
        read -p "Voulez-vous l'écraser ? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_message "Sauvegarde annulée"
            exit 0
        fi
    fi
    
    # Créer la sauvegarde
    print_message "Sauvegarde en cours vers: $backup_path"
    
    pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
        --verbose \
        --clean \
        --if-exists \
        --create \
        --format=plain \
        --file="$backup_path"
    
    # Vérifier la taille du fichier
    local file_size=$(du -h "$backup_path" | cut -f1)
    print_message "Sauvegarde créée avec succès ✓"
    print_message "Fichier: $backup_path"
    print_message "Taille: $file_size"
    
    # Compresser la sauvegarde
    print_step "Compression de la sauvegarde..."
    gzip "$backup_path"
    local compressed_path="${backup_path}.gz"
    local compressed_size=$(du -h "$compressed_path" | cut -f1)
    print_message "Sauvegarde compressée: $compressed_path"
    print_message "Taille compressée: $compressed_size"
}

# Restaurer une sauvegarde
restore_backup() {
    local filename="$1"
    
    if [ -z "$filename" ]; then
        print_error "Nom de fichier de sauvegarde requis"
        print_message "Usage: $0 restore <filename>"
        exit 1
    fi
    
    # Chercher le fichier dans le répertoire de sauvegarde
    local backup_path=""
    if [ -f "$BACKUP_DIR/$filename" ]; then
        backup_path="$BACKUP_DIR/$filename"
    elif [ -f "$BACKUP_DIR/${filename}.gz" ]; then
        backup_path="$BACKUP_DIR/${filename}.gz"
    elif [ -f "$filename" ]; then
        backup_path="$filename"
    else
        print_error "Fichier de sauvegarde non trouvé: $filename"
        print_message "Fichiers disponibles:"
        list_backups
        exit 1
    fi
    
    print_step "Restauration depuis: $backup_path"
    
    # Avertissement
    print_warning "Cette opération va écraser la base de données existante !"
    read -p "Êtes-vous sûr de vouloir continuer ? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_message "Restauration annulée"
        exit 0
    fi
    
    # Décompresser si nécessaire
    local sql_file="$backup_path"
    if [[ "$backup_path" == *.gz ]]; then
        print_step "Décompression de la sauvegarde..."
        sql_file="${backup_path%.gz}"
        gunzip -c "$backup_path" > "$sql_file"
    fi
    
    # Restaurer la base de données
    print_step "Restauration de la base de données..."
    
    # Arrêter les connexions actives
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c \
        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();" \
        2>/dev/null || true
    
    # Restaurer
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -f "$sql_file"
    
    # Nettoyer le fichier temporaire si décompressé
    if [[ "$backup_path" == *.gz ]] && [ -f "$sql_file" ]; then
        rm "$sql_file"
    fi
    
    print_message "Restauration terminée avec succès ✓"
    
    # Régénérer le client Prisma
    print_step "Régénération du client Prisma..."
    npm run db:generate
    print_message "Client Prisma régénéré ✓"
}

# Lister les sauvegardes
list_backups() {
    print_step "Sauvegardes disponibles dans $BACKUP_DIR:"
    
    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A $BACKUP_DIR 2>/dev/null)" ]; then
        print_message "Aucune sauvegarde trouvée"
        return 0
    fi
    
    echo
    printf "%-30s %-10s %-20s\n" "FICHIER" "TAILLE" "DATE"
    printf "%-30s %-10s %-20s\n" "------" "------" "----"
    
    for file in "$BACKUP_DIR"/*.sql* 2>/dev/null; do
        if [ -f "$file" ]; then
            local basename=$(basename "$file")
            local size=$(du -h "$file" | cut -f1)
            local date=$(date -r "$file" "+%Y-%m-%d %H:%M:%S" 2>/dev/null || stat -c %y "$file" | cut -d' ' -f1-2)
            printf "%-30s %-10s %-20s\n" "$basename" "$size" "$date"
        fi
    done
    echo
}

# Nettoyer les anciennes sauvegardes
clean_backups() {
    local days=${1:-30}
    
    print_step "Nettoyage des sauvegardes de plus de $days jours..."
    
    if [ ! -d "$BACKUP_DIR" ]; then
        print_message "Aucun répertoire de sauvegarde trouvé"
        return 0
    fi
    
    local count=0
    while IFS= read -r -d '' file; do
        local basename=$(basename "$file")
        print_message "Suppression: $basename"
        rm "$file"
        ((count++))
    done < <(find "$BACKUP_DIR" -name "*.sql*" -type f -mtime +$days -print0 2>/dev/null)
    
    if [ $count -eq 0 ]; then
        print_message "Aucune sauvegarde ancienne trouvée"
    else
        print_message "$count sauvegarde(s) supprimée(s)"
    fi
}

# Fonction principale
main() {
    local command="$1"
    local arg="$2"
    
    case "$command" in
        backup)
            create_backup_dir
            check_database_connection
            create_backup "$arg"
            ;;
        restore)
            check_database_connection
            restore_backup "$arg"
            ;;
        list)
            list_backups
            ;;
        clean)
            clean_backups "$arg"
            ;;
        -h|--help|help)
            show_help
            ;;
        "")
            print_error "Commande requise"
            show_help
            exit 1
            ;;
        *)
            print_error "Commande inconnue: $command"
            show_help
            exit 1
            ;;
    esac
}

# Exécuter si le script est appelé directement
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi

