const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const pino = require('pino');

// Carregar variáveis de ambiente
require('dotenv').config();

// Configurações e variáveis globais
const PORT = process.env.BAILEYS_PORT || process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const SESSION_ID = process.env.SESSION_ID || uuidv4();
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Logger
const logger = pino({
    level: NODE_ENV === 'development' ? 'debug' : 'info',
    transport: NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard'
        }
    } : undefined
});

// Express app
const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: FRONTEND_URL,
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Middleware
app.use(cors({
    origin: FRONTEND_URL,
    credentials: true
}));
app.use(express.json());

// Variáveis de estado
let sock = null;
let connectionStatus = 'disconnected';
let qrCodeData = null;
let isConnecting = false;

async function connectToWhatsApp() {
    if (isConnecting) {
        logger.warn('Conexão já em andamento');
        return;
    }

    try {
        isConnecting = true;
        connectionStatus = 'connecting';
        
        // Broadcast status para todos os clientes conectados
        if (io) {
            io.emit('connection_status', { 
                provider: 'baileys', 
                status: connectionStatus,
                timestamp: new Date().toISOString()
            });
        }

        logger.info('Iniciando conexão com WhatsApp via Baileys...');

        // Configurar autenticação multi-arquivo
        const authDir = `./auth_info_baileys_${SESSION_ID}`;
        const { state, saveCreds } = await useMultiFileAuthState(authDir);

        // Obter versão mais recente do Baileys
        const { version, isLatest } = await fetchLatestBaileysVersion();
        logger.info(`Usando Baileys v${version.join('.')}, é a mais recente: ${isLatest}`);

        // Criar socket do WhatsApp
        sock = makeWASocket({
            version,
            logger: logger.child({ module: 'baileys' }),
            printQRInTerminal: false, // Desabilitado para produção
            auth: state,
            browser: ['ChatVendas', 'Chrome', '1.0.0'],
            generateHighQualityLinkPreview: true,
            syncFullHistory: false,
            markOnlineOnConnect: true,
            defaultQueryTimeoutMs: 60000,
            connectTimeoutMs: 60000,
            keepAliveIntervalMs: 30000,
            emitOwnEvents: true
        });

        // Event listeners do Baileys
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            logger.info('Status da conexão:', { connection, lastDisconnect: lastDisconnect?.error?.message });

            if (qr) {
                try {
                    // Gerar QR Code em base64
                    qrCodeData = await QRCode.toDataURL(qr, {
                        width: 256,
                        margin: 2,
                        color: {
                            dark: '#000000',
                            light: '#FFFFFF'
                        }
                    });
                    
                    logger.info('QR Code gerado com sucesso');
                    
                    // Enviar QR Code para todos os clientes conectados
                    if (io) {
                        io.emit('qr_code', {
                            provider: 'baileys',
                            qrCode: qrCodeData,
                            timestamp: new Date().toISOString()
                        });
                    }
                    
                } catch (error) {
                    logger.error('Erro ao gerar QR Code:', error);
                    if (io) {
                        io.emit('error', {
                            provider: 'baileys',
                            message: 'Erro ao gerar QR Code',
                            error: error.message
                        });
                    }
                }
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
                
                connectionStatus = 'disconnected';
                qrCodeData = null;
                isConnecting = false;
                
                logger.info('Conexão fechada:', { shouldReconnect, reason: lastDisconnect?.error?.message });
                
                if (io) {
                    io.emit('connection_status', {
                        provider: 'baileys',
                        status: connectionStatus,
                        timestamp: new Date().toISOString()
                    });
                }

                if (shouldReconnect) {
                    logger.info('Tentando reconectar em 5 segundos...');
                    setTimeout(() => connectToWhatsApp(), 5000);
                } else {
                    logger.info('Usuário deslogado. Aguardando nova conexão...');
                }
            } else if (connection === 'open') {
                connectionStatus = 'connected';
                isConnecting = false;
                qrCodeData = null;
                
                logger.info('Conectado ao WhatsApp com sucesso!');
                
                if (io) {
                    io.emit('connection_status', {
                        provider: 'baileys',
                        status: connectionStatus,
                        timestamp: new Date().toISOString(),
                        user: sock.user
                    });
                }
            }
        });

        // Salvar credenciais quando atualizadas
        sock.ev.on('creds.update', saveCreds);

        // Event listener para mensagens recebidas
        sock.ev.on('messages.upsert', async (m) => {
            const messages = m.messages;
            
            for (const message of messages) {
                if (!message.key.fromMe && message.message) {
                    logger.info('Nova mensagem recebida:', {
                        from: message.key.remoteJid,
                        id: message.key.id
                    });
                    
                    // Emitir mensagem para clientes conectados
                    if (io) {
                        io.emit('new_message', {
                            provider: 'baileys',
                            message: {
                                id: message.key.id,
                                from: message.key.remoteJid,
                                timestamp: message.messageTimestamp,
                                content: message.message,
                                fromMe: message.key.fromMe
                            }
                        });
                    }
                }
            }
        });

    } catch (error) {
        logger.error('Erro ao conectar com WhatsApp:', error);
        connectionStatus = 'error';
        isConnecting = false;
        
        if (io) {
            io.emit('error', {
                provider: 'baileys',
                message: 'Erro na conexão',
                error: error.message
            });
        }
        
        // Tentar reconectar em 10 segundos
        setTimeout(() => connectToWhatsApp(), 10000);
    }
}

// Função para enviar mensagem
async function sendMessage(to, message) {
    if (!sock || connectionStatus !== 'connected') {
        throw new Error('WhatsApp não está conectado');
    }

    try {
        const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
        const result = await sock.sendMessage(jid, { text: message });
        
        logger.info('Mensagem enviada:', { to: jid, messageId: result.key.id });
        
        return {
            success: true,
            messageId: result.key.id,
            timestamp: result.messageTimestamp
        };
    } catch (error) {
        logger.error('Erro ao enviar mensagem:', error);
        throw error;
    }
}

// Rotas HTTP
app.get('/health', (req, res) => {
    res.json({
        service: 'baileys-service',
        status: connectionStatus,
        hasQrCode: !!qrCodeData,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: NODE_ENV
    });
});

app.get('/status', (req, res) => {
    res.json({
        provider: 'baileys',
        status: connectionStatus,
        qrCode: qrCodeData,
        user: sock?.user || null,
        timestamp: new Date().toISOString()
    });
});

app.post('/send-message', async (req, res) => {
    try {
        const { to, message } = req.body;
        
        if (!to || !message) {
            return res.status(400).json({
                success: false,
                error: 'Parâmetros "to" e "message" são obrigatórios'
            });
        }

        const result = await sendMessage(to, message);
        
        // Emitir evento de mensagem enviada
        if (io) {
            io.emit('message_sent', {
                provider: 'baileys',
                to,
                message,
                result
            });
        }
        
        res.json(result);
    } catch (error) {
        logger.error('Erro na rota send-message:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/disconnect', async (req, res) => {
    try {
        if (sock) {
            await sock.logout();
            sock = null;
        }
        
        connectionStatus = 'disconnected';
        qrCodeData = null;
        isConnecting = false;
        
        if (io) {
            io.emit('connection_status', {
                provider: 'baileys',
                status: connectionStatus,
                timestamp: new Date().toISOString()
            });
        }
        
        res.json({ success: true, message: 'Desconectado com sucesso' });
    } catch (error) {
        logger.error('Erro ao desconectar:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Socket.IO event handlers
io.on('connection', (socket) => {
    logger.info('Cliente conectado via Socket.IO:', socket.id);
    
    // Enviar status atual para o cliente recém-conectado
    socket.emit('connection_status', {
        provider: 'baileys',
        status: connectionStatus,
        timestamp: new Date().toISOString()
    });
    
    // Se há QR Code disponível, enviar para o cliente
    if (qrCodeData) {
        socket.emit('qr_code', {
            provider: 'baileys',
            qrCode: qrCodeData,
            timestamp: new Date().toISOString()
        });
    }
    
    // Handler para iniciar conexão
    socket.on('connect_whatsapp', () => {
        logger.info('Solicitação de conexão recebida via Socket.IO');
        if (connectionStatus === 'disconnected' && !isConnecting) {
            connectToWhatsApp();
        }
    });
    
    // Handler para desconectar
    socket.on('disconnect_whatsapp', async () => {
        logger.info('Solicitação de desconexão recebida via Socket.IO');
        try {
            if (sock) {
                await sock.logout();
                sock = null;
            }
            connectionStatus = 'disconnected';
            qrCodeData = null;
            isConnecting = false;
            
            io.emit('connection_status', {
                provider: 'baileys',
                status: connectionStatus,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error('Erro ao desconectar via Socket.IO:', error);
        }
    });
    
    // Handler para enviar mensagem
    socket.on('send_message', async (data) => {
        try {
            const { to, message } = data;
            const result = await sendMessage(to, message);
            
            socket.emit('message_sent', {
                provider: 'baileys',
                to,
                message,
                result
            });
        } catch (error) {
            socket.emit('error', {
                provider: 'baileys',
                message: 'Erro ao enviar mensagem',
                error: error.message
            });
        }
    });
    
    socket.on('disconnect', () => {
        logger.info('Cliente desconectado via Socket.IO:', socket.id);
    });
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
    logger.error('Erro não capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Promise rejeitada não tratada:', { reason, promise });
});

// Graceful shutdown
process.on('SIGINT', async () => {
    logger.info('Recebido SIGINT, encerrando graciosamente...');
    
    if (sock) {
        try {
            await sock.logout();
        } catch (error) {
            logger.error('Erro ao desconectar durante shutdown:', error);
        }
    }
    
    server.close(() => {
        logger.info('Servidor HTTP fechado');
        process.exit(0);
    });
});

process.on('SIGTERM', async () => {
    logger.info('Recebido SIGTERM, encerrando graciosamente...');
    
    if (sock) {
        try {
            await sock.logout();
        } catch (error) {
            logger.error('Erro ao desconectar durante shutdown:', error);
        }
    }
    
    server.close(() => {
        logger.info('Servidor HTTP fechado');
        process.exit(0);
    });
});

// Iniciar servidor
server.listen(PORT, '0.0.0.0', () => {
    logger.info(`🚀 Baileys Service rodando na porta ${PORT}`);
    logger.info(`📱 Ambiente: ${NODE_ENV}`);
    logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
    
    // Iniciar conexão automaticamente
    setTimeout(() => {
        logger.info('Iniciando conexão automática com WhatsApp...');
        connectToWhatsApp();
    }, 2000);
});

module.exports = { app, server, io };
