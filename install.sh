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

# Arquivo de checkpoint para controlar progresso
CHECKPOINT_FILE="/tmp/chatvendas_install_checkpoint"

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

success() {
    echo -e "${GREEN}[SUCESSO] $1${NC}"
}

# Função para marcar checkpoint
mark_checkpoint() {
    echo "$1" >> "$CHECKPOINT_FILE"
    success "Etapa '$1' concluída com sucesso"
}

# Função para verificar se etapa já foi executada
is_completed() {
    if [[ -f "$CHECKPOINT_FILE" ]] && grep -q "^$1$" "$CHECKPOINT_FILE"; then
        return 0
    else
        return 1
    fi
}

# Função para pular etapa se já executada
skip_if_completed() {
    if is_completed "$1"; then
        info "Etapa '$1' já foi executada, pulando..."
        return 0
    else
        return 1
    fi
}

# Verificar se está rodando como root
if [[ $EUID -eq 0 ]]; then
   error "Este script não deve ser executado como root. Execute como usuário normal."
fi

# Banner inicial com informações sobre checkpoint
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                 CHATVENDAS - INSTALADOR                     ║"
echo "║              Sistema de Atendimento WhatsApp                ║"
echo "║                    Ubuntu 22.04 LTS                         ║"
echo "║                                                              ║"
if [[ -f "$CHECKPOINT_FILE" ]]; then
    echo "║  🔄 CONTINUANDO INSTALAÇÃO - Etapas já executadas serão     ║"
    echo "║     puladas automaticamente                                  ║"
else
    echo "║  🚀 NOVA INSTALAÇÃO - Todas as etapas serão executadas      ║"
fi
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
if skip_if_completed "system_update"; then
    true # Etapa já executada
else
    log "Atualizando lista de pacotes..."
    sudo apt update

    if [[ "$SKIP_UPGRADE" =~ ^[Yy]$ ]]; then
        warning "Pulando atualização completa do sistema (modo rápido)"
    else
        log "Atualizando sistema completo..."
        sudo apt upgrade -y
    fi
    mark_checkpoint "system_update"
fi

# Instalar dependências básicas (otimizado)
if skip_if_completed "basic_dependencies"; then
    true # Etapa já executada
else
    log "Instalando dependências básicas..."
    sudo apt install -y --no-install-recommends curl wget git build-essential software-properties-common apt-transport-https ca-certificates gnupg lsb-release rsync
    mark_checkpoint "basic_dependencies"
fi

# Instalar Node.js 20.x LTS (atualizado para compatibilidade)
if skip_if_completed "nodejs_install"; then
    true # Etapa já executada
else
    log "Instalando Node.js 20.x LTS..."
    
    # Verificar se Node.js já está instalado e se é versão compatível
    if command -v node &> /dev/null; then
        CURRENT_NODE_VERSION=$(node --version | cut -d'v' -f2)
        MAJOR_VERSION=$(echo $CURRENT_NODE_VERSION | cut -d'.' -f1)
        
        if [[ $MAJOR_VERSION -ge 20 ]]; then
            info "Node.js já está instalado em versão compatível: v$CURRENT_NODE_VERSION"
        else
            warning "Node.js versão $CURRENT_NODE_VERSION é incompatível. Atualizando para v20 LTS..."
            # Remover versão antiga
            sudo apt remove -y nodejs npm
            # Instalar Node.js 20 LTS
            curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
            sudo apt install -y nodejs
        fi
    else
        # Instalar Node.js 20 LTS
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt install -y nodejs
    fi
    
    # Verificar instalação
    NEW_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    success "Node.js instalado: $NEW_VERSION"
    success "NPM instalado: $NPM_VERSION"
    
    mark_checkpoint "nodejs_install"
fi

# Verificar compatibilidade do sistema e dependências
if skip_if_completed "system_compatibility_check"; then
    true # Etapa já executada
else
    log "Verificando compatibilidade do sistema e dependências..."
    
    # Verificar versão do Ubuntu/Debian
    if [[ -f /etc/os-release ]]; then
        source /etc/os-release
        log "Sistema operacional detectado: $NAME $VERSION"
        
        # Verificar se é uma versão suportada
        case $ID in
            ubuntu)
                if [[ $(echo "$VERSION_ID >= 18.04" | bc -l) -eq 1 ]]; then
                    success "Ubuntu $VERSION_ID é suportado"
                else
                    warning "Ubuntu $VERSION_ID pode ter problemas de compatibilidade"
                fi
                ;;
            debian)
                if [[ $(echo "$VERSION_ID >= 10" | bc -l) -eq 1 ]]; then
                    success "Debian $VERSION_ID é suportado"
                else
                    warning "Debian $VERSION_ID pode ter problemas de compatibilidade"
                fi
                ;;
            *)
                warning "Sistema operacional $ID não foi testado, mas pode funcionar"
                ;;
        esac
    fi
    
    # Verificar recursos do sistema
    TOTAL_RAM=$(free -m | awk 'NR==2{printf "%.0f", $2}')
    AVAILABLE_DISK=$(df -BM / | awk 'NR==2{printf "%.0f", $4}' | sed 's/M//')
    
    log "Recursos do sistema:"
    log "  RAM Total: ${TOTAL_RAM}MB"
    log "  Espaço em disco disponível: ${AVAILABLE_DISK}MB"
    
    # Verificar requisitos mínimos
    if [[ $TOTAL_RAM -lt 1024 ]]; then
        warning "RAM insuficiente (${TOTAL_RAM}MB). Recomendado: 1GB ou mais"
    else
        success "RAM suficiente: ${TOTAL_RAM}MB"
    fi
    
    if [[ $AVAILABLE_DISK -lt 2048 ]]; then
        warning "Espaço em disco insuficiente (${AVAILABLE_DISK}MB). Recomendado: 2GB ou mais"
    else
        success "Espaço em disco suficiente: ${AVAILABLE_DISK}MB"
    fi
    
    # Verificar se o usuário tem privilégios sudo
    if sudo -n true 2>/dev/null; then
        success "Privilégios sudo verificados"
    else
        error "Este script requer privilégios sudo"
        exit 1
    fi
    
    mark_checkpoint "system_compatibility_check"
fi

# Verificar versões
log "Verificando versões instaladas..."
node_version=$(node --version)
npm_version=$(npm --version)
info "Node.js: $node_version"
info "NPM: $npm_version"

# Instalar PM2 globalmente (otimizado)
if skip_if_completed "pm2_install"; then
    true # Etapa já executada
else
    log "Instalando PM2..."
    if ! command -v pm2 &> /dev/null; then
        sudo npm install -g pm2
    else
        info "PM2 já está instalado"
    fi
    mark_checkpoint "pm2_install"
fi

# Instalar Nginx (otimizado)
if skip_if_completed "nginx_install"; then
    true # Etapa já executada
else
    log "Instalando Nginx..."
    if ! command -v nginx &> /dev/null; then
        sudo apt install -y nginx
    else
        info "Nginx já está instalado"
    fi
    mark_checkpoint "nginx_install"
fi

# Instalar Certbot (otimizado)
if skip_if_completed "certbot_install"; then
    true # Etapa já executada
else
    log "Instalando Certbot..."
    if ! command -v certbot &> /dev/null; then
        sudo apt install -y certbot python3-certbot-nginx
    else
        info "Certbot já está instalado"
    fi
    mark_checkpoint "certbot_install"
fi

# Criar usuário para a aplicação
if skip_if_completed "user_creation"; then
    true # Etapa já executada
else
    log "Criando usuário chatvendas..."
    if ! id "chatvendas" &>/dev/null; then
        sudo useradd -m -s /bin/bash chatvendas
        sudo usermod -aG sudo chatvendas
    else
        info "Usuário chatvendas já existe"
    fi
    mark_checkpoint "user_creation"
fi

# Criar diretórios com permissões corretas
if skip_if_completed "directory_structure"; then
    true # Etapa já executada
else
    log "Criando estrutura de diretórios com permissões corretas..."
    
    # Criar diretório principal
    sudo mkdir -p /opt/chatvendas
    
    # Configurar permissões corretas para evitar EACCES
    sudo chown -R chatvendas:chatvendas /opt/chatvendas
    sudo chmod -R 755 /opt/chatvendas
    
    # Criar subdiretórios necessários
    sudo -u chatvendas mkdir -p /opt/chatvendas/node_modules
    sudo -u chatvendas mkdir -p /opt/chatvendas/server/baileys-service/node_modules
    sudo -u chatvendas mkdir -p /opt/chatvendas/server/webjs-service/node_modules
    sudo -u chatvendas mkdir -p /opt/chatvendas/dist
    sudo -u chatvendas mkdir -p /opt/chatvendas/logs
    
    # Verificar se a pasta de logs foi criada com sucesso
    if [ -d "/opt/chatvendas/logs" ]; then
        success "Pasta de logs criada com sucesso"
        sudo chmod 755 /opt/chatvendas/logs
        sudo chown chatvendas:chatvendas /opt/chatvendas/logs
    else
        error "Falha ao criar pasta de logs"
        exit 1
    fi
    
    # Configurar npm para usar diretórios locais
    sudo -u chatvendas npm config set prefix /opt/chatvendas/.npm-global
    sudo -u chatvendas npm config set cache /opt/chatvendas/.npm-cache
    
    success "Estrutura de diretórios criada com permissões corretas"
    mark_checkpoint "directory_structure"
fi

# Copiar arquivos do projeto
if skip_if_completed "project_files"; then
    true # Etapa já executada
else
    log "Copiando arquivos do projeto..."
    # Verificar se não estamos tentando copiar para o mesmo diretório
    CURRENT_DIR=$(pwd)
    TARGET_DIR="/opt/chatvendas"

    if [[ "$CURRENT_DIR" != "$TARGET_DIR" ]]; then
        # Copiar apenas o conteúdo, excluindo diretórios desnecessários mas mantendo .env.example
        sudo rsync -av --exclude='.git' --exclude='node_modules' --exclude='.env' . "$TARGET_DIR/"
        sudo chown -R chatvendas:chatvendas "$TARGET_DIR"
    else
        warning "Já estamos no diretório de destino, pulando cópia..."
        # Garantir que o usuário chatvendas tenha permissões no diretório atual
        sudo chown -R chatvendas:chatvendas "$TARGET_DIR"
    fi
    mark_checkpoint "project_files"
fi

# Instalar dependências com correções de compatibilidade
if skip_if_completed "dependencies_install"; then
    true # Etapa já executada
else
    log "Instalando dependências dos serviços com correções de compatibilidade..."

    # Função para instalar dependências com flags de compatibilidade
    install_deps() {
        local service_path=$1
        local service_name=$2
        
        cd "$service_path"
        log "Instalando dependências do $service_name..."
        
        # Limpar cache e dependências antigas
        sudo -u chatvendas rm -rf node_modules package-lock.json
        
        # Instalar com flags de compatibilidade
        sudo -u chatvendas npm install --legacy-peer-deps --no-audit --no-fund --production
        
        if [ $? -eq 0 ]; then
            success "Dependências do $service_name instaladas com sucesso"
        else
            error "Falha ao instalar dependências do $service_name"
            exit 1
        fi
    }

    # Executar instalações em paralelo
    (
        cd /opt/chatvendas
        log "Instalando dependências do frontend..."
        
        # Limpar cache e dependências antigas
        sudo -u chatvendas rm -rf node_modules package-lock.json
        
        # Instalar com flags de compatibilidade
        sudo -u chatvendas npm install --legacy-peer-deps --no-audit --no-fund --production
        
        if [ $? -eq 0 ]; then
            success "Dependências do frontend instaladas com sucesso"
        else
            error "Falha ao instalar dependências do frontend"
            exit 1
        fi
    ) &

    (
        install_deps "/opt/chatvendas/server/baileys-service" "Baileys"
    ) &

    (
        install_deps "/opt/chatvendas/server/webjs-service" "Web.js"
    ) &

    # Aguardar todas as instalações terminarem
    wait
    success "Todas as dependências foram instaladas com sucesso!"
    mark_checkpoint "dependencies_install"
fi

# Configurar variáveis de ambiente
if skip_if_completed "env_configuration"; then
    true # Etapa já executada
else
    log "Configurando variáveis de ambiente..."
    
    # Garantir permissões corretas antes de criar arquivos .env
    sudo chown -R chatvendas:chatvendas /opt/chatvendas
    sudo chmod -R 755 /opt/chatvendas

    # Frontend .env
    cd /opt/chatvendas
    if [[ -f ".env.example" ]]; then
        sudo -u chatvendas cp .env.example .env
        sudo -u chatvendas sed -i "s|VITE_BAILEYS_URL=.*|VITE_BAILEYS_URL=https://$DOMAIN/api/baileys|g" .env
        sudo -u chatvendas sed -i "s|VITE_WEBJS_URL=.*|VITE_WEBJS_URL=https://$DOMAIN/api/webjs|g" .env
    else
        warning "Arquivo .env.example não encontrado no frontend, criando .env básico..."
        sudo -u chatvendas tee /opt/chatvendas/.env > /dev/null <<EOF
VITE_BAILEYS_URL=https://$DOMAIN/api/baileys
VITE_WEBJS_URL=https://$DOMAIN/api/webjs
EOF
    fi

    # Baileys .env
    cd /opt/chatvendas/server/baileys-service
    if [[ -f ".env.example" ]]; then
        sudo -u chatvendas cp .env.example .env
        sudo -u chatvendas sed -i "s|PORT=.*|PORT=$BAILEYS_PORT|g" .env
        sudo -u chatvendas sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=https://$DOMAIN|g" .env
    else
        warning "Arquivo .env.example não encontrado no Baileys, criando .env básico..."
        sudo -u chatvendas tee /opt/chatvendas/server/baileys-service/.env > /dev/null <<EOF
PORT=$BAILEYS_PORT
FRONTEND_URL=https://$DOMAIN
EOF
    fi

    # Web.js .env
    cd /opt/chatvendas/server/webjs-service
    if [[ -f ".env.example" ]]; then
        sudo -u chatvendas cp .env.example .env
        sudo -u chatvendas sed -i "s|PORT=.*|PORT=$WEBJS_PORT|g" .env
        sudo -u chatvendas sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=https://$DOMAIN|g" .env
    else
        warning "Arquivo .env.example não encontrado no Web.js, criando .env básico..."
        sudo -u chatvendas tee /opt/chatvendas/server/webjs-service/.env > /dev/null <<EOF
PORT=$WEBJS_PORT
FRONTEND_URL=https://$DOMAIN
EOF
    fi
    
    # Verificar se todos os arquivos .env foram criados com sucesso
    for env_file in "/opt/chatvendas/.env" "/opt/chatvendas/server/baileys-service/.env" "/opt/chatvendas/server/webjs-service/.env"; do
        if [ -f "$env_file" ]; then
            success "Arquivo $env_file criado com sucesso"
            sudo chown chatvendas:chatvendas "$env_file"
            sudo chmod 644 "$env_file"
        else
            error "Falha ao criar $env_file"
            exit 1
        fi
    done
    
    mark_checkpoint "env_configuration"
fi

# Build do frontend com verificações robustas
if skip_if_completed "frontend_build"; then
    true # Etapa já executada
else
    log "Fazendo build do frontend com verificações robustas..."
    cd /opt/chatvendas
    
    # Garantir permissões corretas antes do build
    sudo chown -R chatvendas:chatvendas /opt/chatvendas
    sudo chmod -R 755 /opt/chatvendas
    
    # Verificar se o Vite está disponível
    log "Verificando disponibilidade do Vite..."
    if ! sudo -u chatvendas npx vite --version >/dev/null 2>&1; then
        warning "Vite não encontrado, reinstalando dependências..."
        sudo -u chatvendas npm cache clean --force 2>/dev/null || true
        sudo -u chatvendas npm install --legacy-peer-deps --no-audit --no-fund
    fi
    
    # Verificar se ainda há problemas com o Vite
    if ! sudo -u chatvendas npx vite --version >/dev/null 2>&1; then
        warning "Instalando Vite globalmente como fallback..."
        sudo -u chatvendas npm install -g vite@latest
    fi
    
    # Limpeza robusta de cache e arquivos antigos
    log "Limpando cache e arquivos antigos..."
    sudo -u chatvendas rm -rf node_modules/.vite 2>/dev/null || true
    sudo -u chatvendas rm -rf dist 2>/dev/null || true
    sudo -u chatvendas find . -name "*.timestamp-*.mjs" -delete 2>/dev/null || true
    
    # Verificar variáveis de ambiente necessárias
    log "Verificando variáveis de ambiente..."
    if [[ ! -f ".env" ]]; then
        error "Arquivo .env não encontrado! Certifique-se de que a etapa de configuração foi executada."
        exit 1
    fi
    
    # Executar build com tratamento de erros
    log "Executando build do projeto..."
    if sudo -u chatvendas npm run build; then
        success "Build do frontend concluído com sucesso!"
        
        # Verificar se o diretório dist foi criado
        if [[ -d "dist" ]]; then
            success "Diretório dist criado com sucesso"
            log "Arquivos gerados: $(sudo -u chatvendas ls -la dist/ | wc -l) arquivos"
        else
            error "Diretório dist não foi criado após o build"
            exit 1
        fi
    else
        error "Falha no build do frontend"
        log "Tentando build com npx vite build diretamente..."
        
        if sudo -u chatvendas npx vite build; then
            success "Build alternativo concluído com sucesso!"
        else
            error "Falha no build alternativo. Verifique os logs acima."
            exit 1
        fi
    fi
    
    mark_checkpoint "frontend_build"
fi

# Configurar Nginx
if skip_if_completed "nginx_configuration"; then
    true # Etapa já executada
else
    log "Configurando Nginx..."
    sudo tee /etc/nginx/sites-available/chatvendas > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;
    
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
    if sudo nginx -t; then
        success "Configuração do Nginx válida"
        sudo systemctl reload nginx
    else
        error "Configuração do Nginx inválida"
        exit 1
    fi
    
    mark_checkpoint "nginx_configuration"
fi

# Configurar PM2
if skip_if_completed "pm2_configuration"; then
    true # Etapa já executada
else
    log "Configurando PM2..."
    
    # Garantir que estamos no diretório correto e com permissões adequadas
    cd /opt/chatvendas
    sudo chown -R chatvendas:chatvendas /opt/chatvendas
    sudo chmod -R 755 /opt/chatvendas

    # Criar arquivo ecosystem.config.cjs com permissões corretas
sudo -u chatvendas tee /opt/chatvendas/ecosystem.config.cjs > /dev/null <<EOF
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

    # Verificar se o arquivo foi criado com sucesso
    if [ -f "/opt/chatvendas/ecosystem.config.cjs" ]; then
    success "Arquivo ecosystem.config.cjs criado com sucesso"
    sudo chown chatvendas:chatvendas /opt/chatvendas/ecosystem.config.cjs
    sudo chmod 644 /opt/chatvendas/ecosystem.config.cjs
else
    error "Falha ao criar ecosystem.config.cjs"
        exit 1
    fi
    
    mark_checkpoint "pm2_configuration"
fi

# Iniciar serviços com PM2
if skip_if_completed "services_startup"; then
    true # Etapa já executada
else
    log "Iniciando serviços..."
    
    # Garantir que a pasta de logs existe antes de iniciar o PM2
    if [ ! -d "/opt/chatvendas/logs" ]; then
        warn "Pasta de logs não encontrada, criando..."
        sudo -u chatvendas mkdir -p /opt/chatvendas/logs
        sudo chmod 755 /opt/chatvendas/logs
        sudo chown chatvendas:chatvendas /opt/chatvendas/logs
    fi
    
    sudo -u chatvendas pm2 start ecosystem.config.cjs
    sudo -u chatvendas pm2 save
    sudo -u chatvendas pm2 startup

    # Configurar PM2 para iniciar com o sistema
    sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u chatvendas --hp /home/chatvendas

    # Reiniciar Nginx
    sudo systemctl restart nginx
    sudo systemctl enable nginx
    mark_checkpoint "services_startup"
fi

# Configurar SSL com Certbot (otimizado)
if skip_if_completed "ssl_configuration"; then
    true # Etapa já executada
else
    log "Configurando SSL com Certbot..."
    
    # Aguardar o Nginx estar funcionando
    sleep 5
    
    if [ "$SKIP_UPGRADE" = "true" ]; then
        info "Modo rápido: SSL será configurado em segundo plano"
        (sudo certbot --nginx -d $DOMAIN --email $EMAIL --agree-tos --non-interactive --redirect > /tmp/certbot.log 2>&1 &)
    else
        # Configurar SSL e automaticamente atualizar a configuração do Nginx
        if sudo certbot --nginx -d $DOMAIN --email $EMAIL --agree-tos --non-interactive --redirect; then
            success "SSL configurado com sucesso"
        else
            warning "Falha na configuração SSL automática. Tentando configuração manual..."
            
            # Fallback: configurar SSL manualmente
            sudo certbot certonly --nginx -d $DOMAIN --email $EMAIL --agree-tos --non-interactive
            
            # Atualizar configuração do Nginx manualmente para incluir SSL
            sudo tee /etc/nginx/sites-available/chatvendas > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;
    
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
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
            
            # Testar e recarregar configuração
            if sudo nginx -t; then
                sudo systemctl reload nginx
                success "Configuração SSL manual aplicada com sucesso"
            else
                error "Falha na configuração SSL manual"
            fi
        fi
    fi

    # Configurar renovação automática do SSL
    log "Configurando renovação automática do SSL..."
    sudo systemctl enable certbot.timer
    mark_checkpoint "ssl_configuration"
fi

# Configurar firewall (otimizado)
if skip_if_completed "firewall_configuration"; then
    true # Etapa já executada
else
    log "Configurando firewall..."
    sudo ufw --force enable
    sudo ufw allow OpenSSH
    sudo ufw allow 'Nginx Full'
    mark_checkpoint "firewall_configuration"
fi

# Criar script de backup
if skip_if_completed "backup_configuration"; then
    true # Etapa já executada
else
    log "Criando script de backup..."
    
    # Garantir que o diretório existe e tem permissões corretas
    sudo mkdir -p /opt/chatvendas
    sudo chown -R chatvendas:chatvendas /opt/chatvendas
    
    # Criar script de backup com caminho absoluto
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

    # Verificar se o script foi criado com sucesso
    if [ -f "/opt/chatvendas/backup.sh" ]; then
        success "Script de backup criado com sucesso"
        sudo chmod +x /opt/chatvendas/backup.sh
        sudo chown chatvendas:chatvendas /opt/chatvendas/backup.sh
    else
        error "Falha ao criar script de backup"
        exit 1
    fi

    # Configurar cron para backup diário
    log "Configurando backup automático..."
    (sudo -u chatvendas crontab -l 2>/dev/null; echo "0 2 * * * /opt/chatvendas/backup.sh") | sudo -u chatvendas crontab -
    mark_checkpoint "backup_configuration"
fi

# Verificações finais de saúde do sistema
log "Executando verificações finais de saúde do sistema..."

# Verificar se todos os serviços estão rodando
log "Verificando status dos serviços..."
if sudo systemctl is-active --quiet nginx; then
    success "Nginx está rodando"
else
    warning "Nginx não está rodando"
fi

# Verificar PM2
if sudo -u chatvendas pm2 list | grep -q "online"; then
    success "Serviços PM2 estão rodando"
else
    warning "Alguns serviços PM2 podem não estar rodando"
fi

# Verificar se o build foi criado corretamente
if [[ -d "/opt/chatvendas/dist" ]] && [[ -f "/opt/chatvendas/dist/index.html" ]]; then
    success "Build do frontend está presente"
else
    warning "Build do frontend pode estar incompleto"
fi

# Verificar conectividade das portas
log "Verificando conectividade das portas..."
if netstat -tuln | grep -q ":80 "; then
    success "Porta 80 (HTTP) está aberta"
else
    warning "Porta 80 (HTTP) não está disponível"
fi

if netstat -tuln | grep -q ":443 "; then
    success "Porta 443 (HTTPS) está aberta"
else
    info "Porta 443 (HTTPS) será configurada após o SSL"
fi

# Verificar espaço em disco após instalação
AVAILABLE_DISK_AFTER=$(df -BM / | awk 'NR==2{printf "%.0f", $4}' | sed 's/M//')
log "Espaço em disco restante: ${AVAILABLE_DISK_AFTER}MB"

# Verificar status dos serviços
log "Status detalhado dos serviços:"
sudo systemctl status nginx --no-pager --lines=3
sudo -u chatvendas pm2 status

# Limpar arquivo de checkpoint após instalação completa
log "Limpando arquivos temporários..."
rm -f "$CHECKPOINT_FILE"

# Informações finais
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    INSTALAÇÃO CONCLUÍDA!                    ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
log "Sistema instalado com sucesso!"
echo ""
info "Acesse o sistema em: https://$DOMAIN"
info "Para reiniciar a instalação do zero, execute: rm -f /tmp/chatvendas_install_checkpoint"
echo ""
success "Todas as etapas foram concluídas com sucesso!"
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