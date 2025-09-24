#!/bin/bash

# Script para atualizar Node.js para versão compatível
# Resolve o problema: node v18.20.8 -> node >=20.0.0

set -e

echo "🔧 Atualizando Node.js para versão compatível..."

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Verificar versão atual
CURRENT_VERSION=$(node --version)
log_info "Versão atual do Node.js: $CURRENT_VERSION"

# Verificar se já está na versão correta
if [[ "$CURRENT_VERSION" =~ ^v2[0-9]\. ]] || [[ "$CURRENT_VERSION" =~ ^v[3-9][0-9]\. ]]; then
    log_success "Node.js já está em uma versão compatível!"
    exit 0
fi

log_warning "Node.js precisa ser atualizado para versão >=20.0.0"

# Detectar sistema operacional
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    log_info "Sistema Linux detectado"
    
    # Verificar se é Ubuntu/Debian
    if command -v apt-get &> /dev/null; then
        log_info "Instalando Node.js 20 LTS via NodeSource..."
        
        # Remover versões antigas do Node.js
        sudo apt-get remove -y nodejs npm
        
        # Instalar Node.js 20 LTS
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
        
    # Verificar se é CentOS/RHEL/Fedora
    elif command -v yum &> /dev/null || command -v dnf &> /dev/null; then
        log_info "Instalando Node.js 20 LTS via NodeSource (RPM)..."
        
        # Usar dnf se disponível, senão yum
        if command -v dnf &> /dev/null; then
            PKG_MANAGER="dnf"
        else
            PKG_MANAGER="yum"
        fi
        
        # Remover versões antigas
        sudo $PKG_MANAGER remove -y nodejs npm
        
        # Instalar Node.js 20 LTS
        curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
        sudo $PKG_MANAGER install -y nodejs
        
    else
        log_error "Distribuição Linux não suportada automaticamente"
        log_info "Por favor, instale Node.js 20 LTS manualmente:"
        log_info "1. Visite: https://nodejs.org/en/download/"
        log_info "2. Ou use o gerenciador de versões nvm:"
        log_info "   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
        log_info "   source ~/.bashrc"
        log_info "   nvm install 20"
        log_info "   nvm use 20"
        exit 1
    fi
    
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    log_info "Sistema macOS detectado"
    
    if command -v brew &> /dev/null; then
        log_info "Instalando Node.js 20 via Homebrew..."
        brew uninstall --ignore-dependencies node
        brew install node@20
        brew link --force node@20
    else
        log_error "Homebrew não encontrado"
        log_info "Instale o Homebrew primeiro: /bin/bash -c \"$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        exit 1
    fi
    
else
    log_error "Sistema operacional não suportado: $OSTYPE"
    exit 1
fi

# Verificar nova versão
sleep 2
NEW_VERSION=$(node --version)
log_success "Node.js atualizado para: $NEW_VERSION"

# Verificar npm
NPM_VERSION=$(npm --version)
log_info "Versão do NPM: $NPM_VERSION"

# Atualizar npm se necessário
if [[ "$NPM_VERSION" < "10" ]]; then
    log_info "Atualizando NPM..."
    npm install -g npm@latest
    log_success "NPM atualizado para: $(npm --version)"
fi

log_success "✅ Node.js e NPM atualizados com sucesso!"
log_info "Agora você pode executar o deploy normalmente."