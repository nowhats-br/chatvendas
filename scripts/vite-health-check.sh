#!/bin/bash

# Script de verificação de integridade do Vite
# Uso: ./vite-health-check.sh [diretorio]

WORK_DIR="${1:-/opt/chatvendas}"
USER_NAME="${2:-chatvendas}"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >&2
}

# Verificar se o diretório existe
if [ ! -d "$WORK_DIR" ]; then
    error "Diretório $WORK_DIR não encontrado"
    exit 1
fi

cd "$WORK_DIR"

log "Iniciando verificação de integridade do Vite em $WORK_DIR"

# 1. Verificar se package.json existe
if [ ! -f "package.json" ]; then
    error "package.json não encontrado"
    exit 1
fi

# 2. Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    error "node_modules não encontrado - execute npm install primeiro"
    exit 1
fi

# 3. Verificar se o Vite está instalado
if [ ! -d "node_modules/vite" ]; then
    error "Vite não encontrado em node_modules"
    exit 1
fi

# 4. Testar se o Vite é executável
log "Testando executabilidade do Vite..."
if ! sudo -u "$USER_NAME" npx vite --version >/dev/null 2>&1; then
    error "Vite não é executável - possível problema de dependências"
    
    log "Tentando corrigir automaticamente..."
    
    # Limpar caches
    sudo -u "$USER_NAME" rm -rf node_modules/.vite 2>/dev/null || true
    sudo -u "$USER_NAME" rm -rf dist 2>/dev/null || true
    sudo -u "$USER_NAME" find . -name "*.timestamp-*.mjs" -delete 2>/dev/null || true
    sudo -u "$USER_NAME" npm cache clean --force 2>/dev/null || true
    
    # Reinstalar dependências
    log "Reinstalando dependências..."
    if ! sudo -u "$USER_NAME" npm install --legacy-peer-deps; then
        error "Falha ao reinstalar dependências"
        exit 1
    fi
    
    # Testar novamente
    if ! sudo -u "$USER_NAME" npx vite --version >/dev/null 2>&1; then
        error "Vite ainda não funciona após correção automática"
        exit 1
    fi
    
    log "Correção automática bem-sucedida"
fi

# 5. Verificar se vite.config.ts existe e é válido
if [ -f "vite.config.ts" ]; then
    log "Verificando vite.config.ts..."
    if ! sudo -u "$USER_NAME" node -e "
        const fs = require('fs');
        const content = fs.readFileSync('vite.config.ts', 'utf8');
        if (!content.includes('vite') && !content.includes('defineConfig')) {
            process.exit(1);
        }
    " 2>/dev/null; then
        error "vite.config.ts parece estar corrompido"
        exit 1
    fi
fi

# 6. Teste de build rápido (dry-run)
log "Testando build (dry-run)..."
if ! timeout 30 sudo -u "$USER_NAME" npx vite build --mode development --minify false >/dev/null 2>&1; then
    error "Teste de build falhou"
    exit 1
fi

log "✅ Verificação de integridade do Vite concluída com sucesso"
log "✅ Vite está funcionando corretamente"

exit 0