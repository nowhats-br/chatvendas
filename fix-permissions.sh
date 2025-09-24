#!/bin/bash

# Script para corrigir permissões do ChatVendas
# Este script deve ser executado como root

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções de log
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se está executando como root
if [ "$EUID" -ne 0 ]; then
    log_error "Este script deve ser executado como root (sudo)"
    exit 1
fi

log_info "Iniciando correção de permissões do ChatVendas..."

# Verificar se o usuário chatvendas existe
if ! id "chatvendas" &>/dev/null; then
    log_error "Usuário 'chatvendas' não encontrado. Execute o script de instalação primeiro."
    exit 1
fi

# Criar diretório principal se não existir
if [ ! -d "/opt/chatvendas" ]; then
    log_warning "Diretório /opt/chatvendas não encontrado, criando..."
    mkdir -p /opt/chatvendas
fi

# Corrigir propriedade do diretório principal
log_info "Corrigindo propriedade do diretório principal..."
chown -R chatvendas:chatvendas /opt/chatvendas

# Criar e corrigir pasta de logs
log_info "Criando e corrigindo pasta de logs..."
mkdir -p /opt/chatvendas/logs
chmod 755 /opt/chatvendas/logs
chown chatvendas:chatvendas /opt/chatvendas/logs

# Criar e corrigir pasta de uploads se existir
if [ -d "/opt/chatvendas/backend/public/uploads" ]; then
    log_info "Corrigindo permissões da pasta de uploads..."
    chmod 755 /opt/chatvendas/backend/public/uploads
    chown -R chatvendas:chatvendas /opt/chatvendas/backend/public/uploads
fi

# Corrigir permissões dos arquivos de configuração
if [ -f "/opt/chatvendas/.env" ]; then
    log_info "Corrigindo permissões do arquivo .env..."
    chmod 600 /opt/chatvendas/.env
    chown chatvendas:chatvendas /opt/chatvendas/.env
fi

if [ -f "/opt/chatvendas/ecosystem.config.cjs" ]; then
    log_info "Corrigindo permissões do ecosystem.config.cjs..."
    chmod 644 /opt/chatvendas/ecosystem.config.cjs
    chown chatvendas:chatvendas /opt/chatvendas/ecosystem.config.cjs
fi

# Corrigir permissões dos node_modules se existir
if [ -d "/opt/chatvendas/node_modules" ]; then
    log_info "Corrigindo permissões do node_modules..."
    chown -R chatvendas:chatvendas /opt/chatvendas/node_modules
fi

# Corrigir permissões dos arquivos executáveis
find /opt/chatvendas -name "*.sh" -exec chmod +x {} \; 2>/dev/null || true

# Verificar se o PM2 está instalado para o usuário chatvendas
log_info "Verificando instalação do PM2..."
if ! sudo -u chatvendas pm2 --version &>/dev/null; then
    log_warning "PM2 não encontrado para o usuário chatvendas"
    log_info "Instalando PM2 globalmente para o usuário chatvendas..."
    sudo -u chatvendas npm install -g pm2
fi

# Limpar processos PM2 órfãos se existirem
log_info "Limpando processos PM2 órfãos..."
sudo -u chatvendas pm2 kill 2>/dev/null || true

log_success "Correção de permissões concluída!"
log_info "Agora você pode executar o script de instalação novamente."