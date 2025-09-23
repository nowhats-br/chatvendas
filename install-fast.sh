#!/bin/bash

# ChatVendas - Instalador Ultra-Rápido (Desenvolvimento)
# Este script pula várias verificações e otimizações para instalação mais rápida

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções de log
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Banner
clear
echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    CHATVENDAS - MODO ULTRA-RÁPIDO           ║"
echo "║                     Instalador Otimizado                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Verificar se é root
if [ "$EUID" -ne 0 ]; then
    error "Este script deve ser executado como root (sudo)"
    exit 1
fi

# Configurações padrão para desenvolvimento
DOMAIN="localhost"
EMAIL="dev@localhost.com"
FRONTEND_PORT=3000
BAILEYS_PORT=3001
WEBJS_PORT=3002

log "Configurações padrão para desenvolvimento:"
info "Domínio: $DOMAIN"
info "Email: $EMAIL"
info "Frontend: $FRONTEND_PORT"
info "Baileys: $BAILEYS_PORT"
info "Web.js: $WEBJS_PORT"

read -p "Pressione Enter para continuar ou Ctrl+C para cancelar..."

# Atualizar apenas lista de pacotes (sem upgrade)
log "Atualizando lista de pacotes..."
apt update -qq

# Instalar dependências básicas (mínimas)
log "Instalando dependências mínimas..."
apt install -y --no-install-recommends curl wget git nodejs npm nginx

# Verificar Node.js
if ! command -v node &> /dev/null; then
    error "Node.js não foi instalado corretamente"
    exit 1
fi

# Instalar PM2
log "Instalando PM2..."
npm install -g pm2 --silent

# Criar usuário
log "Criando usuário chatvendas..."
if ! id "chatvendas" &>/dev/null; then
    useradd -m -s /bin/bash chatvendas
    usermod -aG sudo chatvendas
fi

# Criar diretórios
log "Criando estrutura de diretórios..."
mkdir -p /opt/chatvendas
chown chatvendas:chatvendas /opt/chatvendas

# Copiar arquivos
log "Copiando arquivos do projeto..."
cp -r . /opt/chatvendas/
chown -R chatvendas:chatvendas /opt/chatvendas

# Instalar dependências em paralelo (ultra-rápido)
log "Instalando dependências (paralelo + cache)..."

# Frontend
(cd /opt/chatvendas && sudo -u chatvendas npm install --silent --prefer-offline --no-audit --no-fund) &

# Baileys
(cd /opt/chatvendas/server/baileys-service && sudo -u chatvendas npm install --silent --prefer-offline --no-audit --no-fund) &

# Web.js
(cd /opt/chatvendas/server/webjs-service && sudo -u chatvendas npm install --silent --prefer-offline --no-audit --no-fund) &

# Aguardar instalações
wait
log "Dependências instaladas!"

# Build do frontend
log "Fazendo build do frontend..."
cd /opt/chatvendas
sudo -u chatvendas npm run build

# Configurar .env files rapidamente
log "Configurando variáveis de ambiente..."

# Frontend
cd /opt/chatvendas
sudo -u chatvendas cp .env.example .env 2>/dev/null || true
sudo -u chatvendas sed -i "s|VITE_BAILEYS_URL=.*|VITE_BAILEYS_URL=http://localhost:$BAILEYS_PORT|g" .env
sudo -u chatvendas sed -i "s|VITE_WEBJS_URL=.*|VITE_WEBJS_URL=http://localhost:$WEBJS_PORT|g" .env

# Baileys
cd /opt/chatvendas/server/baileys-service
sudo -u chatvendas cp .env.example .env 2>/dev/null || true
sudo -u chatvendas sed -i "s|PORT=.*|PORT=$BAILEYS_PORT|g" .env

# Web.js
cd /opt/chatvendas/server/webjs-service
sudo -u chatvendas cp .env.example .env 2>/dev/null || true
sudo -u chatvendas sed -i "s|PORT=.*|PORT=$WEBJS_PORT|g" .env

# Configurar Nginx básico
log "Configurando Nginx..."
cat > /etc/nginx/sites-available/chatvendas << EOF
server {
    listen 80;
    server_name localhost;
    
    location / {
        proxy_pass http://localhost:$FRONTEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
    
    location /api/baileys {
        proxy_pass http://localhost:$BAILEYS_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
    
    location /api/webjs {
        proxy_pass http://localhost:$WEBJS_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/chatvendas /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
systemctl restart nginx
systemctl enable nginx

# Configurar PM2
log "Configurando PM2..."
cd /opt/chatvendas
sudo -u chatvendas pm2 start ecosystem.config.js
sudo -u chatvendas pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u chatvendas --hp /home/chatvendas

# Finalizar
log "Instalação ultra-rápida concluída!"
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    INSTALAÇÃO CONCLUÍDA!                    ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}🌐 Frontend:${NC} http://localhost"
echo -e "${BLUE}🤖 Baileys API:${NC} http://localhost/api/baileys"
echo -e "${BLUE}📱 Web.js API:${NC} http://localhost/api/webjs"
echo ""
echo -e "${YELLOW}Comandos úteis:${NC}"
echo "• Ver logs: sudo -u chatvendas pm2 logs"
echo "• Status: sudo -u chatvendas pm2 status"
echo "• Reiniciar: sudo -u chatvendas pm2 restart all"
echo ""
echo -e "${GREEN}Sistema pronto para desenvolvimento!${NC}"