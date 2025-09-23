require('dotenv').config();
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');

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
class BaileysConnection {
  constructor(connectionId, socket) {
    this.connectionId = connectionId;
    this.socket = socket;
    this.whatsappSocket = null;
    this.status = 'initializing';
    this.phoneNumber = null;
    this.qrCode = null;
  }

  async connect() {
    try {
      const { state, saveCreds } = await useMultiFileAuthState(`auth_info_baileys_${this.connectionId}`);

      this.whatsappSocket = makeWASocket({
        logger: pino({ level: process.env.LOG_LEVEL || 'silent' }),
        printQRInTerminal: false,
        auth: state,
      });

      this.setupEventListeners(saveCreds);
      
    } catch (error) {
      console.error('Erro ao conectar:', error);
      this.emitStatus('error', error.message);
    }
  }

  setupEventListeners(saveCreds) {
    this.whatsappSocket.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        this.qrCode = qr;
        this.emitQRCode(qr);
      }

      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log(`Conexão ${this.connectionId} fechada:`, lastDisconnect?.error, ', reconectando:', shouldReconnect);
        
        if (shouldReconnect) {
          this.status = 'reconnecting';
          this.emitStatus('reconnecting');
          setTimeout(() => this.connect(), 3000);
        } else {
          this.status = 'disconnected';
          this.emitStatus('disconnected', 'Deslogado');
        }
      } else if (connection === 'open') {
        this.status = 'connected';
        this.phoneNumber = this.whatsappSocket.user?.id?.split(':')[0];
        this.emitStatus('connected');
        console.log(`Conexão ${this.connectionId} estabelecida`);
      }
    });

    this.whatsappSocket.ev.on('creds.update', saveCreds);

    this.whatsappSocket.ev.on('messages.upsert', (m) => {
      const messages = m.messages || [];
      messages.forEach(msg => {
        if (!msg.key.fromMe && msg.message) {
          this.emitNewMessage({
            id: msg.key.id,
            from: msg.key.remoteJid,
            fromName: msg.pushName || msg.key.remoteJid,
            timestamp: msg.messageTimestamp * 1000,
            body: this.extractMessageText(msg.message),
            type: this.getMessageType(msg.message),
            hasMedia: this.hasMedia(msg.message)
          });
        }
      });
    });
  }

  extractMessageText(message) {
    if (message.conversation) return message.conversation;
    if (message.extendedTextMessage) return message.extendedTextMessage.text;
    if (message.imageMessage) return message.imageMessage.caption || '[Imagem]';
    if (message.videoMessage) return message.videoMessage.caption || '[Vídeo]';
    if (message.documentMessage) return message.documentMessage.caption || '[Documento]';
    if (message.audioMessage) return '[Áudio]';
    return '[Mensagem não suportada]';
  }

  getMessageType(message) {
    if (message.conversation || message.extendedTextMessage) return 'text';
    if (message.imageMessage) return 'image';
    if (message.videoMessage) return 'video';
    if (message.documentMessage) return 'document';
    if (message.audioMessage) return 'audio';
    return 'unknown';
  }

  hasMedia(message) {
    return !!(message.imageMessage || message.videoMessage || message.documentMessage || message.audioMessage);
  }

  async sendMessage(to, text) {
    if (!this.whatsappSocket || this.status !== 'connected') {
      throw new Error('WhatsApp não conectado');
    }

    try {
      const result = await this.whatsappSocket.sendMessage(to, { text });
      this.emitMessageSent({
        id: result.key.id,
        to,
        text,
        timestamp: Date.now()
      });
      return result;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  emitQRCode(qr) {
    this.socket.emit('qr_code', {
      connectionId: this.connectionId,
      qr,
      provider: 'baileys'
    });
  }

  emitStatus(status, reason = null) {
    this.status = status;
    this.socket.emit('connection_status', {
      connectionId: this.connectionId,
      status,
      phoneNumber: this.phoneNumber,
      reason,
      provider: 'baileys'
    });
  }

  emitNewMessage(message) {
    this.socket.emit('new_message', {
      connectionId: this.connectionId,
      message,
      provider: 'baileys'
    });
  }

  emitMessageSent(message) {
    this.socket.emit('message_sent', {
      connectionId: this.connectionId,
      message,
      provider: 'baileys'
    });
  }

  disconnect() {
    if (this.whatsappSocket) {
      this.whatsappSocket.end();
    }
    this.status = 'disconnected';
  }
}

// Socket.IO Events
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  socket.on('create_connection', (data) => {
    const connectionId = data.connectionId || uuidv4();
    const connection = new BaileysConnection(connectionId, socket);
    activeConnections.set(connectionId, connection);
    connection.connect();
    
    socket.emit('connection_created', { connectionId, provider: 'baileys' });
  });

  socket.on('disconnect_connection', (data) => {
    const connection = activeConnections.get(data.connectionId);
    if (connection) {
      connection.disconnect();
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
          provider: 'baileys'
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
        provider: 'baileys'
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
    service: 'baileys-service',
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
    provider: 'baileys'
  });
});

app.delete('/connections/:connectionId', (req, res) => {
  const { connectionId } = req.params;
  const connection = activeConnections.get(connectionId);
  
  if (connection) {
    connection.disconnect();
    activeConnections.delete(connectionId);
    res.json({ message: 'Conexão desconectada com sucesso' });
  } else {
    res.status(404).json({ error: 'Conexão não encontrada' });
  }
});

const PORT = process.env.BAILEYS_PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Serviço Baileys rodando na porta ${PORT}`);
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`🔗 Socket.IO disponível em: http://localhost:${PORT}`);
});
