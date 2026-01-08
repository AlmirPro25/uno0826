#!/bin/bash
# ========================================
# PROST-QS - Script de Backup SQLite
# "Backup seguro com WAL mode"
# ========================================

set -e

# Configurações (ajustar conforme ambiente)
BACKUP_DIR="${BACKUP_DIR:-/home/prostqs/prost-qs/backups}"
DB_PATH="${DB_PATH:-/home/prostqs/prost-qs/data/prostqs.db}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

# Timestamp
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/prostqs_$DATE.db"

# Criar diretório se não existir
mkdir -p "$BACKUP_DIR"

echo "[$(date)] Iniciando backup..."

# Verificar se DB existe
if [ ! -f "$DB_PATH" ]; then
    echo "[ERROR] Database não encontrado: $DB_PATH"
    exit 1
fi

# Backup seguro usando .backup (funciona com WAL)
sqlite3 "$DB_PATH" ".backup '$BACKUP_FILE'"

if [ $? -eq 0 ]; then
    echo "[$(date)] Backup criado: $BACKUP_FILE"
    
    # Comprimir
    gzip "$BACKUP_FILE"
    echo "[$(date)] Comprimido: ${BACKUP_FILE}.gz"
    
    # Tamanho do backup
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
    echo "[$(date)] Tamanho: $BACKUP_SIZE"
else
    echo "[ERROR] Falha ao criar backup"
    exit 1
fi

# Limpar backups antigos
echo "[$(date)] Removendo backups com mais de $RETENTION_DAYS dias..."
DELETED=$(find "$BACKUP_DIR" -name "prostqs_*.db.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)
echo "[$(date)] Removidos: $DELETED arquivos antigos"

# Listar backups atuais
echo "[$(date)] Backups disponíveis:"
ls -lh "$BACKUP_DIR"/*.gz 2>/dev/null || echo "  Nenhum backup encontrado"

echo "[$(date)] Backup concluído com sucesso!"
