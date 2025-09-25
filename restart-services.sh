#!/bin/bash

# Script para reiniciar todos os serviços do ChatVendas
# Este script deve ser executado no Ubuntu

echo "=== Reiniciando serviços do ChatVendas ==="

# Navegar para o diretório da aplicação
cd /opt/chatvendas

# Verificar se os serviços estão rodando
if pm2 list | grep -q "chatvendas-frontend"; then
    echo "Reiniciando serviços..."
    pm2 restart all
else
    echo "Iniciando serviços pela primeira vez..."
    pm2 start ecosystem.config.cjs
fi

# Aguardar alguns segundos para os serviços iniciarem
echo "Aguardando reinicialização dos serviços..."
sleep 10

# Verificar status dos serviços
echo "Verificando status dos serviços..."
pm2 list

# Mostrar logs dos serviços
echo "Mostrando últimos logs..."
pm2 logs --lines 20

echo ""
echo "=== Serviços reiniciados ==="
echo "Acesse o sistema em: http://localhost:3000"
echo "Verifique os logs completos com: pm2 logs"