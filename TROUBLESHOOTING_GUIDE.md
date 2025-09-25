# Guia de Solução de Problemas - ChatVendas

## Problema: "Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente."

### Causa
Esse erro ocorre quando o frontend não consegue se comunicar com os serviços backend (Baileys e Web.js). Isso pode acontecer por vários motivos:

1. **Os serviços backend não estão rodando**
2. **Conflito entre ambientes (Ubuntu vs Windows)**
3. **Problemas de rede/firewall**
4. **Configuração incorreta das URLs dos serviços**

### Soluções

#### Solução 1: Verificar se os serviços estão rodando no Ubuntu

1. Acesse o servidor Ubuntu onde você fez a instalação
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

#### Solução 2: Se estiver acessando de uma máquina Windows diferente

1. Edite o arquivo [.env](file://c:\Users\brazz\OneDrive\Documentos\Zpro\chatvendas\chatvendas-1\.env) na sua máquina Windows:
   ```
   # Substitua localhost pelo IP do seu servidor Ubuntu
   VITE_BAILEYS_URL=http://IP_DO_UBUNTU:3001
   VITE_WEBJS_URL=http://IP_DO_UBUNTU:3003
   ```

2. Certifique-se de que as portas 3001 e 3003 estão liberadas no firewall do Ubuntu:
   ```bash
   # No Ubuntu
   sudo ufw allow 3001
   sudo ufw allow 3003
   ```

#### Solução 3: Desenvolvimento local no Windows (apenas para desenvolvimento)

Se você quiser rodar tudo localmente no Windows para desenvolvimento:

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Inicie os serviços backend separadamente:
   ```bash
   # Terminal 1 - Baileys service
   cd server/baileys-service
   npm start
   
   # Terminal 2 - Web.js service
   cd server/webjs-service
   npm start
   
   # Terminal 3 - Frontend
   npm run dev
   ```

#### Solução 4: Verificar logs para mais detalhes

1. Verifique os logs do frontend:
   ```bash
   # No navegador, abra o Console do Desenvolvedor (F12)
   # Veja se há erros de CORS ou conexão
   ```

2. Verifique os logs do backend (no Ubuntu):
   ```bash
   pm2 logs
   ```

### Verificação Rápida

Execute este script para verificar as conexões:

```bash
npx tsx test-connections.ts
```

### Contato

Se o problema persistir, por favor forneça:
1. Output do comando `pm2 list` no Ubuntu
2. Qualquer erro nos logs do console do navegador
3. Se você está acessando de uma máquina diferente da que está rodando os serviços