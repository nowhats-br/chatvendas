#!/bin/bash

# Script de teste para validar o sistema de checkpoint
# Este script simula uma instalação parcial para testar o sistema de pulo de etapas

CHECKPOINT_FILE="/tmp/chatvendas_install_checkpoint"

echo "=== TESTE DO SISTEMA DE CHECKPOINT ==="
echo ""

# Limpar checkpoint anterior se existir
if [[ -f "$CHECKPOINT_FILE" ]]; then
    echo "Removendo checkpoint anterior..."
    rm -f "$CHECKPOINT_FILE"
fi

echo "1. Testando instalação completa (primeira execução)..."
echo "   - Todas as etapas devem ser executadas"
echo ""

# Simular algumas etapas já executadas
echo "system_update" >> "$CHECKPOINT_FILE"
echo "basic_dependencies" >> "$CHECKPOINT_FILE"
echo "nodejs_install" >> "$CHECKPOINT_FILE"

echo "2. Simulando interrupção após Node.js..."
echo "   - Checkpoint criado com: system_update, basic_dependencies, nodejs_install"
echo ""

echo "3. Para testar o sistema de pulo:"
echo "   - Execute: sudo ./install.sh"
echo "   - As primeiras 3 etapas devem ser puladas"
echo "   - A instalação deve continuar do PM2"
echo ""

echo "4. Para resetar e testar instalação completa:"
echo "   - Execute: rm -f /tmp/chatvendas_install_checkpoint"
echo "   - Execute: sudo ./install.sh"
echo "   - Todas as etapas devem ser executadas"
echo ""

echo "5. Verificar checkpoint atual:"
if [[ -f "$CHECKPOINT_FILE" ]]; then
    echo "   Etapas já executadas:"
    cat "$CHECKPOINT_FILE" | sed 's/^/   - /'
else
    echo "   Nenhum checkpoint encontrado"
fi

echo ""
echo "=== COMANDOS ÚTEIS ==="
echo "- Ver checkpoint: cat /tmp/chatvendas_install_checkpoint"
echo "- Limpar checkpoint: rm -f /tmp/chatvendas_install_checkpoint"
echo "- Executar instalação: sudo ./install.sh"
echo ""