#!/bin/bash

# Script de sauvegarde automatique pour Progitek System
# Usage: ./backup.sh [daily|weekly|monthly]

set -e

# Configuration
BACKUP_DIR="/var/backups/progitek"
DB_NAME="progitek_prod"
DB_USER="progitek_user"
RETENTION_DAYS=30
RETENTION_WEEKS=12
RETENTION_MONTHS=12

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction de logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Vérifier les prérequis
check_prerequisites() {
    log "Vérification des prérequis..."
    
    if ! command -v pg_dump &> /dev/null; then
        error "pg_dump n'est pas installé"
        exit 1
    fi
    
    if ! command -v gzip &> /dev/null; then
        error "gzip n'est pas installé"
        exit 1
    fi
    
    # Créer le répertoire de sauvegarde s'il n'existe pas
    mkdir -p "$BACKUP_DIR"/{daily,weekly,monthly}
    
    log "Prérequis vérifiés ✓"
}

# Sauvegarde de la base de données
backup_database() {
    local backup_type=$1
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/$backup_type/progitek_${backup_type}_${timestamp}.sql.gz"
    
    log "Début de la sauvegarde $backup_type de la base de données..."
    
    # Sauvegarde avec pg_dump et compression
    if PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -h localhost -U "$DB_USER" -d "$DB_NAME" \
        --verbose --clean --if-exists --create | gzip > "$backup_file"; then
        log "Sauvegarde de la base de données terminée: $backup_file"
        
        # Vérifier la taille du fichier
        local file_size=$(du -h "$backup_file" | cut -f1)
        log "Taille de la sauvegarde: $file_size"
        
        # Tester l'intégrité de l'archive
        if gzip -t "$backup_file"; then
            log "Intégrité de l'archive vérifiée ✓"
        else
            error "L'archive est corrompue!"
            return 1
        fi
    else
        error "Échec de la sauvegarde de la base de données"
        return 1
    fi
}

# Sauvegarde des fichiers uploadés
backup_uploads() {
    local backup_type=$1
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/$backup_type/progitek_uploads_${backup_type}_${timestamp}.tar.gz"
    
    if [ -d "/app/uploads" ]; then
        log "Sauvegarde des fichiers uploadés..."
        
        if tar -czf "$backup_file" -C /app uploads/; then
            log "Sauvegarde des uploads terminée: $backup_file"
            
            local file_size=$(du -h "$backup_file" | cut -f1)
            log "Taille de la sauvegarde uploads: $file_size"
        else
            warning "Échec de la sauvegarde des uploads"
        fi
    else
        warning "Répertoire uploads non trouvé"
    fi
}

# Sauvegarde des logs
backup_logs() {
    local backup_type=$1
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/$backup_type/progitek_logs_${backup_type}_${timestamp}.tar.gz"
    
    if [ -d "/app/logs" ]; then
        log "Sauvegarde des logs..."
        
        if tar -czf "$backup_file" -C /app logs/; then
            log "Sauvegarde des logs terminée: $backup_file"
        else
            warning "Échec de la sauvegarde des logs"
        fi
    else
        warning "Répertoire logs non trouvé"
    fi
}

# Nettoyage des anciennes sauvegardes
cleanup_old_backups() {
    local backup_type=$1
    local retention_days
    
    case $backup_type in
        daily)
            retention_days=$RETENTION_DAYS
            ;;
        weekly)
            retention_days=$((RETENTION_WEEKS * 7))
            ;;
        monthly)
            retention_days=$((RETENTION_MONTHS * 30))
            ;;
    esac
    
    log "Nettoyage des sauvegardes $backup_type de plus de $retention_days jours..."
    
    find "$BACKUP_DIR/$backup_type" -name "progitek_*" -type f -mtime +$retention_days -delete
    
    log "Nettoyage terminé"
}

# Vérification de l'espace disque
check_disk_space() {
    local available_space=$(df "$BACKUP_DIR" | awk 'NR==2 {print $4}')
    local available_gb=$((available_space / 1024 / 1024))
    
    if [ $available_gb -lt 5 ]; then
        error "Espace disque insuffisant: ${available_gb}GB disponible"
        exit 1
    fi
    
    log "Espace disque disponible: ${available_gb}GB"
}

# Envoi de notification (optionnel)
send_notification() {
    local status=$1
    local message=$2
    
    # Ici vous pouvez ajouter l'envoi d'email, Slack, etc.
    log "Notification: $status - $message"
}

# Fonction principale
main() {
    local backup_type=${1:-daily}
    
    log "=== Début de la sauvegarde $backup_type ==="
    
    check_prerequisites
    check_disk_space
    
    # Effectuer les sauvegardes
    if backup_database "$backup_type" && \
       backup_uploads "$backup_type" && \
       backup_logs "$backup_type"; then
        
        cleanup_old_backups "$backup_type"
        
        log "=== Sauvegarde $backup_type terminée avec succès ==="
        send_notification "SUCCESS" "Sauvegarde $backup_type terminée"
        
    else
        error "=== Échec de la sauvegarde $backup_type ==="
        send_notification "FAILURE" "Échec de la sauvegarde $backup_type"
        exit 1
    fi
}

# Exécution
main "$@"

