#!/bin/bash

# Cores para saída
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # Sem cor

# Função para exibir mensagens
log() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[AVISO]${NC} $1"
}

error() {
  echo -e "${RED}[ERRO]${NC} $1"
}

# Verificar se o script está sendo executado como root
if [ "$EUID" -eq 0 ]; then
  error "Este script não deve ser executado como root. Por favor, execute como usuário normal."
  exit 1
fi

# Verificar se o Docker está instalado
if ! command -v docker &> /dev/null; then
  warn "Docker não encontrado. Instalando Docker..."
  
  # Atualizar pacotes
  log "Atualizando pacotes..."
  sudo apt-get update
  
  # Instalar dependências
  log "Instalando dependências..."
  sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
  
  # Adicionar chave GPG do Docker
  log "Adicionando chave GPG do Docker..."
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
  
  # Adicionar repositório do Docker
  log "Adicionando repositório do Docker..."
  sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
  
  # Atualizar pacotes novamente
  log "Atualizando pacotes..."
  sudo apt-get update
  
  # Instalar Docker
  log "Instalando Docker..."
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io
  
  # Adicionar usuário ao grupo docker
  log "Adicionando usuário ao grupo docker..."
  sudo usermod -aG docker $USER
  
  warn "Você precisa fazer logout e login novamente para que as alterações de grupo tenham efeito."
  warn "Após fazer login novamente, execute este script novamente."
  exit 0
fi

# Verificar se o Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
  warn "Docker Compose não encontrado. Instalando Docker Compose..."
  
  # Instalar Docker Compose
  log "Instalando Docker Compose..."
  sudo curl -L "https://github.com/docker/compose/releases/download/v2.18.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
fi

# Verificar se o arquivo .env existe
if [ ! -f .env ]; then
  warn "Arquivo .env não encontrado. Criando a partir do .env.example..."
  
  if [ -f .env.example ]; then
    cp .env.example .env
    log "Arquivo .env criado. Por favor, edite-o com suas configurações antes de continuar."
    log "Execute: nano .env"
    exit 0
  else
    error "Arquivo .env.example não encontrado. Não é possível continuar."
    exit 1
  fi
fi

# Solicitar domínio do sistema
read -p "Digite o domínio do sistema (ex: chatvendas.seudominio.com): " DOMAIN

# Configurar variáveis de ambiente
log "Configurando variáveis de ambiente..."
if grep -q "VITE_SUPABASE_URL" .env && grep -q "VITE_SUPABASE_ANON_KEY" .env; then
  log "Variáveis do Supabase já configuradas."
else
  error "As variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY precisam estar configuradas no arquivo .env"
  exit 1
fi

# Construir e iniciar os containers
log "Construindo e iniciando os containers..."
docker-compose up -d --build

# Verificar se os containers estão rodando
log "Verificando se os containers estão rodando..."
if docker-compose ps | grep -q "Up"; then
  log "Containers iniciados com sucesso!"
  log "O sistema está disponível em: http://$DOMAIN"
  log "Para visualizar os logs, execute: docker-compose logs -f"
  log "Para parar os containers, execute: docker-compose down"
else
  error "Ocorreu um erro ao iniciar os containers. Verifique os logs com: docker-compose logs"
  exit 1
fi

log "Instalação concluída com sucesso!"