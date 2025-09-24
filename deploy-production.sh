#!/bin/bash

# Script de Deploy para Produção - ChatVendas
# Resolve problemas de Node.js, permissões e build

set -e  # Para na primeira falha

echo "🚀 Iniciando deploy do ChatVendas..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
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

# Verificar se está rodando como root ou com sudo
if [[ $EUID -eq 0 ]]; then
    log_warning "Rodando como root. Isso pode causar problemas de permissão."
fi

# 1. RESOLVER PROBLEMA DE VERSÃO DO NODE.JS
log_info "Verificando versão do Node.js..."
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_VERSION="20.0.0"

# Função para comparar versões
version_compare() {
    if [[ $1 == $2 ]]; then
        return 0
    fi
    local IFS=.
    local i ver1=($1) ver2=($2)
    for ((i=${#ver1[@]}; i<${#ver2[@]}; i++)); do
        ver1[i]=0
    done
    for ((i=0; i<${#ver1[@]}; i++)); do
        if [[ -z ${ver2[i]} ]]; then
            ver2[i]=0
        fi
        if ((10#${ver1[i]} > 10#${ver2[i]})); then
            return 1
        fi
        if ((10#${ver1[i]} < 10#${ver2[i]})); then
            return 2
        fi
    done
    return 0
}

version_compare $NODE_VERSION $REQUIRED_VERSION
case $? in
    0) log_success "Node.js versão $NODE_VERSION é igual à requerida" ;;
    1) log_success "Node.js versão $NODE_VERSION é maior que a requerida" ;;
    2) 
        log_error "Node.js versão $NODE_VERSION é menor que a requerida ($REQUIRED_VERSION)"
        log_info "Instalando Node.js 20 LTS..."
        
        # Instalar Node.js 20 usando NodeSource
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
        
        # Verificar nova versão
        NEW_VERSION=$(node --version)
        log_success "Node.js atualizado para $NEW_VERSION"
        ;;
esac

# 2. RESOLVER PROBLEMAS DE PERMISSÕES
log_info "Corrigindo permissões do diretório..."

# Definir diretório do projeto
PROJECT_DIR="/opt/chatvendas"

# Verificar se o diretório existe
if [ ! -d "$PROJECT_DIR" ]; then
    log_error "Diretório $PROJECT_DIR não existe!"
    exit 1
fi

# Corrigir permissões
log_info "Ajustando permissões para o usuário atual..."
sudo chown -R $USER:$USER $PROJECT_DIR
sudo chmod -R 755 $PROJECT_DIR

# Limpar cache npm e node_modules
log_info "Limpando cache e dependências antigas..."
cd $PROJECT_DIR
rm -rf node_modules
rm -rf package-lock.json
npm cache clean --force

# 3. INSTALAR DEPENDÊNCIAS COM CONFIGURAÇÕES CORRETAS
log_info "Instalando dependências..."

# Configurar npm para evitar problemas de permissão
npm config set fund false
npm config set audit false

# Instalar dependências com flags apropriadas
npm install --legacy-peer-deps --no-optional --production=false

# 4. INSTALAR VITE GLOBALMENTE SE NECESSÁRIO
log_info "Verificando instalação do Vite..."
if ! command -v vite &> /dev/null; then
    log_warning "Vite não encontrado globalmente. Instalando..."
    npm install -g vite
fi

# 5. BUILD DO PROJETO
log_info "Executando build do projeto..."

# Usar npx para garantir que usa a versão local do vite
npx vite build

# Verificar se o build foi bem-sucedido
if [ -d "dist" ] && [ "$(ls -A dist)" ]; then
    log_success "Build concluído com sucesso!"
    log_info "Arquivos gerados em: $PROJECT_DIR/dist"
    ls -la dist/
else
    log_error "Build falhou ou diretório dist está vazio!"
    exit 1
fi

# 6. CONFIGURAR NGINX (se necessário)
if command -v nginx &> /dev/null; then
    log_info "Nginx detectado. Verificando configuração..."
    
    # Criar configuração básica se não existir
    NGINX_CONFIG="/etc/nginx/sites-available/chatvendas"
    if [ ! -f "$NGINX_CONFIG" ]; then
        log_info "Criando configuração do Nginx..."
        sudo tee $NGINX_CONFIG > /dev/null <<EOF
server {
    listen 80;
    server_name _;
    
    root $PROJECT_DIR/dist;
    index index.html;
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
        
        # Ativar site
        sudo ln -sf $NGINX_CONFIG /etc/nginx/sites-enabled/
        sudo nginx -t && sudo systemctl reload nginx
        log_success "Nginx configurado!"
    fi
fi

# 7. VERIFICAÇÕES FINAIS
log_info "Executando verificações finais..."

# Verificar se todos os arquivos essenciais existem
ESSENTIAL_FILES=("dist/index.html" "dist/assets")
for file in "${ESSENTIAL_FILES[@]}"; do
    if [ -e "$PROJECT_DIR/$file" ]; then
        log_success "✓ $file existe"
    else
        log_error "✗ $file não encontrado!"
    fi
done

# Mostrar informações do sistema
log_info "Informações do sistema:"
echo "Node.js: $(node --version)"
echo "NPM: $(npm --version)"
echo "Usuário atual: $(whoami)"
echo "Diretório: $(pwd)"
echo "Espaço em disco:"
df -h $PROJECT_DIR

log_success "🎉 Deploy concluído com sucesso!"
log_info "Aplicação disponível em: http://$(hostname -I | awk '{print $1}')"