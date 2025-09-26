FROM node:18-alpine

WORKDIR /app

# Copiar arquivos de configuração
COPY package*.json ./
COPY ./baileys-service/package*.json ./baileys-service/
COPY ./webjs-service/package*.json ./webjs-service/

# Instalar dependências
RUN npm install
RUN cd baileys-service && npm install
RUN cd webjs-service && npm install

# Copiar código-fonte
COPY . .

# Expor porta
EXPOSE 3001

# Comando para iniciar o serviço
CMD ["node", "index.js"]