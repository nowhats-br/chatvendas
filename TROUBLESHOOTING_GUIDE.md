# Guia de Solução de Problemas - ChatVendas

## Problema: "Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente."

### Causa
Esse erro ocorre quando o frontend não consegue se comunicar com os serviços backend (Baileys e Web.js) no Ubuntu. Isso pode acontecer por vários motivos:

1. **Os serviços backend não estão rodando no Ubuntu**
2. **Problemas de rede/firewall no Ubuntu**
3. **Configuração incorreta das URLs dos serviços**
4. **Problemas com o CORS**

### Soluções

#### Solução 1: Verificar se os serviços estão rodando no Ubuntu

1. Acesse o terminal do Ubuntu onde você fez a instalação
2. Execute o comando:
   ```bash
   pm2 list
   ```
   
3. Se os serviços não estiverem listados, inicie-os:
   ```bash
   cd /opt/chatvendas
   pm2 start ecosystem.config.cjs
   ```
   
4. Verifique se os serviços estão rodando corretamente:
   ```bash
   pm2 logs
   ```

#### Solução 2: Verificar conectividade de rede no Ubuntu

1. Verifique se as portas estão escutando:
   ```bash
   netstat -tulpn | grep :3001
   netstat -tulpn | grep :3003
   ```

2. Se estiver usando firewall, libere as portas:
   ```bash
   sudo ufw allow 3001
   sudo ufw allow 3003
   ```

#### Solução 3: Verificar configuração dos serviços

1. Edite o arquivo [/opt/chatvendas/.env](file:///opt/chatvendas/.env):
   ```
   # Verifique se as URLs estão corretas
   VITE_BAILEYS_URL=http://localhost:3001
   VITE_WEBJS_URL=http://localhost:3003
   ```

2. Reinicie os serviços:
   ```bash
   pm2 restart all
   ```

#### Solução 4: Verificar logs para mais detalhes

1. Verifique os logs dos serviços:
   ```bash
   pm2 logs baileys-service
   pm2 logs webjs-service
   pm2 logs chatvendas-frontend
   ```

2. Verifique os logs do navegador:
   - Abra o Console do Desenvolvedor (F12) no navegador
   - Veja se há erros de CORS ou conexão

### Verificação Rápida

Execute este script para verificar as conexões:

```bash
# No Ubuntu, na pasta do projeto
npx tsx test-connections.ts
```

### Contato

Se o problema persistir, por favor forneça:
1. Output do comando `pm2 list`
2. Qualquer erro nos logs dos serviços
3. Erros do console do navegador