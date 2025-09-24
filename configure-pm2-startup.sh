#!/bin/bash

# Script para configurar o startup automático do PM2
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

log_info "Configurando startup automático do PM2..."

# Verificar se o usuário chatvendas existe
if ! id "chatvendas" &>/dev/null; then
    log_error "Usuário 'chatvendas' não encontrado."
    exit 1
fi

# Verificar se o PM2 está instalado
if ! sudo -u chatvendas pm2 --version &>/dev/null; then
    log_error "PM2 não está instalado para o usuário chatvendas"
    exit 1
fi

# Parar todos os processos PM2 existentes
log_info "Parando processos PM2 existentes..."
sudo -u chatvendas pm2 kill 2>/dev/null || true

# Verificar se existe o arquivo ecosystem.config.cjs
if [ ! -f "/opt/chatvendas/ecosystem.config.cjs" ]; then
    log_error "Arquivo ecosystem.config.cjs não encontrado em /opt/chatvendas/"
    exit 1
fi

# Ir para o diretório do projeto
cd /opt/chatvendas

# Iniciar os serviços
log_info "Iniciando serviços com PM2..."
sudo -u chatvendas pm2 start ecosystem.config.cjs

# Salvar configuração atual
log_info "Salvando configuração do PM2..."
sudo -u chatvendas pm2 save

# Configurar startup automático
log_info "Configurando startup automático do PM2..."
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u chatvendas --hp /home/chatvendas

# Verificar status dos serviços
log_info "Verificando status dos serviços..."
sudo -u chatvendas pm2 status

log_success "Configuração do startup automático do PM2 concluída!"
log_info "Os serviços agora iniciarão automaticamente quando o sistema for reiniciado."

# Instruções finais
echo ""
log_info "📋 Comandos úteis:"
echo "  - Ver status: sudo -u chatvendas pm2 status"
echo "  - Ver logs: sudo -u chatvendas pm2 logs"
echo "  - Reiniciar: sudo -u chatvendas pm2 restart all"
echo "  - Parar: sudo -u chatvendas pm2 stop all"