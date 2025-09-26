FROM node:18-alpine as build

WORKDIR /app

# Copiar arquivos de configuração
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar código-fonte
COPY . .

# Construir a aplicação
RUN npm run build

# Estágio de produção
FROM nginx:alpine

# Copiar arquivos de build para o nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar configuração do nginx
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

# Expor porta
EXPOSE 80

# Comando para iniciar o nginx
CMD ["nginx", "-g", "daemon off;"]