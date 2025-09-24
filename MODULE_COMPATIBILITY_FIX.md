# Correção de Compatibilidade de Módulos ES/CommonJS

## Problema Identificado

O erro `ReferenceError: module is not defined in ES module scope` ocorreu porque:

1. **package.json** define `"type": "module"` - configurando o projeto como ES modules
2. **ecosystem.config.js** usa sintaxe CommonJS (`module.exports`)
3. **Conflito**: Node.js tenta interpretar o arquivo .js como ES module, mas encontra sintaxe CommonJS

## Solução Implementada

### 1. **Renomeação do Arquivo de Configuração**
- `ecosystem.config.js` → `ecosystem.config.cjs`
- A extensão `.cjs` força o Node.js a interpretar como CommonJS, independente da configuração do package.json

### 2. **Atualização dos Scripts de Instalação**

#### install.sh
```bash
# Antes
sudo -u chatvendas tee /opt/chatvendas/ecosystem.config.js > /dev/null <<EOF

# Depois  
sudo -u chatvendas tee /opt/chatvendas/ecosystem.config.cjs > /dev/null <<EOF
```

#### install-fast.sh
```bash
# Antes
sudo -u chatvendas pm2 start ecosystem.config.js

# Depois
sudo -u chatvendas pm2 start ecosystem.config.cjs
```

#### backup.sh
```bash
# Antes
if [ -f "/opt/chatvendas/ecosystem.config.js" ]; then
    cp "/opt/chatvendas/ecosystem.config.js" "$TEMP_DIR/config/"

# Depois
if [ -f "/opt/chatvendas/ecosystem.config.cjs" ]; then
    cp "/opt/chatvendas/ecosystem.config.cjs" "$TEMP_DIR/config/"
```

### 3. **Verificação de Compatibilidade**

✅ **Teste de Sintaxe**: `node -c ecosystem.config.cjs` - Passou
✅ **Teste de Carregamento**: `node -e "require('./ecosystem.config.cjs')"` - Passou
✅ **Estrutura JSON**: Configuração carregada corretamente

## Benefícios da Solução

1. **Compatibilidade Total**: Funciona com projetos ES modules e CommonJS
2. **Sem Alteração de Lógica**: Mantém toda a configuração PM2 intacta
3. **Retrocompatibilidade**: PM2 suporta arquivos .cjs nativamente
4. **Clareza**: Extensão .cjs deixa explícito o tipo de módulo

## Arquivos Modificados

- `ecosystem.config.js` → `ecosystem.config.cjs` (renomeado)
- `install.sh` (3 ocorrências atualizadas)
- `install-fast.sh` (1 ocorrência atualizada)  
- `backup.sh` (1 ocorrência atualizada)

## Resultado

O PM2 agora consegue carregar a configuração sem erros de módulo, resolvendo completamente o problema de compatibilidade ES modules/CommonJS.