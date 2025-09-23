// Exemplo de inicialização do serviço whatsapp-web.js
// Este arquivo deve ser executado em um ambiente Node.js

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
  authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
  console.log('QR RECEIVED', qr);
  qrcode.generate(qr, { small: true });
  // Aqui você enviaria o QR code para o seu frontend
});

client.on('ready', () => {
  console.log('Client is ready!');
});

client.on('message', msg => {
  console.log('MESSAGE RECEIVED', msg.body);
  // Aqui você enviaria a mensagem para o seu frontend/webhook
  if (msg.body == '!ping') {
    msg.reply('pong');
  }
});

client.initialize();

console.log("Serviço whatsapp-web.js iniciado. Aguardando conexão...");
