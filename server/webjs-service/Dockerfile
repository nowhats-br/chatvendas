FROM node:18-alpine

WORKDIR /app

# Copiar arquivos de configuração
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar código-fonte
COPY . .

# Expor porta
EXPOSE 3002

# Comando para iniciar o serviço
CMD ["node", "index.js"]