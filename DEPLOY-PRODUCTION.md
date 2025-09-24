# 🚀 Guia de Deploy para Produção - Ubuntu 22.04

## ChatVendas - Sistema de Vendas via WhatsApp

Este guia fornece instruções completas para fazer o deploy do ChatVendas em um servidor Ubuntu 22.04 em produção.

---

## 📋 Pré-requisitos

### Sistema Operacional
- Ubuntu 22.04 LTS
- Usuário com privilégios sudo (não root)
- Acesso SSH ao servidor

### Dependências Necessárias
- Node.js 18+ LTS
- npm 8+
- Git
- PM2 (será instalado automaticamente)
- UFW (firewall - opcional)

---

## 🛠️ Preparação do Servidor

### 1. Atualizar o Sistema
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Instalar Node.js 18 LTS
```bash
# Instalar Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalação
node --version
npm --version
```

### 3. Instalar Git
```bash
sudo apt install git -y
```

### 4. Configurar Usuário Git (se necessário)
```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@exemplo.com"
```

---

## 📁 Estrutura de Diretórios

O projeto será instalado em `/opt/chatvendas` com a seguinte estrutura:

```
/opt/chatvendas/
├── .env                          # Configurações de ambiente
├── package.json                  # Dependências do frontend
├── ecosystem.config.cjs          # Configuração do PM2
├── dist/                         # Build do frontend
├── server/
│   ├── baileys-service/
│   │   ├── index.js             # Serviço Baileys com Socket.IO
│   │   └── package.json         # Dependências do Baileys
│   └── webjs-service/
│       ├── index.js             # Serviço Web.js com Socket.IO
│       └── package.json         # Dependências do Web.js
└── logs/                        # Logs dos serviços
```

---

## 🔧 Processo de Deploy

### Método 1: Deploy Automatizado (Recomendado)

#### 1. Fazer Upload dos Scripts
Faça upload dos seguintes arquivos para o servidor:
- `configure-production-env.sh`
- `deploy-production.sh`

#### 2. Configurar Ambiente
```bash
# Tornar scripts executáveis
chmod +x configure-production-env.sh deploy-production.sh

# Configurar variáveis de ambiente
./configure-production-env.sh
```

#### 3. Executar Deploy
```bash
# Definir URL do repositório
export GIT_REPO_URL='https://github.com/seu-usuario/chatvendas.git'

# Executar deploy
./deploy-production.sh
```

### Método 2: Deploy Manual

#### 1. Clonar Repositório
```bash
sudo mkdir -p /opt/chatvendas
sudo chown -R $USER:$USER /opt/chatvendas
git clone https://github.com/seu-usuario/chatvendas.git /opt/chatvendas
cd /opt/chatvendas
```

#### 2. Configurar Ambiente
```bash
# Copiar e configurar .env
cp .env.example .env
nano .env  # Editar com suas configurações
```

#### 3. Instalar Dependências
```bash
# Frontend
npm install --production

# Baileys Service
cd server/baileys-service
npm install --production

# WebJS Service
cd ../webjs-service
npm install --production

cd /opt/chatvendas
```

#### 4. Build do Frontend
```bash
npm run build
```

#### 5. Instalar e Configurar PM2
```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Iniciar serviços
pm2 start ecosystem.config.cjs --env production

# Salvar configuração
pm2 save

# Configurar inicialização automática
pm2 startup
```

---

## ⚙️ Configuração do Ambiente (.env)

### Variáveis Obrigatórias

```bash
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima

# URLs dos Serviços (substitua pelo IP do servidor)
VITE_BAILEYS_URL=http://SEU-IP-SERVIDOR:3001
VITE_WEBJS_URL=http://SEU-IP-SERVIDOR:3002

# Ambiente
VITE_NODE_ENV=production

# Configurações dos Serviços
BAILEYS_PORT=3001
WEBJS_PORT=3002
SESSION_ID=prod_session_$(date +%s)
HOST=0.0.0.0
FRONTEND_URL=http://seu-dominio.com
```

---

## 🔥 Configuração do Firewall

### UFW (Ubuntu Firewall)
```bash
# Ativar UFW
sudo ufw enable

# Permitir SSH
sudo ufw allow ssh

# Permitir portas da aplicação
sudo ufw allow 3000/tcp  # Frontend
sudo ufw allow 3001/tcp  # Baileys Service
sudo ufw allow 3002/tcp  # WebJS Service

# Permitir HTTP/HTTPS (se usar proxy reverso)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Verificar status
sudo ufw status
```

---

## 🔍 Verificação e Monitoramento

### Comandos PM2 Essenciais
```bash
# Ver status dos serviços
pm2 status

# Ver logs em tempo real
pm2 logs

# Ver logs de um serviço específico
pm2 logs baileys-service
pm2 logs webjs-service
pm2 logs chatvendas-frontend

# Reiniciar serviços
pm2 restart all
pm2 restart baileys-service

# Parar serviços
pm2 stop all

# Deletar serviços
pm2 delete all
```

### Verificar Portas
```bash
# Verificar se as portas estão ativas
netstat -tuln | grep :3000
netstat -tuln | grep :3001
netstat -tuln | grep :3002
```

### Testar Endpoints
```bash
# Health checks
curl http://localhost:3001/health
curl http://localhost:3002/health

# Status dos serviços WhatsApp
curl http://localhost:3001/status
curl http://localhost:3002/status
```

---

## 🌐 Configuração de Domínio (Opcional)

### Nginx como Proxy Reverso

#### 1. Instalar Nginx
```bash
sudo apt install nginx -y
```

#### 2. Configurar Site
```bash
sudo nano /etc/nginx/sites-available/chatvendas
```

```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Baileys Service
    location /api/baileys/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebJS Service
    location /api/webjs/ {
        proxy_pass http://localhost:3002/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 3. Ativar Site
```bash
sudo ln -s /etc/nginx/sites-available/chatvendas /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔒 SSL/HTTPS com Let's Encrypt

### 1. Instalar Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 2. Obter Certificado
```bash
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

### 3. Renovação Automática
```bash
sudo crontab -e
# Adicionar linha:
0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 📊 Monitoramento e Logs

### Localização dos Logs
```bash
# Logs do PM2
/opt/chatvendas/logs/

# Logs específicos
tail -f /opt/chatvendas/logs/baileys-combined.log
tail -f /opt/chatvendas/logs/webjs-combined.log
tail -f /opt/chatvendas/logs/frontend-combined.log
```

### Monitoramento com PM2
```bash
# Interface web do PM2 (opcional)
pm2 install pm2-server-monit
```

---

## 🔄 Backup e Restauração

### Script de Backup
```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/chatvendas"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/chatvendas_$DATE.tar.gz /opt/chatvendas
echo "Backup criado: $BACKUP_DIR/chatvendas_$DATE.tar.gz"
```

### Backup Automático (Cron)
```bash
sudo crontab -e
# Backup diário às 2h da manhã
0 2 * * * /opt/scripts/backup-chatvendas.sh
```

---

## 🚨 Solução de Problemas

### Problemas Comuns

#### 1. Serviços não iniciam
```bash
# Verificar logs
pm2 logs

# Verificar permissões
sudo chown -R $USER:$USER /opt/chatvendas

# Reinstalar dependências
cd /opt/chatvendas
rm -rf node_modules package-lock.json
npm install --production
```

#### 2. QR Code não aparece
```bash
# Verificar se os serviços estão rodando
curl http://localhost:3001/health
curl http://localhost:3002/health

# Verificar logs dos serviços WhatsApp
pm2 logs baileys-service
pm2 logs webjs-service
```

#### 3. Erro de conexão Socket.IO
```bash
# Verificar configuração CORS
# Verificar URLs no .env
# Verificar firewall
sudo ufw status
```

#### 4. Problemas de memória
```bash
# Aumentar limite de memória no ecosystem.config.cjs
max_memory_restart: '2G'

# Monitorar uso de memória
pm2 monit
```

---

## 📞 Suporte

### Comandos de Diagnóstico
```bash
# Informações do sistema
uname -a
node --version
npm --version
pm2 --version

# Status dos serviços
pm2 status
systemctl status nginx  # se usando nginx

# Uso de recursos
htop
df -h
free -h
```

### Logs Importantes
- `/opt/chatvendas/logs/` - Logs da aplicação
- `/var/log/nginx/` - Logs do Nginx (se usado)
- `pm2 logs` - Logs em tempo real

---

## ✅ Checklist de Deploy

- [ ] Servidor Ubuntu 22.04 configurado
- [ ] Node.js 18+ instalado
- [ ] Git configurado
- [ ] Repositório clonado
- [ ] Arquivo `.env` configurado
- [ ] Dependências instaladas
- [ ] Build do frontend executado
- [ ] PM2 instalado e configurado
- [ ] Serviços iniciados com PM2
- [ ] Firewall configurado
- [ ] Portas testadas
- [ ] Health checks funcionando
- [ ] QR Codes sendo gerados
- [ ] Logs sendo gravados
- [ ] Backup configurado
- [ ] Monitoramento ativo

---

## 🎯 Próximos Passos

1. **Configurar domínio personalizado**
2. **Implementar SSL/HTTPS**
3. **Configurar monitoramento avançado**
4. **Implementar CI/CD**
5. **Configurar alertas**
6. **Otimizar performance**

---

**Desenvolvido com ❤️ para facilitar vendas via WhatsApp**