# ChatVendas - Sistema de Atendimento WhatsApp

Sistema completo de atendimento ao cliente via WhatsApp com integração multi-dispositivo.

## Instalação

### Ubuntu 22.04 LTS

```bash
# Clone o repositório
git clone https://github.com/nowhats-br/chatvendas.git
cd chatvendas

# Execute o instalador
./install.sh
```

## Após a Instalação

### Iniciar os Serviços

```bash
# Iniciar todos os serviços
./start-services.sh

# Ou manualmente:
cd /opt/chatvendas
pm2 start ecosystem.config.cjs
```

### Reiniciar os Serviços

```bash
# Reiniciar todos os serviços
./restart-services.sh

# Ou manualmente:
cd /opt/chatvendas
pm2 restart all
```

### Verificar Status dos Serviços

```bash
# Verificar status
pm2 list

# Verificar logs
pm2 logs
```

## Acesso ao Sistema

Após iniciar os serviços, acesse o sistema em:
- http://localhost:3000 (se estiver acessando localmente)
- http://SEU_IP:3000 (se estiver acessando remotamente)

## Solução de Problemas

Se encontrar o erro "Não foi possível conectar ao servidor", execute o diagnóstico:

```bash
./diagnose-ubuntu.sh
```

Ou consulte o arquivo [TROUBLESHOOTING_GUIDE.md](file://c:\Users\brazz\OneDrive\Documentos\Zpro\chatvendas\chatvendas-1\TROUBLESHOOTING_GUIDE.md) para mais detalhes.

## Estrutura dos Serviços

- Frontend: porta 3000
- Baileys Service: porta 3001
- Web.js Service: porta 3002

## Licença

MIT