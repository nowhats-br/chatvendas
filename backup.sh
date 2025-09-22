#!/bin/bash

# Script de Backup Automático - ChatVendas
# Faz backup das sessões WhatsApp e configurações importantes

# Configurações
BACKUP_DIR="/opt/chatvendas/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="sessions_${DATE}.tar.gz"
RETENTION_DAYS=7

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função de log
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Verificar se está rodando como usuário chatvendas
if [ "$USER" != "chatvendas" ]; then
    error "Este script deve ser executado como usuário 'chatvendas'"
    error "Use: sudo -u chatvendas $0"
    exit 1
fi

# Criar diretório de backup se não existir
mkdir -p "$BACKUP_DIR"

log "Iniciando backup das sessões WhatsApp..."

# Verificar se os diretórios de sessão existem
BAILEYS_SESSIONS="/opt/chatvendas/server/baileys-service/sessions"
WEBJS_SESSIONS="/opt/chatvendas/server/webjs-service/.wwebjs_auth"

if [ ! -d "$BAILEYS_SESSIONS" ] && [ ! -d "$WEBJS_SESSIONS" ]; then
    warning "Nenhum diretório de sessão encontrado"
    exit 0
fi

# Criar backup temporário
TEMP_DIR="/tmp/chatvendas_backup_${DATE}"
mkdir -p "$TEMP_DIR"

# Backup das sessões Baileys
if [ -d "$BAILEYS_SESSIONS" ] && [ "$(ls -A $BAILEYS_SESSIONS 2>/dev/null)" ]; then
    log "Fazendo backup das sessões Baileys..."
    mkdir -p "$TEMP_DIR/baileys-sessions"
    cp -r "$BAILEYS_SESSIONS"/* "$TEMP_DIR/baileys-sessions/" 2>/dev/null || true
else
    log "Nenhuma sessão Baileys encontrada"
fi

# Backup das sessões Web.js
if [ -d "$WEBJS_SESSIONS" ] && [ "$(ls -A $WEBJS_SESSIONS 2>/dev/null)" ]; then
    log "Fazendo backup das sessões Web.js..."
    mkdir -p "$TEMP_DIR/webjs-sessions"
    cp -r "$WEBJS_SESSIONS"/* "$TEMP_DIR/webjs-sessions/" 2>/dev/null || true
else
    log "Nenhuma sessão Web.js encontrada"
fi

# Backup dos arquivos de configuração
log "Fazendo backup das configurações..."
mkdir -p "$TEMP_DIR/config"

# Backup do .env (sem valores sensíveis)
if [ -f "/opt/chatvendas/.env" ]; then
    # Criar versão sanitizada do .env
    grep -E '^[A-Z_]+=.*' /opt/chatvendas/.env | sed 's/=.*/=***HIDDEN***/' > "$TEMP_DIR/config/env.template"
fi

# Backup do ecosystem.config.js
if [ -f "/opt/chatvendas/ecosystem.config.js" ]; then
    cp "/opt/chatvendas/ecosystem.config.js" "$TEMP_DIR/config/"
fi

# Verificar se há algo para fazer backup
if [ ! "$(ls -A $TEMP_DIR 2>/dev/null)" ]; then
    warning "Nenhum arquivo encontrado para backup"
    rm -rf "$TEMP_DIR"
    exit 0
fi

# Criar arquivo compactado
log "Compactando backup..."
cd "$TEMP_DIR"
tar -czf "$BACKUP_DIR/$BACKUP_FILE" . 2>/dev/null

if [ $? -eq 0 ]; then
    log "Backup criado com sucesso: $BACKUP_FILE"
    
    # Calcular tamanho do backup
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
    log "Tamanho do backup: $BACKUP_SIZE"
else
    error "Falha ao criar backup"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Limpar diretório temporário
rm -rf "$TEMP_DIR"

# Remover backups antigos
log "Removendo backups antigos (mais de $RETENTION_DAYS dias)..."
find "$BACKUP_DIR" -name "sessions_*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete 2>/dev/null

# Listar backups disponíveis
log "Backups disponíveis:"
ls -lh "$BACKUP_DIR"/sessions_*.tar.gz 2>/dev/null | while read line; do
    echo "  $line"
done

log "Backup concluído com sucesso!"

# Verificar espaço em disco
DISK_USAGE=$(df /opt/chatvendas | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    warning "Uso de disco alto: ${DISK_USAGE}%"
    warning "Considere limpar backups antigos ou aumentar o espaço em disco"
fi