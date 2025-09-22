# ChatVendas - Sistema de Atendimento WhatsApp

Sistema completo de atendimento via WhatsApp utilizando as APIs não oficiais Baileys e WhatsApp Web.js.

## 🚀 Características

- **Múltiplas APIs**: Suporte para Baileys e WhatsApp Web.js
- **Interface Moderna**: Frontend React com Vite e Tailwind CSS
- **Tempo Real**: Comunicação via Socket.IO
- **QR Code Dinâmico**: Geração automática para autenticação
- **Gerenciamento de Conexões**: Interface intuitiva para múltiplas contas
- **SSL Automático**: Configuração automática com Let's Encrypt
- **Backup Automático**: Backup diário das sessões WhatsApp

## 📋 Pré-requisitos

- Ubuntu 22.04 LTS
- Domínio configurado apontando para o servidor
- Email válido para certificado SSL
- Conta no Supabase (para banco de dados)

## 🛠️ Instalação Automática

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd chatvendas
```

### 2. Execute o instalador
```bash
chmod +x install.sh
./install.sh
```

O instalador irá solicitar:
- **Domínio**: exemplo.com
- **Email**: admin@exemplo.com  
- **Portas**: Frontend (3000), Baileys (3001), Web.js (3002)

### 3. Configure o Supabase
Após a instalação, edite o arquivo `/opt/chatvendas/.env`:
```bash
sudo nano /opt/chatvendas/.env
```

Configure as variáveis:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

### 4. Reinicie os serviços
```bash
sudo -u chatvendas pm2 restart all
```

## 🏗️ Estrutura do Projeto

```
chatvendas/
├── src/                          # Frontend React
│   ├── components/
│   │   └── Connections/          # Componentes de conexão WhatsApp
│   ├── lib/
│   │   ├── supabase.ts          # Configuração Supabase
│   │   └── whatsapp-service.ts  # Serviço WhatsApp
│   └── ...
├── server/                       # Serviços Backend
│   ├── baileys-service/         # API Baileys
│   │   ├── index.js            # Servidor principal
│   │   ├── package.json        # Dependências
│   │   └── .env.example        # Variáveis de ambiente
│   └── webjs-service/          # API WhatsApp Web.js
│       ├── index.js            # Servidor principal
│       ├── package.json        # Dependências
│       └── .env.example        # Variáveis de ambiente
├── install.sh                   # Instalador automático
└── ecosystem.config.js         # Configuração PM2
```

## 🔧 Comandos Úteis

### Gerenciar Serviços
```bash
# Ver status
sudo -u chatvendas pm2 status

# Ver logs
sudo -u chatvendas pm2 logs

# Reiniciar todos
sudo -u chatvendas pm2 restart all

# Reiniciar serviço específico
sudo -u chatvendas pm2 restart baileys-service
sudo -u chatvendas pm2 restart webjs-service
```

### Nginx
```bash
# Testar configuração
sudo nginx -t

# Reiniciar
sudo systemctl restart nginx

# Ver logs
sudo tail -f /var/log/nginx/error.log
```

### SSL
```bash
# Renovar certificado manualmente
sudo certbot renew

# Testar renovação
sudo certbot renew --dry-run
```

## 📊 Monitoramento

### Logs dos Serviços
```bash
# Logs em tempo real
sudo -u chatvendas pm2 logs --lines 100

# Logs específicos
sudo -u chatvendas pm2 logs baileys-service
sudo -u chatvendas pm2 logs webjs-service
```

### Status do Sistema
```bash
# Status PM2
sudo -u chatvendas pm2 monit

# Status Nginx
sudo systemctl status nginx

# Uso de recursos
htop
```

## 💾 Backup e Restauração

### Backup Automático
O sistema faz backup automático diário às 02:00 das sessões WhatsApp:
- Local: `/opt/chatvendas/backups/`
- Retenção: 7 dias

### Backup Manual
```bash
/opt/chatvendas/backup.sh
```

### Restauração
```bash
# Parar serviços
sudo -u chatvendas pm2 stop all

# Restaurar sessões
cd /opt/chatvendas/backups
tar -xzf sessions_YYYYMMDD_HHMMSS.tar.gz -C /

# Reiniciar serviços
sudo -u chatvendas pm2 start all
```

## 🔒 Segurança

### Firewall
```bash
# Ver regras ativas
sudo ufw status

# Permitir porta específica
sudo ufw allow 8080
```

### Atualizações
```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Atualizar dependências Node.js
cd /opt/chatvendas
sudo -u chatvendas npm update
```

## 🐛 Solução de Problemas

### Serviços não iniciam
```bash
# Verificar logs
sudo -u chatvendas pm2 logs

# Verificar portas em uso
sudo netstat -tlnp | grep :3001
sudo netstat -tlnp | grep :3002

# Reiniciar PM2
sudo -u chatvendas pm2 kill
sudo -u chatvendas pm2 start ecosystem.config.js
```

### Erro de SSL
```bash
# Verificar certificado
sudo certbot certificates

# Renovar forçadamente
sudo certbot renew --force-renewal
```

### QR Code não aparece
1. Verificar se os serviços estão rodando
2. Verificar logs dos serviços WhatsApp
3. Verificar conectividade com frontend
4. Limpar sessões antigas

### Limpar Sessões
```bash
# Parar serviços
sudo -u chatvendas pm2 stop all

# Remover sessões
sudo rm -rf /opt/chatvendas/server/baileys-service/sessions/*
sudo rm -rf /opt/chatvendas/server/webjs-service/.wwebjs_auth/*

# Reiniciar
sudo -u chatvendas pm2 start all
```

## 📱 Uso do Sistema

### 1. Acessar Interface
Acesse `https://seudominio.com` no navegador

### 2. Criar Conexão
1. Clique em "Nova Conexão"
2. Digite um nome para a conexão
3. Escolha a API (Baileys ou Web.js)
4. Escaneie o QR Code com WhatsApp
5. Aguarde a confirmação de conexão

### 3. Gerenciar Conexões
- **Conectar/Desconectar**: Use o botão de energia
- **Remover**: Use o botão de lixeira
- **Status**: Visualize o status em tempo real

## ⚠️ Avisos Importantes

1. **APIs Não Oficiais**: Este sistema usa APIs não oficiais do WhatsApp
2. **Risco de Bloqueio**: Contas podem ser bloqueadas pelo WhatsApp
3. **Uso Responsável**: Use apenas para fins legítimos
4. **Backup Regular**: Mantenha backups das sessões importantes
5. **Monitoramento**: Monitore logs regularmente

## 🤝 Suporte

Para suporte técnico:
1. Verifique os logs dos serviços
2. Consulte a seção de solução de problemas
3. Verifique a documentação das APIs utilizadas

## 📄 Licença

Este projeto é fornecido "como está" sem garantias. Use por sua conta e risco.

---

**Desenvolvido com ❤️ para facilitar o atendimento via WhatsApp**