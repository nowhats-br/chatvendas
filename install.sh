#!/bin/bash

# Instalador Automático - Sistema de Atendimento WhatsApp
# Ubuntu 22.04 LTS
# Autor: Sistema ChatVendas

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERRO] $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[AVISO] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Verificar se está rodando como root
if [[ $EUID -eq 0 ]]; then
   error "Este script não deve ser executado como root. Execute como usuário normal."
fi

# Banner
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                 CHATVENDAS - INSTALADOR                     ║"
echo "║              Sistema de Atendimento WhatsApp                ║"
echo "║                    Ubuntu 22.04 LTS                         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Solicitar informações do usuário
echo ""
log "Configuração inicial do sistema"
echo ""

read -p "Digite o domínio para o sistema (ex: chatvendas.exemplo.com): " DOMAIN
if [[ -z "$DOMAIN" ]]; then
    error "Domínio é obrigatório!"
fi

read -p "Digite o email para o certificado SSL (ex: admin@exemplo.com): " EMAIL
if [[ -z "$EMAIL" ]]; then
    error "Email é obrigatório!"
fi

read -p "Digite a porta para o frontend (padrão: 3000): " FRONTEND_PORT
FRONTEND_PORT=${FRONTEND_PORT:-3000}

read -p "Digite a porta para o serviço Baileys (padrão: 3001): " BAILEYS_PORT
BAILEYS_PORT=${BAILEYS_PORT:-3001}

read -p "Digite a porta para o serviço Web.js (padrão: 3002): " WEBJS_PORT
WEBJS_PORT=${WEBJS_PORT:-3002}

# Opção para instalação rápida
echo ""
warning "MODO RÁPIDO: Pular atualização completa do sistema? (recomendado para testes)"
read -p "Pular apt upgrade? (y/N): " SKIP_UPGRADE
SKIP_UPGRADE=${SKIP_UPGRADE:-N}

echo ""
info "Configurações:"
info "Domínio: $DOMAIN"
info "Email: $EMAIL"
info "Frontend: $FRONTEND_PORT"
info "Baileys: $BAILEYS_PORT"
info "Web.js: $WEBJS_PORT"
info "Modo rápido: $([ "$SKIP_UPGRADE" = "y" ] || [ "$SKIP_UPGRADE" = "Y" ] && echo "SIM" || echo "NÃO")"
echo ""

read -p "Confirma as configurações? (y/N): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    error "Instalação cancelada pelo usuário."
fi

# Atualizar sistema (otimizado)
log "Atualizando lista de pacotes..."
sudo apt update

if [[ "$SKIP_UPGRADE" =~ ^[Yy]$ ]]; then
    warning "Pulando atualização completa do sistema (modo rápido)"
else
    log "Atualizando sistema completo..."
    sudo apt upgrade -y
fi

# Instalar dependências básicas (otimizado)
log "Instalando dependências básicas..."
sudo apt install -y --no-install-recommends curl wget git build-essential software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Instalar Node.js 18.x (otimizado)
log "Instalando Node.js 18.x..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
else
    info "Node.js já está instalado: $(node --version)"
fi

# Verificar versões
log "Verificando versões instaladas..."
node_version=$(node --version)
npm_version=$(npm --version)
info "Node.js: $node_version"
info "NPM: $npm_version"

# Instalar PM2 globalmente (otimizado)
log "Instalando PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
else
    info "PM2 já está instalado"
fi

# Instalar Nginx (otimizado)
log "Instalando Nginx..."
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
else
    info "Nginx já está instalado"
fi

# Instalar Certbot (otimizado)
log "Instalando Certbot..."
if ! command -v certbot &> /dev/null; then
    sudo apt install -y certbot python3-certbot-nginx
else
    info "Certbot já está instalado"
fi

# Criar usuário para a aplicação
log "Criando usuário chatvendas..."
if ! id "chatvendas" &>/dev/null; then
    sudo useradd -m -s /bin/bash chatvendas
    sudo usermod -aG sudo chatvendas
fi

# Criar diretórios
log "Criando estrutura de diretórios..."
sudo mkdir -p /opt/chatvendas
sudo chown chatvendas:chatvendas /opt/chatvendas

# Copiar arquivos do projeto
log "Copiando arquivos do projeto..."
sudo cp -r . /opt/chatvendas/
sudo chown -R chatvendas:chatvendas /opt/chatvendas

# Instalar dependências em paralelo (otimizado)
log "Instalando dependências dos serviços (em paralelo)..."

# Função para instalar dependências
install_deps() {
    local service_path=$1
    local service_name=$2
    
    cd "$service_path"
    log "Instalando dependências do $service_name..."
    sudo -u chatvendas npm install --production --silent
}

# Executar instalações em paralelo
(
    cd /opt/chatvendas
    log "Instalando dependências do frontend..."
    sudo -u chatvendas npm install --production --silent
) &

(
    install_deps "/opt/chatvendas/server/baileys-service" "Baileys"
) &

(
    install_deps "/opt/chatvendas/server/webjs-service" "Web.js"
) &

# Aguardar todas as instalações terminarem
wait
log "Todas as dependências foram instaladas!"

# Configurar variáveis de ambiente
log "Configurando variáveis de ambiente..."

# Frontend .env
cd /opt/chatvendas
sudo -u chatvendas cp .env.example .env
sudo -u chatvendas sed -i "s|VITE_BAILEYS_URL=.*|VITE_BAILEYS_URL=https://$DOMAIN/api/baileys|g" .env
sudo -u chatvendas sed -i "s|VITE_WEBJS_URL=.*|VITE_WEBJS_URL=https://$DOMAIN/api/webjs|g" .env

# Baileys .env
cd /opt/chatvendas/server/baileys-service
sudo -u chatvendas cp .env.example .env
sudo -u chatvendas sed -i "s|PORT=.*|PORT=$BAILEYS_PORT|g" .env
sudo -u chatvendas sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=https://$DOMAIN|g" .env

# Web.js .env
cd /opt/chatvendas/server/webjs-service
sudo -u chatvendas cp .env.example .env
sudo -u chatvendas sed -i "s|PORT=.*|PORT=$WEBJS_PORT|g" .env
sudo -u chatvendas sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=https://$DOMAIN|g" .env

# Build do frontend
log "Fazendo build do frontend..."
cd /opt/chatvendas
sudo -u chatvendas npm run build

# Configurar Nginx
log "Configurando Nginx..."
sudo tee /etc/nginx/sites-available/chatvendas > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;
    
    # SSL Configuration (will be configured by Certbot)
    
    # Frontend
    location / {
        root /opt/chatvendas/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    }
    
    # Baileys API
    location /api/baileys/ {
        proxy_pass http://localhost:$BAILEYS_PORT/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Web.js API
    location /api/webjs/ {
        proxy_pass http://localhost:$WEBJS_PORT/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:$BAILEYS_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Ativar site
sudo ln -sf /etc/nginx/sites-available/chatvendas /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Testar configuração do Nginx
sudo nginx -t

# Configurar PM2
log "Configurando PM2..."
cd /opt/chatvendas

# Criar arquivo ecosystem.config.js
sudo -u chatvendas tee ecosystem.config.js > /dev/null <<EOF
module.exports = {
  apps: [
    {
      name: 'baileys-service',
      cwd: './server/baileys-service',
      script: 'index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: $BAILEYS_PORT
      }
    },
    {
      name: 'webjs-service',
      cwd: './server/webjs-service',
      script: 'index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: $WEBJS_PORT
      }
    }
  ]
};
EOF

# Iniciar serviços com PM2
log "Iniciando serviços..."
sudo -u chatvendas pm2 start ecosystem.config.js
sudo -u chatvendas pm2 save
sudo -u chatvendas pm2 startup

# Configurar PM2 para iniciar com o sistema
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u chatvendas --hp /home/chatvendas

# Reiniciar Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

# Configurar SSL com Certbot (otimizado)
log "Configurando SSL com Certbot..."
if [ "$SKIP_UPGRADE" = "true" ]; then
    info "Modo rápido: SSL será configurado em segundo plano"
    (sudo certbot --nginx -d $DOMAIN --email $EMAIL --agree-tos --non-interactive --redirect > /tmp/certbot.log 2>&1 &)
else
    sudo certbot --nginx -d $DOMAIN --email $EMAIL --agree-tos --non-interactive --redirect
fi

# Configurar renovação automática do SSL
log "Configurando renovação automática do SSL..."
sudo systemctl enable certbot.timer

# Configurar firewall (otimizado)
log "Configurando firewall..."
sudo ufw --force enable
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'

# Criar script de backup
log "Criando script de backup..."
sudo tee /opt/chatvendas/backup.sh > /dev/null <<'EOF'
#!/bin/bash
BACKUP_DIR="/opt/chatvendas/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup das sessões WhatsApp
tar -czf $BACKUP_DIR/sessions_$DATE.tar.gz \
    /opt/chatvendas/server/baileys-service/sessions \
    /opt/chatvendas/server/webjs-service/.wwebjs_auth 2>/dev/null || true

# Manter apenas os últimos 7 backups
find $BACKUP_DIR -name "sessions_*.tar.gz" -mtime +7 -delete

echo "Backup concluído: $BACKUP_DIR/sessions_$DATE.tar.gz"
EOF

sudo chmod +x /opt/chatvendas/backup.sh
sudo chown chatvendas:chatvendas /opt/chatvendas/backup.sh

# Configurar cron para backup diário
log "Configurando backup automático..."
(sudo -u chatvendas crontab -l 2>/dev/null; echo "0 2 * * * /opt/chatvendas/backup.sh") | sudo -u chatvendas crontab -

# Verificar status dos serviços
log "Verificando status dos serviços..."
sudo systemctl status nginx --no-pager
sudo -u chatvendas pm2 status

# Informações finais
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    INSTALAÇÃO CONCLUÍDA!                    ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
log "Sistema instalado com sucesso!"
echo ""
info "Acesse o sistema em: https://$DOMAIN"
info "Logs dos serviços: sudo -u chatvendas pm2 logs"
info "Reiniciar serviços: sudo -u chatvendas pm2 restart all"
info "Status dos serviços: sudo -u chatvendas pm2 status"
echo ""
warning "IMPORTANTE:"
warning "1. Configure suas variáveis do Supabase no arquivo /opt/chatvendas/.env"
warning "2. Reinicie os serviços após configurar: sudo -u chatvendas pm2 restart all"
warning "3. Os backups são feitos diariamente às 02:00 em /opt/chatvendas/backups"
echo ""
log "Instalação finalizada!"