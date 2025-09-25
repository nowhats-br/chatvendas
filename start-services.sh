#!/bin/bash

# Script para iniciar todos os serviços do ChatVendas
# Este script deve ser executado no Ubuntu após a instalação

echo "=== Iniciando serviços do ChatVendas ==="

# Navegar para o diretório da aplicação
cd /opt/chatvendas

# Verificar se PM2 está instalado
if ! command -v pm2 &> /dev/null
then
    echo "PM2 não encontrado. Instalando..."
    npm install -g pm2
fi

# Iniciar todos os serviços
echo "Iniciando serviços com PM2..."
pm2 start ecosystem.config.cjs

# Aguardar alguns segundos para os serviços iniciarem
echo "Aguardando inicialização dos serviços..."
sleep 10

# Verificar status dos serviços
echo "Verificando status dos serviços..."
pm2 list

# Mostrar logs dos serviços
echo "Mostrando últimos logs..."
pm2 logs --lines 20

echo ""
echo "=== Serviços iniciados ==="
echo "Acesse o sistema em: http://localhost:3000"
echo "Verifique os logs completos com: pm2 logs"