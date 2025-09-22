const express = require('express');
const { Server } = require('socket.io');
const http = require('http');
const cors = require('cors');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
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

// Logger configurado
const logger = pino({ 
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
});

// Função para criar uma nova conexão WhatsApp
async function createWhatsAppConnection(connectionId, socketClient) {
  try {
    logger.info(`Iniciando conexão Baileys para: ${connectionId}`);
    
    const authDir = path.join(__dirname, 'auth_sessions', connectionId);
    await fs.ensureDir(authDir);
    
    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      auth: state,
      generateHighQualityLinkPreview: true,
      syncFullHistory: false,
      markOnlineOnConnect: true,
    });

    // Armazenar a conexão
    activeConnections.set(connectionId, sock);
    connectionStates.set(connectionId, { status: 'connecting', qr: null });

    // Event listeners
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
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
          
          logger.info(`QR Code gerado para conexão: ${connectionId}`);
        } catch (err) {
          logger.error('Erro ao gerar QR Code:', err);
        }
      }

      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        
        logger.info(`Conexão fechada para ${connectionId}:`, {
          reason: lastDisconnect?.error?.output?.statusCode,
          shouldReconnect
        });

        connectionStates.set(connectionId, { 
          status: shouldReconnect ? 'reconnecting' : 'disconnected',
          qr: null 
        });

        socketClient.emit('connection_status', {
          connectionId,
          status: shouldReconnect ? 'reconnecting' : 'disconnected'
        });

        if (shouldReconnect) {
          setTimeout(() => {
            createWhatsAppConnection(connectionId, socketClient);
          }, 5000);
        } else {
          activeConnections.delete(connectionId);
          connectionStates.delete(connectionId);
        }
      } else if (connection === 'open') {
        logger.info(`Conexão estabelecida para: ${connectionId}`);
        
        const phoneNumber = sock.user?.id?.split(':')[0];
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
      }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', (messageUpdate) => {
      const messages = messageUpdate.messages;
      
      messages.forEach(message => {
        if (!message.key.fromMe && message.message) {
          logger.info(`Nova mensagem recebida na conexão ${connectionId}`);
          
          // Enviar mensagem para o frontend
          socketClient.emit('new_message', {
            connectionId,
            message: {
              id: message.key.id,
              from: message.key.remoteJid,
              timestamp: message.messageTimestamp,
              body: message.message.conversation || 
                    message.message.extendedTextMessage?.text || 
                    '[Mídia]'
            }
          });
        }
      });
    });

    return sock;
  } catch (error) {
    logger.error(`Erro ao criar conexão ${connectionId}:`, error);
    connectionStates.set(connectionId, { status: 'error', qr: null });
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
  logger.info('Cliente conectado:', socket.id);

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

  socket.on('disconnect_connection', (data) => {
    const { connectionId } = data;
    
    if (activeConnections.has(connectionId)) {
      const sock = activeConnections.get(connectionId);
      sock.logout();
      activeConnections.delete(connectionId);
      connectionStates.delete(connectionId);
      
      logger.info(`Conexão ${connectionId} desconectada manualmente`);
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
      const sock = activeConnections.get(connectionId);
      const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
      
      await sock.sendMessage(jid, { text: message });
      
      socket.emit('message_sent', {
        connectionId,
        to: jid,
        message,
        timestamp: Date.now()
      });
      
      logger.info(`Mensagem enviada via ${connectionId} para ${jid}`);
    } catch (error) {
      logger.error('Erro ao enviar mensagem:', error);
      socket.emit('error', { 
        message: 'Erro ao enviar mensagem: ' + error.message 
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

  socket.on('disconnect', () => {
    logger.info('Cliente desconectado:', socket.id);
  });
});

// API REST endpoints
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'baileys-service',
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

app.post('/connections/:id/disconnect', (req, res) => {
  const connectionId = req.params.id;
  
  if (activeConnections.has(connectionId)) {
    const sock = activeConnections.get(connectionId);
    sock.logout();
    activeConnections.delete(connectionId);
    connectionStates.delete(connectionId);
    
    res.json({ message: 'Conexão desconectada com sucesso' });
  } else {
    res.status(404).json({ error: 'Conexão não encontrada' });
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Encerrando serviço Baileys...');
  
  // Desconectar todas as conexões ativas
  for (const [connectionId, sock] of activeConnections) {
    try {
      await sock.logout();
      logger.info(`Conexão ${connectionId} desconectada`);
    } catch (error) {
      logger.error(`Erro ao desconectar ${connectionId}:`, error);
    }
  }
  
  server.close(() => {
    logger.info('Serviço Baileys encerrado');
    process.exit(0);
  });
});

const PORT = process.env.BAILEYS_PORT || 3001;
server.listen(PORT, () => {
  logger.info(`🚀 Serviço Baileys rodando na porta ${PORT}`);
  logger.info(`📱 Pronto para receber conexões WhatsApp`);
});
