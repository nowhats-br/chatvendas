#!/bin/bash

# Script de diagnóstico para problemas de conexão no Ubuntu
# Este script verifica se todos os serviços estão funcionando corretamente

echo "=== Diagnóstico de Conexão do ChatVendas ==="
echo ""

# Verificar se estamos no diretório correto
if [ ! -f ".env" ]; then
    echo "❌ Arquivo .env não encontrado. Execute este script na raiz do projeto."
    exit 1
fi

echo "1. Verificando configurações do ambiente..."
echo "   Diretório atual: $(pwd)"
echo ""

echo "2. Verificando se PM2 está instalado..."
if command -v pm2 &> /dev/null; then
    echo "   ✅ PM2 está instalado"
    pm2 --version
else
    echo "   ❌ PM2 não está instalado"
    echo "   Instale com: npm install -g pm2"
    exit 1
fi
echo ""

echo "3. Verificando status dos serviços..."
pm2 list
echo ""

echo "4. Verificando se as portas estão escutando..."
echo "   Verificando porta 3000 (Frontend)..."
if netstat -tulpn | grep :3000 > /dev/null; then
    echo "   ✅ Porta 3000 está escutando"
else
    echo "   ❌ Porta 3000 não está escutando"
fi

echo "   Verificando porta 3001 (Baileys)..."
if netstat -tulpn | grep :3001 > /dev/null; then
    echo "   ✅ Porta 3001 está escutando"
else
    echo "   ❌ Porta 3001 não está escutando"
fi

echo "   Verificando porta 3002 (Web.js)..."
if netstat -tulpn | grep :3002 > /dev/null; then
    echo "   ✅ Porta 3002 está escutando"
else
    echo "   ❌ Porta 3002 não está escutando"
fi
echo ""

echo "5. Testando conectividade local..."
echo "   Testando conexão com Frontend (porta 3000)..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "   ✅ Frontend está respondendo"
else
    echo "   ❌ Frontend não está respondendo"
fi

echo "   Testando conexão com Baileys (porta 3001)..."
if curl -s http://localhost:3001 > /dev/null; then
    echo "   ✅ Serviço Baileys está respondendo"
else
    echo "   ❌ Serviço Baileys não está respondendo"
fi

echo "   Testando conexão com Web.js (porta 3002)..."
if curl -s http://localhost:3002 > /dev/null; then
    echo "   ✅ Serviço Web.js está respondendo"
else
    echo "   ❌ Serviço Web.js não está respondendo"
fi
echo ""

echo "6. Verificando logs recentes..."
echo "   Últimas linhas dos logs do Frontend:"
pm2 logs chatvendas-frontend --lines 10 2>/dev/null || echo "   Sem logs disponíveis"

echo "   Últimas linhas dos logs do Baileys:"
pm2 logs baileys-service --lines 10 2>/dev/null || echo "   Sem logs disponíveis"

echo "   Últimas linhas dos logs do Web.js:"
pm2 logs webjs-service --lines 10 2>/dev/null || echo "   Sem logs disponíveis"
echo ""

echo "=== Resumo do Diagnóstico ==="
echo ""
echo "💡 Se algum serviço não estiver respondendo:"
echo "   1. Verifique se todos os serviços foram iniciados com: pm2 start ecosystem.config.cjs"
echo "   2. Verifique os logs detalhados com: pm2 logs"
echo "   3. Reinicie os serviços com: pm2 restart all"
echo ""
echo "💡 Se as portas não estiverem escutando:"
echo "   1. Verifique o firewall: sudo ufw status"
echo "   2. Libere as portas: sudo ufw allow 3000 && sudo ufw allow 3001 && sudo ufw allow 3002"
echo ""