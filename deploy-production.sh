#!/bin/bash

# Script de Deploy Automatizado para Produção Ubuntu 22.04
# ChatVendas - Sistema de Vendas via WhatsApp
# Versão: 1.0.0

set -e  # Parar execução em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
PROJECT_NAME="chatvendas"
PROJECT_DIR="/opt/${PROJECT_NAME}"
BACKUP_DIR="/opt/backups/${PROJECT_NAME}"
LOG_DIR="${PROJECT_DIR}/logs"
USER="ubuntu"
NODE_VERSION="18"

# Função para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Verificar se está rodando como root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "Este script não deve ser executado como root. Use um usuário com sudo."
    fi
}

# Verificar dependências do sistema
check_dependencies() {
    log "Verificando dependências do sistema..."
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js não está instalado. Instale o Node.js ${NODE_VERSION} primeiro."
    fi
    
    # Verificar npm
    if ! command -v npm &> /dev/null; then
        error "npm não está instalado."
    fi
    
    # Verificar PM2
    if ! command -v pm2 &> /dev/null; then
        warn "PM2 não está instalado. Instalando PM2 globalmente..."
        sudo npm install -g pm2
    fi
    
    # Verificar Git
    if ! command -v git &> /dev/null; then
        error "Git não está instalado."
    fi
    
    log "Todas as dependências estão instaladas."
}

# Criar estrutura de diretórios
create_directories() {
    log "Criando estrutura de diretórios..."
    
    sudo mkdir -p "${PROJECT_DIR}"
    sudo mkdir -p "${BACKUP_DIR}"
    sudo mkdir -p "${LOG_DIR}"
    
    # Definir permissões
    sudo chown -R ${USER}:${USER} "${PROJECT_DIR}"
    sudo chown -R ${USER}:${USER} "${BACKUP_DIR}"
    
    log "Estrutura de diretórios criada."
}

# Fazer backup da versão atual
backup_current_version() {
    if [ -d "${PROJECT_DIR}" ] && [ "$(ls -A ${PROJECT_DIR})" ]; then
        log "Fazendo backup da versão atual..."
        
        BACKUP_NAME="${PROJECT_NAME}_backup_$(date +%Y%m%d_%H%M%S)"
        sudo cp -r "${PROJECT_DIR}" "${BACKUP_DIR}/${BACKUP_NAME}"
        
        log "Backup criado em: ${BACKUP_DIR}/${BACKUP_NAME}"
    else
        info "Nenhuma versão anterior encontrada para backup."
    fi
}

# Clonar ou atualizar repositório
deploy_code() {
    log "Fazendo deploy do código..."
    
    if [ -d "${PROJECT_DIR}/.git" ]; then
        log "Atualizando repositório existente..."
        cd "${PROJECT_DIR}"
        git fetch origin
        git reset --hard origin/main
        git clean -fd
    else
        log "Clonando repositório..."
        if [ -z "${GIT_REPO_URL}" ]; then
            error "Variável GIT_REPO_URL não está definida. Execute: export GIT_REPO_URL='sua-url-do-git'"
        fi
        
        sudo rm -rf "${PROJECT_DIR}"
        git clone "${GIT_REPO_URL}" "${PROJECT_DIR}"
        cd "${PROJECT_DIR}"
    fi
    
    log "Código deployado com sucesso."
}

# Configurar ambiente
setup_environment() {
    log "Configurando ambiente..."
    
    cd "${PROJECT_DIR}"
    
    # Verificar se .env existe
    if [ ! -f ".env" ]; then
        warn "Arquivo .env não encontrado. Execute o script de configuração primeiro:"
        warn "bash configure-production-env.sh"
        error "Configuração do ambiente necessária."
    fi
    
    # Instalar dependências do projeto principal
    log "Instalando dependências do projeto principal..."
    npm install --production
    
    # Instalar dependências do baileys-service
    log "Instalando dependências do baileys-service..."
    cd "${PROJECT_DIR}/server/baileys-service"
    npm install --production
    
    # Instalar dependências do webjs-service
    log "Instalando dependências do webjs-service..."
    cd "${PROJECT_DIR}/server/webjs-service"
    npm install --production
    
    cd "${PROJECT_DIR}"
    
    log "Ambiente configurado com sucesso."
}

# Build do projeto
build_project() {
    log "Fazendo build do projeto..."
    
    cd "${PROJECT_DIR}"
    npm run build
    
    log "Build concluído com sucesso."
}

# Configurar PM2
setup_pm2() {
    log "Configurando PM2..."
    
    cd "${PROJECT_DIR}"
    
    # Parar processos existentes
    pm2 delete all 2>/dev/null || true
    
    # Iniciar aplicações
    pm2 start ecosystem.config.cjs --env production
    
    # Salvar configuração do PM2
    pm2 save
    
    # Configurar PM2 para iniciar no boot
    sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ${USER} --hp /home/${USER}
    
    log "PM2 configurado com sucesso."
}

# Configurar firewall
setup_firewall() {
    log "Configurando firewall..."
    
    # Verificar se UFW está instalado
    if command -v ufw &> /dev/null; then
        # Permitir SSH
        sudo ufw allow ssh
        
        # Permitir portas da aplicação
        sudo ufw allow 3000/tcp  # Frontend
        sudo ufw allow 3001/tcp  # Baileys Service
        sudo ufw allow 3002/tcp  # WebJS Service
        
        # Permitir HTTP e HTTPS se necessário
        sudo ufw allow 80/tcp
        sudo ufw allow 443/tcp
        
        # Ativar firewall se não estiver ativo
        sudo ufw --force enable
        
        log "Firewall configurado."
    else
        warn "UFW não está instalado. Considere instalar para maior segurança."
    fi
}

# Verificar saúde dos serviços
health_check() {
    log "Verificando saúde dos serviços..."
    
    sleep 10  # Aguardar serviços iniciarem
    
    # Verificar PM2
    pm2 status
    
    # Verificar portas
    local ports=(3000 3001 3002)
    for port in "${ports[@]}"; do
        if netstat -tuln | grep ":${port} " > /dev/null; then
            log "Porta ${port} está ativa ✓"
        else
            error "Porta ${port} não está ativa ✗"
        fi
    done
    
    # Verificar endpoints de saúde
    sleep 5
    
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        log "Baileys Service está saudável ✓"
    else
        warn "Baileys Service pode não estar respondendo corretamente"
    fi
    
    if curl -f http://localhost:3002/health > /dev/null 2>&1; then
        log "WebJS Service está saudável ✓"
    else
        warn "WebJS Service pode não estar respondendo corretamente"
    fi
    
    log "Verificação de saúde concluída."
}

# Mostrar informações finais
show_final_info() {
    log "Deploy concluído com sucesso! 🎉"
    echo
    info "Informações do Deploy:"
    info "- Projeto: ${PROJECT_NAME}"
    info "- Diretório: ${PROJECT_DIR}"
    info "- Logs: ${LOG_DIR}"
    info "- Backup: ${BACKUP_DIR}"
    echo
    info "Serviços disponíveis:"
    info "- Frontend: http://$(hostname -I | awk '{print $1}'):3000"
    info "- Baileys Service: http://$(hostname -I | awk '{print $1}'):3001"
    info "- WebJS Service: http://$(hostname -I | awk '{print $1}'):3002"
    echo
    info "Comandos úteis:"
    info "- Ver status: pm2 status"
    info "- Ver logs: pm2 logs"
    info "- Reiniciar: pm2 restart all"
    info "- Parar: pm2 stop all"
    echo
    warn "Lembre-se de:"
    warn "1. Configurar seu domínio/DNS se necessário"
    warn "2. Configurar SSL/HTTPS para produção"
    warn "3. Configurar backup automático"
    warn "4. Monitorar logs regularmente"
}

# Função principal
main() {
    log "Iniciando deploy para produção Ubuntu 22.04..."
    
    check_root
    check_dependencies
    create_directories
    backup_current_version
    deploy_code
    setup_environment
    build_project
    setup_pm2
    setup_firewall
    health_check
    show_final_info
    
    log "Deploy finalizado com sucesso! 🚀"
}

# Verificar argumentos
case "${1:-}" in
    --help|-h)
        echo "Script de Deploy Automatizado - ChatVendas"
        echo
        echo "Uso: $0 [opções]"
        echo
        echo "Opções:"
        echo "  --help, -h     Mostrar esta ajuda"
        echo "  --check        Apenas verificar dependências"
        echo "  --backup       Apenas fazer backup"
        echo
        echo "Variáveis de ambiente necessárias:"
        echo "  GIT_REPO_URL   URL do repositório Git"
        echo
        echo "Exemplo:"
        echo "  export GIT_REPO_URL='https://github.com/usuario/chatvendas.git'"
        echo "  bash $0"
        exit 0
        ;;
    --check)
        check_dependencies
        exit 0
        ;;
    --backup)
        backup_current_version
        exit 0
        ;;
    "")
        main
        ;;
    *)
        error "Opção inválida: $1. Use --help para ver as opções disponíveis."
        ;;
esac