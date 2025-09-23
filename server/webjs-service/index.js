require('dotenv').config();
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173"
}));
app.use(express.json());

// Armazenamento de conexões ativas
const activeConnections = new Map();

// Classe para gerenciar conexões WhatsApp
class WebJSConnection {
  constructor(connectionId, socket) {
    this.connectionId = connectionId;
    this.socket = socket;
    this.client = null;
    this.status = 'initializing';
    this.phoneNumber = null;
    this.qrCode = null;
  }

  async connect() {
    try {
      this.client = new Client({
        authStrategy: new LocalAuth({
          clientId: `webjs_${this.connectionId}`
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

      this.setupEventListeners();
      await this.client.initialize();
      
    } catch (error) {
      console.error('Erro ao conectar:', error);
      this.emitStatus('error', error.message);
    }
  }

  setupEventListeners() {
    this.client.on('qr', (qr) => {
      console.log(`QR Code gerado para conexão ${this.connectionId}`);
      this.qrCode = qr;
      this.emitQRCode(qr);
      
      // Mostrar QR no terminal para debug (opcional)
      if (process.env.NODE_ENV === 'development') {
        qrcode.generate(qr, { small: true });
      }
    });

    this.client.on('authenticated', () => {
      console.log(`Conexão ${this.connectionId} autenticada`);
      this.status = 'authenticated';
      this.emitStatus('authenticated');
    });

    this.client.on('ready', () => {
      console.log(`Cliente ${this.connectionId} está pronto!`);
      this.status = 'connected';
      this.phoneNumber = this.client.info?.wid?.user;
      this.emitStatus('connected');
    });

    this.client.on('auth_failure', (msg) => {
      console.error(`Falha na autenticação ${this.connectionId}:`, msg);
      this.status = 'error';
      this.emitStatus('error', 'Falha na autenticação');
    });

    this.client.on('disconnected', (reason) => {
      console.log(`Cliente ${this.connectionId} desconectado:`, reason);
      this.status = 'disconnected';
      this.emitStatus('disconnected', reason);
    });

    this.client.on('message', async (msg) => {
      if (!msg.fromMe) {
        const contact = await msg.getContact();
        const chat = await msg.getChat();
        
        this.emitNewMessage({
          id: msg.id._serialized,
          from: msg.from,
          fromName: contact.pushname || contact.name || msg.from,
          timestamp: msg.timestamp * 1000,
          body: msg.body,
          type: this.getMessageType(msg),
          hasMedia: msg.hasMedia,
          chatName: chat.name || contact.name || msg.from
        });
      }
    });

    this.client.on('message_create', (msg) => {
      if (msg.fromMe) {
        this.emitMessageSent({
          id: msg.id._serialized,
          to: msg.to,
          body: msg.body,
          timestamp: msg.timestamp * 1000
        });
      }
    });
  }

  getMessageType(msg) {
    if (msg.hasMedia) {
      if (msg.type === 'image') return 'image';
      if (msg.type === 'video') return 'video';
      if (msg.type === 'audio' || msg.type === 'ptt') return 'audio';
      if (msg.type === 'document') return 'document';
      return 'media';
    }
    return 'text';
  }

  async sendMessage(to, text) {
    if (!this.client || this.status !== 'connected') {
      throw new Error('WhatsApp não conectado');
    }

    try {
      const result = await this.client.sendMessage(to, text);
      this.emitMessageSent({
        id: result.id._serialized,
        to,
        body: text,
        timestamp: Date.now()
      });
      return result;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  async getChats() {
    if (!this.client || this.status !== 'connected') {
      throw new Error('WhatsApp não conectado');
    }

    try {
      const chats = await this.client.getChats();
      return chats.map(chat => ({
        id: chat.id._serialized,
        name: chat.name,
        isGroup: chat.isGroup,
        unreadCount: chat.unreadCount,
        lastMessage: chat.lastMessage ? {
          body: chat.lastMessage.body,
          timestamp: chat.lastMessage.timestamp * 1000,
          fromMe: chat.lastMessage.fromMe
        } : null
      }));
    } catch (error) {
      console.error('Erro ao buscar chats:', error);
      throw error;
    }
  }

  emitQRCode(qr) {
    this.socket.emit('qr_code', {
      connectionId: this.connectionId,
      qr,
      provider: 'web.js'
    });
  }

  emitStatus(status, reason = null) {
    this.status = status;
    this.socket.emit('connection_status', {
      connectionId: this.connectionId,
      status,
      phoneNumber: this.phoneNumber,
      reason,
      provider: 'web.js'
    });
  }

  emitNewMessage(message) {
    this.socket.emit('new_message', {
      connectionId: this.connectionId,
      message,
      provider: 'web.js'
    });
  }

  emitMessageSent(message) {
    this.socket.emit('message_sent', {
      connectionId: this.connectionId,
      message,
      provider: 'web.js'
    });
  }

  emitChatsList(chats) {
    this.socket.emit('chats_list', {
      connectionId: this.connectionId,
      chats,
      provider: 'web.js'
    });
  }

  async disconnect() {
    if (this.client) {
      await this.client.destroy();
    }
    this.status = 'disconnected';
  }
}

// Socket.IO Events
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  socket.on('create_connection', (data) => {
    const connectionId = data.connectionId || uuidv4();
    const connection = new WebJSConnection(connectionId, socket);
    activeConnections.set(connectionId, connection);
    connection.connect();
    
    socket.emit('connection_created', { connectionId, provider: 'web.js' });
  });

  socket.on('disconnect_connection', async (data) => {
    const connection = activeConnections.get(data.connectionId);
    if (connection) {
      await connection.disconnect();
      activeConnections.delete(data.connectionId);
    }
  });

  socket.on('send_message', async (data) => {
    const connection = activeConnections.get(data.connectionId);
    if (connection) {
      try {
        await connection.sendMessage(data.to, data.message);
      } catch (error) {
        socket.emit('error', {
          connectionId: data.connectionId,
          error: error.message,
          provider: 'web.js'
        });
      }
    }
  });

  socket.on('get_chats', async (data) => {
    const connection = activeConnections.get(data.connectionId);
    if (connection) {
      try {
        const chats = await connection.getChats();
        connection.emitChatsList(chats);
      } catch (error) {
        socket.emit('error', {
          connectionId: data.connectionId,
          error: error.message,
          provider: 'web.js'
        });
      }
    }
  });

  socket.on('get_connection_status', (data) => {
    const connection = activeConnections.get(data.connectionId);
    if (connection) {
      socket.emit('connection_status', {
        connectionId: data.connectionId,
        status: connection.status,
        phoneNumber: connection.phoneNumber,
        provider: 'web.js'
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// REST API Endpoints
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'webjs-service',
    connections: activeConnections.size,
    timestamp: new Date().toISOString()
  });
});

app.get('/connections', (req, res) => {
  const connections = Array.from(activeConnections.entries()).map(([id, conn]) => ({
    connectionId: id,
    status: conn.status,
    phoneNumber: conn.phoneNumber
  }));
  res.json({ connections });
});

app.post('/connections', (req, res) => {
  const connectionId = uuidv4();
  // Para REST API, precisamos de um socket mock ou usar eventos globais
  res.json({ 
    connectionId, 
    message: 'Use Socket.IO para criar conexões ativas',
    provider: 'web.js'
  });
});

app.delete('/connections/:connectionId', async (req, res) => {
  const { connectionId } = req.params;
  const connection = activeConnections.get(connectionId);
  
  if (connection) {
    await connection.disconnect();
    activeConnections.delete(connectionId);
    res.json({ message: 'Conexão desconectada com sucesso' });
  } else {
    res.status(404).json({ error: 'Conexão não encontrada' });
  }
});

app.get('/connections/:connectionId/chats', async (req, res) => {
  const { connectionId } = req.params;
  const connection = activeConnections.get(connectionId);
  
  if (!connection) {
    return res.status(404).json({ error: 'Conexão não encontrada' });
  }

  try {
    const chats = await connection.getChats();
    res.json({ chats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.WEBJS_PORT || 3002;
server.listen(PORT, () => {
  console.log(`🚀 Serviço WhatsApp Web.js rodando na porta ${PORT}`);
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`🔗 Socket.IO disponível em: http://localhost:${PORT}`);
});
