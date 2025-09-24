#!/bin/bash

# Script de Configuração Automatizada do .env para Produção Ubuntu
# Autor: Sistema ChatVendas
# Data: $(date)

set -e

echo "🚀 Configurando ambiente de produção para ChatVendas..."

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

# Função para solicitar input com validação
prompt_input() {
    local prompt="$1"
    local var_name="$2"
    local default_value="$3"
    local validation_pattern="$4"
    
    while true; do
        if [ -n "$default_value" ]; then
            read -p "$prompt [$default_value]: " input
            input=${input:-$default_value}
        else
            read -p "$prompt: " input
        fi
        
        if [ -n "$validation_pattern" ]; then
            if [[ $input =~ $validation_pattern ]]; then
                eval "$var_name='$input'"
                break
            else
                log_error "Formato inválido. Tente novamente."
            fi
        else
            if [ -n "$input" ]; then
                eval "$var_name='$input'"
                break
            else
                log_error "Este campo é obrigatório."
            fi
        fi
    done
}

# Detectar IP do servidor
detect_server_ip() {
    local ip=$(hostname -I | awk '{print $1}')
    if [ -z "$ip" ]; then
        ip=$(curl -s ifconfig.me 2>/dev/null || echo "localhost")
    fi
    echo "$ip"
}

# Verificar se está rodando no Ubuntu
if [ ! -f /etc/lsb-release ] || ! grep -q "Ubuntu" /etc/lsb-release; then
    log_warning "Este script foi otimizado para Ubuntu. Continuando mesmo assim..."
fi

# Verificar se está no diretório correto
if [ ! -f "package.json" ] || [ ! -d "server" ]; then
    log_error "Execute este script no diretório raiz do projeto ChatVendas"
    exit 1
fi

# Backup do .env atual se existir
if [ -f ".env" ]; then
    log_info "Fazendo backup do .env atual..."
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    log_success "Backup criado"
fi

echo ""
log_info "=== CONFIGURAÇÃO DO SUPABASE ==="

# Configuração do Supabase
prompt_input "URL do Supabase" "SUPABASE_URL" "https://fwhcgliitnhcbtlcxnif.supabase.co" "^https://[a-zA-Z0-9-]+\.supabase\.co$"
prompt_input "Chave Anônima do Supabase" "SUPABASE_ANON_KEY" "" "^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$"

echo ""
log_info "=== CONFIGURAÇÃO DOS SERVIÇOS WHATSAPP ==="

# Detectar IP do servidor
SERVER_IP=$(detect_server_ip)
log_info "IP detectado do servidor: $SERVER_IP"

# Configuração das URLs dos serviços WhatsApp
prompt_input "IP/Domínio do servidor" "SERVER_HOST" "$SERVER_IP"
prompt_input "Porta do serviço Baileys" "BAILEYS_PORT" "3001" "^[0-9]+$"
prompt_input "Porta do serviço Web.js" "WEBJS_PORT" "3002" "^[0-9]+$"

# Construir URLs dos serviços
BAILEYS_URL="http://${SERVER_HOST}:${BAILEYS_PORT}"
WEBJS_URL="http://${SERVER_HOST}:${WEBJS_PORT}"

echo ""
log_info "=== CONFIGURAÇÃO DO AMBIENTE ==="

# Configuração do ambiente
echo "Selecione o ambiente:"
echo "1) production"
echo "2) staging"
echo "3) development"
read -p "Escolha (1-3) [1]: " env_choice
env_choice=${env_choice:-1}

case $env_choice in
    1) NODE_ENV="production" ;;
    2) NODE_ENV="staging" ;;
    3) NODE_ENV="development" ;;
    *) NODE_ENV="production" ;;
esac

# Criar arquivo .env
log_info "Criando arquivo .env para produção..."

cat > .env << EOF
# Supabase Configuration
VITE_SUPABASE_URL="$SUPABASE_URL"
VITE_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY"

# WhatsApp Services URLs
VITE_BAILEYS_URL=$BAILEYS_URL
VITE_WEBJS_URL=$WEBJS_URL

# Environment
VITE_NODE_ENV=$NODE_ENV

# Server Configuration (for internal use)
SERVER_HOST=$SERVER_HOST
BAILEYS_PORT=$BAILEYS_PORT
WEBJS_PORT=$WEBJS_PORT

# Generated at: $(date)
EOF

log_success "Arquivo .env criado com sucesso!"

echo ""
log_info "=== RESUMO DA CONFIGURAÇÃO ==="
echo "Supabase URL: $SUPABASE_URL"
echo "Baileys Service: $BAILEYS_URL"
echo "Web.js Service: $WEBJS_URL"
echo "Ambiente: $NODE_ENV"

echo ""
log_info "=== VERIFICAÇÃO DE PORTAS ==="

# Verificar se as portas estão disponíveis
check_port() {
    local port=$1
    if netstat -tuln | grep -q ":$port "; then
        log_warning "Porta $port já está em uso"
        return 1
    else
        log_success "Porta $port disponível"
        return 0
    fi
}

check_port $BAILEYS_PORT
check_port $WEBJS_PORT

echo ""
log_info "=== CONFIGURAÇÃO DE FIREWALL (OPCIONAL) ==="
read -p "Deseja configurar o firewall UFW para as portas dos serviços? (y/N): " setup_firewall

if [[ $setup_firewall =~ ^[Yy]$ ]]; then
    log_info "Configurando firewall..."
    
    # Verificar se UFW está instalado
    if command -v ufw >/dev/null 2>&1; then
        sudo ufw allow $BAILEYS_PORT/tcp
        sudo ufw allow $WEBJS_PORT/tcp
        sudo ufw allow 3000/tcp  # Frontend
        log_success "Regras de firewall adicionadas"
    else
        log_warning "UFW não está instalado. Instale com: sudo apt install ufw"
    fi
fi

echo ""
log_success "✅ Configuração do ambiente de produção concluída!"
log_info "Próximos passos:"
echo "1. Instalar dependências: npm install"
echo "2. Instalar dependências dos serviços:"
echo "   cd server/baileys-service && npm install"
echo "   cd ../webjs-service && npm install"
echo "3. Executar: npm run build"
echo "4. Iniciar com PM2: pm2 start ecosystem.config.cjs"

echo ""
log_info "Para verificar os serviços:"
echo "- Status PM2: pm2 status"
echo "- Logs: pm2 logs"
echo "- Baileys: curl $BAILEYS_URL/health"
echo "- Web.js: curl $WEBJS_URL/health"