const express = require('express');
const { Server } = require('socket.io');
const http = require('http');
const cors = require('cors');
const { Client, LocalAuth, RemoteAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Armazenar instâncias ativas
const activeConnections = new Map();
const connectionStates = new Map();

// Função para criar uma nova conexão WhatsApp
async function createWhatsAppConnection(connectionId, socketClient) {
  try {
    console.log(`Iniciando conexão WhatsApp Web.js para: ${connectionId}`);
    
    const sessionDir = path.join(__dirname, 'sessions', connectionId);
    await fs.ensureDir(sessionDir);

    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: connectionId,
        dataPath: sessionDir
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      }
    });

    // Armazenar a conexão
    activeConnections.set(connectionId, client);
    connectionStates.set(connectionId, { status: 'initializing', qr: null });

    // Event listeners
    client.on('qr', async (qr) => {
      try {
        const qrCodeDataURL = await QRCode.toDataURL(qr);
        connectionStates.set(connectionId, { 
          status: 'qr_ready', 
          qr: qrCodeDataURL 
        });
        
        // Enviar QR code para o frontend
        socketClient.emit('qr_code', {
          connectionId,
          qrCode: qrCodeDataURL
        });
        
        console.log(`QR Code gerado para conexão: ${connectionId}`);
      } catch (err) {
        console.error('Erro ao gerar QR Code:', err);
      }
    });

    client.on('authenticated', () => {
      console.log(`Cliente autenticado: ${connectionId}`);
      connectionStates.set(connectionId, { 
        status: 'authenticated', 
        qr: null 
      });

      socketClient.emit('connection_status', {
        connectionId,
        status: 'authenticated'
      });
    });

    client.on('auth_failure', (msg) => {
      console.error(`Falha na autenticação para ${connectionId}:`, msg);
      connectionStates.set(connectionId, { 
        status: 'auth_failure', 
        qr: null,
        error: msg 
      });

      socketClient.emit('connection_status', {
        connectionId,
        status: 'auth_failure',
        error: msg
      });
    });

    client.on('ready', () => {
      console.log(`Cliente pronto: ${connectionId}`);
      
      const phoneNumber = client.info?.wid?.user;
      connectionStates.set(connectionId, { 
        status: 'connected', 
        qr: null,
        phoneNumber 
      });

      socketClient.emit('connection_status', {
        connectionId,
        status: 'connected',
        phoneNumber
      });
    });

    client.on('disconnected', (reason) => {
      console.log(`Cliente desconectado ${connectionId}:`, reason);
      connectionStates.set(connectionId, { 
        status: 'disconnected', 
        qr: null,
        reason 
      });

      socketClient.emit('connection_status', {
        connectionId,
        status: 'disconnected',
        reason
      });

      // Limpar da memória
      activeConnections.delete(connectionId);
      connectionStates.delete(connectionId);
    });

    client.on('message', async (message) => {
      if (!message.fromMe && message.body) {
        console.log(`Nova mensagem recebida na conexão ${connectionId}`);
        
        // Obter informações do contato
        const contact = await message.getContact();
        
        // Enviar mensagem para o frontend
        socketClient.emit('new_message', {
          connectionId,
          message: {
            id: message.id._serialized,
            from: message.from,
            fromName: contact.name || contact.pushname || message.from,
            timestamp: message.timestamp,
            body: message.body,
            type: message.type,
            hasMedia: message.hasMedia
          }
        });
      }
    });

    client.on('message_create', (message) => {
      if (message.fromMe) {
        console.log(`Mensagem enviada na conexão ${connectionId}`);
        
        socketClient.emit('message_sent', {
          connectionId,
          message: {
            id: message.id._serialized,
            to: message.to,
            timestamp: message.timestamp,
            body: message.body,
            type: message.type
          }
        });
      }
    });

    // Inicializar o cliente
    await client.initialize();
    
    return client;
  } catch (error) {
    console.error(`Erro ao criar conexão ${connectionId}:`, error);
    connectionStates.set(connectionId, { status: 'error', qr: null, error: error.message });
    socketClient.emit('connection_status', {
      connectionId,
      status: 'error',
      error: error.message
    });
    throw error;
  }
}

// Socket.IO events
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  socket.on('create_connection', async (data) => {
    const { connectionId } = data;
    
    if (!connectionId) {
      socket.emit('error', { message: 'ID da conexão é obrigatório' });
      return;
    }

    try {
      await createWhatsAppConnection(connectionId, socket);
    } catch (error) {
      socket.emit('error', { 
        connectionId,
        message: 'Erro ao criar conexão: ' + error.message 
      });
    }
  });

  socket.on('disconnect_connection', async (data) => {
    const { connectionId } = data;
    
    if (activeConnections.has(connectionId)) {
      const client = activeConnections.get(connectionId);
      
      try {
        await client.logout();
        await client.destroy();
      } catch (error) {
        console.error(`Erro ao desconectar ${connectionId}:`, error);
      }
      
      activeConnections.delete(connectionId);
      connectionStates.delete(connectionId);
      
      console.log(`Conexão ${connectionId} desconectada manualmente`);
      socket.emit('connection_status', {
        connectionId,
        status: 'disconnected'
      });
    }
  });

  socket.on('send_message', async (data) => {
    const { connectionId, to, message } = data;
    
    if (!activeConnections.has(connectionId)) {
      socket.emit('error', { 
        message: 'Conexão não encontrada ou não está ativa' 
      });
      return;
    }

    try {
      const client = activeConnections.get(connectionId);
      const chatId = to.includes('@') ? to : `${to}@c.us`;
      
      const sentMessage = await client.sendMessage(chatId, message);
      
      socket.emit('message_sent', {
        connectionId,
        to: chatId,
        message,
        messageId: sentMessage.id._serialized,
        timestamp: Date.now()
      });
      
      console.log(`Mensagem enviada via ${connectionId} para ${chatId}`);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      socket.emit('error', { 
        message: 'Erro ao enviar mensagem: ' + error.message 
      });
    }
  });

  socket.on('send_media', async (data) => {
    const { connectionId, to, media, caption } = data;
    
    if (!activeConnections.has(connectionId)) {
      socket.emit('error', { 
        message: 'Conexão não encontrada ou não está ativa' 
      });
      return;
    }

    try {
      const client = activeConnections.get(connectionId);
      const chatId = to.includes('@') ? to : `${to}@c.us`;
      
      const sentMessage = await client.sendMessage(chatId, media, { caption });
      
      socket.emit('message_sent', {
        connectionId,
        to: chatId,
        media,
        caption,
        messageId: sentMessage.id._serialized,
        timestamp: Date.now()
      });
      
      console.log(`Mídia enviada via ${connectionId} para ${chatId}`);
    } catch (error) {
      console.error('Erro ao enviar mídia:', error);
      socket.emit('error', { 
        message: 'Erro ao enviar mídia: ' + error.message 
      });
    }
  });

  socket.on('get_connection_status', (data) => {
    const { connectionId } = data;
    const state = connectionStates.get(connectionId);
    
    socket.emit('connection_status', {
      connectionId,
      ...state
    });
  });

  socket.on('get_chats', async (data) => {
    const { connectionId } = data;
    
    if (!activeConnections.has(connectionId)) {
      socket.emit('error', { 
        message: 'Conexão não encontrada ou não está ativa' 
      });
      return;
    }

    try {
      const client = activeConnections.get(connectionId);
      const chats = await client.getChats();
      
      const chatList = chats.map(chat => ({
        id: chat.id._serialized,
        name: chat.name,
        isGroup: chat.isGroup,
        unreadCount: chat.unreadCount,
        lastMessage: chat.lastMessage ? {
          body: chat.lastMessage.body,
          timestamp: chat.lastMessage.timestamp,
          fromMe: chat.lastMessage.fromMe
        } : null
      }));

      socket.emit('chats_list', {
        connectionId,
        chats: chatList
      });
    } catch (error) {
      console.error('Erro ao obter chats:', error);
      socket.emit('error', { 
        message: 'Erro ao obter chats: ' + error.message 
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// API REST endpoints
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'webjs-service',
    activeConnections: activeConnections.size,
    timestamp: new Date().toISOString()
  });
});

app.get('/connections', (req, res) => {
  const connections = Array.from(connectionStates.entries()).map(([id, state]) => ({
    id,
    ...state
  }));
  
  res.json({ connections });
});

app.post('/connections/:id/disconnect', async (req, res) => {
  const connectionId = req.params.id;
  
  if (activeConnections.has(connectionId)) {
    const client = activeConnections.get(connectionId);
    
    try {
      await client.logout();
      await client.destroy();
      activeConnections.delete(connectionId);
      connectionStates.delete(connectionId);
      
      res.json({ message: 'Conexão desconectada com sucesso' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao desconectar: ' + error.message });
    }
  } else {
    res.status(404).json({ error: 'Conexão não encontrada' });
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Encerrando serviço WhatsApp Web.js...');
  
  // Desconectar todas as conexões ativas
  for (const [connectionId, client] of activeConnections) {
    try {
      await client.logout();
      await client.destroy();
      console.log(`Conexão ${connectionId} desconectada`);
    } catch (error) {
      console.error(`Erro ao desconectar ${connectionId}:`, error);
    }
  }
  
  server.close(() => {
    console.log('Serviço WhatsApp Web.js encerrado');
    process.exit(0);
  });
});

const PORT = process.env.WEBJS_PORT || 3002;
server.listen(PORT, () => {
  console.log(`🚀 Serviço WhatsApp Web.js rodando na porta ${PORT}`);
  console.log(`📱 Pronto para receber conexões WhatsApp`);
});
