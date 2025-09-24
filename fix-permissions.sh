#!/bin/bash

# Script para corrigir problemas de permissões no deploy
# Resolve: EACCES: permission denied, mkdir '/opt/chatvendas/node_modules'

set -e

echo "🔐 Corrigindo problemas de permissões..."

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

# Definir diretório do projeto
PROJECT_DIR="/opt/chatvendas"

# Verificar se o diretório existe
if [ ! -d "$PROJECT_DIR" ]; then
    log_error "Diretório $PROJECT_DIR não existe!"
    log_info "Criando diretório..."
    sudo mkdir -p $PROJECT_DIR
fi

# Obter usuário atual
CURRENT_USER=$(whoami)
log_info "Usuário atual: $CURRENT_USER"

# Verificar se está rodando como root
if [[ $EUID -eq 0 ]]; then
    log_warning "Rodando como root. Recomendamos usar um usuário não-root."
    
    # Se for root, criar um usuário deploy se não existir
    if ! id "deploy" &>/dev/null; then
        log_info "Criando usuário 'deploy'..."
        useradd -m -s /bin/bash deploy
        usermod -aG sudo deploy
        CURRENT_USER="deploy"
    else
        CURRENT_USER="deploy"
    fi
fi

log_info "Configurando permissões para usuário: $CURRENT_USER"

# 1. Corrigir propriedade do diretório
log_info "Ajustando propriedade do diretório..."
sudo chown -R $CURRENT_USER:$CURRENT_USER $PROJECT_DIR

# 2. Definir permissões corretas
log_info "Definindo permissões corretas..."
sudo chmod -R 755 $PROJECT_DIR

# 3. Criar diretórios necessários com permissões corretas
log_info "Criando diretórios necessários..."
mkdir -p $PROJECT_DIR/node_modules
mkdir -p $PROJECT_DIR/dist
mkdir -p $PROJECT_DIR/.npm
mkdir -p $PROJECT_DIR/logs

# 4. Configurar npm para usar diretórios locais
log_info "Configurando NPM..."
cd $PROJECT_DIR

# Configurar cache local do npm
npm config set cache $PROJECT_DIR/.npm
npm config set prefix $PROJECT_DIR/.npm-global

# Adicionar ao PATH se necessário
if ! echo $PATH | grep -q "$PROJECT_DIR/.npm-global/bin"; then
    echo "export PATH=$PROJECT_DIR/.npm-global/bin:\$PATH" >> ~/.bashrc
    export PATH=$PROJECT_DIR/.npm-global/bin:$PATH
fi

# 5. Limpar cache e dependências antigas
log_info "Limpando cache e dependências antigas..."
rm -rf node_modules
rm -rf package-lock.json
rm -rf .npm
npm cache clean --force

# 6. Configurar npm para evitar problemas de permissão
log_info "Configurando NPM para evitar problemas de permissão..."
npm config set fund false
npm config set audit false
npm config set update-notifier false

# 7. Verificar permissões finais
log_info "Verificando permissões finais..."
ls -la $PROJECT_DIR

# 8. Testar criação de arquivo
log_info "Testando permissões de escrita..."
TEST_FILE="$PROJECT_DIR/test-permissions.txt"
echo "Teste de permissões" > $TEST_FILE
if [ -f "$TEST_FILE" ]; then
    log_success "✅ Permissões de escrita OK"
    rm $TEST_FILE
else
    log_error "❌ Ainda há problemas de permissão"
    exit 1
fi

# 9. Configurar logrotate para logs (opcional)
if command -v logrotate &> /dev/null; then
    log_info "Configurando rotação de logs..."
    sudo tee /etc/logrotate.d/chatvendas > /dev/null <<EOF
$PROJECT_DIR/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    copytruncate
    su $CURRENT_USER $CURRENT_USER
}
EOF
fi

log_success "🎉 Permissões corrigidas com sucesso!"
log_info "Diretório: $PROJECT_DIR"
log_info "Proprietário: $CURRENT_USER"
log_info "Permissões: $(ls -ld $PROJECT_DIR | awk '{print $1}')"

# Instruções finais
echo ""
log_info "📋 Próximos passos:"
echo "1. Execute: cd $PROJECT_DIR"
echo "2. Execute: npm install --legacy-peer-deps"
echo "3. Execute: npm run build"