const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const pino = require('pino');
require('dotenv').config();

// Configuração do logger
const logger = pino({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    transport: process.env.NODE_ENV !== 'production' ? {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname'
        }
    } : undefined
});

// Configurações
const PORT = process.env.WEBJS_PORT || 3003; // Mudando para 3003 para evitar conflito
const NODE_ENV = process.env.NODE_ENV || 'development';
const SESSION_ID = process.env.SESSION_ID || uuidv4();

// Estado da aplicação
let client = null;
let qrCodeData = null;
let connectionStatus = 'disconnected';
let isConnecting = false;

// Criar aplicação Express
const app = express();
const server = createServer(app);

// Configurar CORS
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? [process.env.FRONTEND_URL, process.env.VITE_SUPABASE_URL].filter(Boolean)
        : true,
    methods: ['GET', 'POST'],
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Configurar Socket.IO
const io = new Server(server, {
    cors: corsOptions,
    transports: ['websocket', 'polling']
});

// Função para conectar ao WhatsApp
async function connectToWhatsApp() {
    if (isConnecting) {
        logger.warn('Conexão já em andamento');
        return;
    }

    try {
        isConnecting = true;
        connectionStatus = 'connecting';
        
        // Broadcast status para todos os clientes conectados
        io.emit('connection_status', { 
            provider: 'webjs', 
            status: connectionStatus,
            timestamp: new Date().toISOString()
        });

        logger.info('Iniciando conexão com WhatsApp via Web.js...');

        // Criar cliente WhatsApp Web.js
        client = new Client({
            authStrategy: new LocalAuth({
                clientId: `webjs_${SESSION_ID}`,
                dataPath: './.wwebjs_auth'
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
            },
            webVersionCache: {
                type: 'remote',
                remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
            }
        });

        // Event listener para QR Code
        client.on('qr', async (qr) => {
            try {
                logger.info('QR Code recebido');
                
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
                io.emit('qr_code', {
                    provider: 'webjs',
                    qrCode: qrCodeData,
                    timestamp: new Date().toISOString()
                });
                
            } catch (error) {
                logger.error('Erro ao gerar QR Code:', error);
                io.emit('error', {
                    provider: 'webjs',
                    message: 'Erro ao gerar QR Code',
                    error: error.message
                });
            }
        });

        // Event listener para quando o cliente está pronto
        client.on('ready', () => {
            connectionStatus = 'connected';
            isConnecting = false;
            qrCodeData = null;
            
            logger.info('Cliente Web.js conectado com sucesso!');
            
            io.emit('connection_status', {
                provider: 'webjs',
                status: connectionStatus,
                timestamp: new Date().toISOString(),
                user: {
                    id: client.info?.wid?.user,
                    name: client.info?.pushname
                }
            });
        });

        // Event listener para autenticação
        client.on('authenticated', () => {
            logger.info('Cliente autenticado');
        });

        // Event listener para falha na autenticação
        client.on('auth_failure', (msg) => {
            logger.error('Falha na autenticação:', msg);
            connectionStatus = 'error';
            isConnecting = false;
            
            io.emit('error', {
                provider: 'webjs',
                message: 'Falha na autenticação',
                error: msg
            });
        });

        // Event listener para desconexão
        client.on('disconnected', (reason) => {
            logger.info('Cliente desconectado:', reason);
            connectionStatus = 'disconnected';
            qrCodeData = null;
            isConnecting = false;
            
            io.emit('connection_status', {
                provider: 'webjs',
                status: connectionStatus,
                timestamp: new Date().toISOString()
            });

            // Tentar reconectar em 5 segundos
            if (reason !== 'LOGOUT') {
                logger.info('Tentando reconectar em 5 segundos...');
                setTimeout(() => connectToWhatsApp(), 5000);
            }
        });

        // Event listener para mensagens recebidas
        client.on('message', async (message) => {
            if (!message.fromMe) {
                logger.info('Nova mensagem recebida:', {
                    from: message.from,
                    id: message.id._serialized
                });
                
                // Emitir mensagem para clientes conectados
                io.emit('new_message', {
                    provider: 'webjs',
                    message: {
                        id: message.id._serialized,
                        from: message.from,
                        to: message.to,
                        body: message.body,
                        timestamp: message.timestamp,
                        fromMe: message.fromMe,
                        hasMedia: message.hasMedia,
                        type: message.type
                    }
                });
            }
        });

        // Event listener para mudanças de estado
        client.on('change_state', (state) => {
            logger.info('Estado mudou para:', state);
        });

        // Inicializar cliente
        await client.initialize();

    } catch (error) {
        logger.error('Erro ao conectar com WhatsApp:', error);
        connectionStatus = 'error';
        isConnecting = false;
        
        io.emit('error', {
            provider: 'webjs',
            message: 'Erro na conexão',
            error: error.message
        });
        
        // Tentar reconectar em 10 segundos
        setTimeout(() => connectToWhatsApp(), 10000);
    }
}

// Função para enviar mensagem
async function sendMessage(to, message) {
    if (!client || connectionStatus !== 'connected') {
        throw new Error('WhatsApp não está conectado');
    }

    try {
        const chatId = to.includes('@') ? to : `${to}@c.us`;
        const result = await client.sendMessage(chatId, message);
        
        logger.info('Mensagem enviada:', { to: chatId, messageId: result.id._serialized });
        
        return {
            success: true,
            messageId: result.id._serialized,
            timestamp: result.timestamp
        };
    } catch (error) {
        logger.error('Erro ao enviar mensagem:', error);
        throw error;
    }
}

// Rotas HTTP
app.get('/health', (req, res) => {
    res.json({
        service: 'webjs-service',
        status: connectionStatus,
        hasQrCode: !!qrCodeData,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: NODE_ENV
    });
});

app.get('/status', (req, res) => {
    res.json({
        provider: 'webjs',
        status: connectionStatus,
        qrCode: qrCodeData,
        user: client?.info ? {
            id: client.info.wid?.user,
            name: client.info.pushname
        } : null,
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
        io.emit('message_sent', {
            provider: 'webjs',
            to,
            message,
            result
        });
        
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
        if (client) {
            await client.logout();
            await client.destroy();
            client = null;
        }
        
        connectionStatus = 'disconnected';
        qrCodeData = null;
        isConnecting = false;
        
        io.emit('connection_status', {
            provider: 'webjs',
            status: connectionStatus,
            timestamp: new Date().toISOString()
        });
        
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
        provider: 'webjs',
        status: connectionStatus,
        timestamp: new Date().toISOString()
    });
    
    // Se há QR Code disponível, enviar para o cliente
    if (qrCodeData) {
        socket.emit('qr_code', {
            provider: 'webjs',
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
            if (client) {
                await client.logout();
                await client.destroy();
                client = null;
            }
            connectionStatus = 'disconnected';
            qrCodeData = null;
            isConnecting = false;
            
            io.emit('connection_status', {
                provider: 'webjs',
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
                provider: 'webjs',
                to,
                message,
                result
            });
        } catch (error) {
            socket.emit('error', {
                provider: 'webjs',
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
    console.error('Erro não capturado:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Promise rejeitada não tratada:', reason);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    logger.info('Recebido SIGINT, encerrando graciosamente...');
    
    if (client) {
        try {
            await client.logout();
            await client.destroy();
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
    
    if (client) {
        try {
            await client.logout();
            await client.destroy();
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
    logger.info(`🚀 Web.js Service rodando na porta ${PORT}`);
    logger.info(`📱 Ambiente: ${NODE_ENV}`);
    logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
    
    // Iniciar conexão automaticamente
    setTimeout(() => {
        logger.info('Iniciando conexão automática com WhatsApp...');
        connectToWhatsApp();
    }, 2000);
});

module.exports = { app, server, io };
