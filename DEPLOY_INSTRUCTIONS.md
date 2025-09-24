# 🚀 Instruções de Deploy - ChatVendas

## Problemas Identificados e Soluções

### ❌ Problemas Encontrados:
1. **Node.js versão incompatível**: v18.20.8 (requerido: >=20.0.0)
2. **Permissões negadas**: EACCES no diretório `/opt/chatvendas/node_modules`
3. **Vite não encontrado**: `sh: 1: vite: not found`
4. **Dependências com engine incompatível**: `@faker-js/faker`, `react-router`

## 🔧 Soluções Implementadas

### 1. Scripts de Correção Criados:

- **`deploy-production.sh`**: Script completo de deploy
- **`fix-node-version.sh`**: Atualiza Node.js para versão 20 LTS
- **`fix-permissions.sh`**: Corrige problemas de permissões

### 2. Execução no Servidor de Produção:

```bash
# 1. Fazer upload dos scripts para o servidor
scp deploy-production.sh fix-node-version.sh fix-permissions.sh deploy@vmi2659416:/opt/chatvendas/

# 2. Conectar ao servidor
ssh deploy@vmi2659416

# 3. Navegar para o diretório
cd /opt/chatvendas

# 4. Dar permissão de execução aos scripts
chmod +x *.sh

# 5. Executar correção do Node.js (PRIMEIRO)
./fix-node-version.sh

# 6. Executar correção de permissões (SEGUNDO)
./fix-permissions.sh

# 7. Executar deploy completo (TERCEIRO)
./deploy-production.sh
```

### 3. Alternativa Manual (Passo a Passo):

#### Passo 1: Atualizar Node.js
```bash
# Remover versão antiga
sudo apt-get remove -y nodejs npm

# Instalar Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar versão
node --version  # Deve mostrar v20.x.x
```

#### Passo 2: Corrigir Permissões
```bash
# Ajustar propriedade do diretório
sudo chown -R $USER:$USER /opt/chatvendas

# Definir permissões corretas
sudo chmod -R 755 /opt/chatvendas

# Navegar para o diretório
cd /opt/chatvendas

# Limpar cache e dependências
rm -rf node_modules package-lock.json
npm cache clean --force
```

#### Passo 3: Instalar Dependências
```bash
# Configurar npm
npm config set fund false
npm config set audit false

# Instalar dependências
npm install --legacy-peer-deps --no-optional

# Instalar Vite globalmente (se necessário)
npm install -g vite
```

#### Passo 4: Build do Projeto
```bash
# Executar build usando npx (recomendado)
npx vite build

# OU usando vite global
vite build

# Verificar se o build foi criado
ls -la dist/
```

## 🔍 Verificações de Saúde

### Verificar Node.js:
```bash
node --version    # Deve ser >=20.0.0
npm --version     # Deve ser >=10.0.0
```

### Verificar Permissões:
```bash
ls -la /opt/chatvendas/
whoami
touch /opt/chatvendas/test.txt && rm /opt/chatvendas/test.txt
```

### Verificar Vite:
```bash
which vite        # Deve mostrar caminho
vite --version    # Deve mostrar versão
npx vite --version # Alternativa usando npx
```

### Verificar Build:
```bash
ls -la dist/
cat dist/index.html | head -5
```

## 🚨 Troubleshooting

### Se ainda der erro de permissão:
```bash
# Verificar se o usuário tem sudo
sudo -l

# Criar usuário deploy se necessário
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG sudo deploy
sudo chown -R deploy:deploy /opt/chatvendas
```

### Se Vite não for encontrado:
```bash
# Usar npx em vez de vite global
npx vite build

# OU instalar globalmente
npm install -g vite

# OU usar script do package.json
npm run build
```

### Se der erro de engine:
```bash
# Usar flags para ignorar warnings
npm install --legacy-peer-deps --ignore-engines

# OU atualizar Node.js para versão mais recente
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## 📋 Checklist Final

- [ ] Node.js versão >=20.0.0 instalado
- [ ] Permissões corretas no diretório `/opt/chatvendas`
- [ ] Dependências instaladas sem erros
- [ ] Vite disponível (global ou via npx)
- [ ] Build executado com sucesso
- [ ] Diretório `dist/` criado com arquivos
- [ ] Nginx configurado (se aplicável)

## 🎯 Comandos de Verificação Rápida

```bash
# Verificação completa em uma linha
echo "Node: $(node --version) | NPM: $(npm --version) | User: $(whoami) | Dir: $(pwd)" && ls -la dist/ 2>/dev/null || echo "Build não encontrado"
```

## 📞 Suporte

Se ainda houver problemas após seguir estas instruções:

1. Verifique os logs: `tail -f /var/log/nginx/error.log`
2. Teste localmente: `npm run dev`
3. Verifique variáveis de ambiente: `cat .env`
4. Teste build local: `npm run build`

---

**Nota**: Estes scripts foram criados especificamente para resolver os erros encontrados no deploy do ChatVendas. Execute-os na ordem indicada para melhor resultado.