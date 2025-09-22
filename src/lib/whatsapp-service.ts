import { io, Socket } from 'socket.io-client';

export interface WhatsAppMessage {
  id: string;
  from: string;
  fromName?: string;
  timestamp: number;
  body: string;
  type: string;
  hasMedia?: boolean;
}

export interface ConnectionStatus {
  connectionId: string;
  status: 'initializing' | 'qr_ready' | 'authenticated' | 'connected' | 'disconnected' | 'error' | 'reconnecting';
  qr?: string;
  phoneNumber?: string;
  error?: string;
  reason?: string;
}

export type ApiProvider = 'baileys' | 'web.js';

class WhatsAppService {
  private baileysSocket: Socket | null = null;
  private webjsSocket: Socket | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.initializeSockets();
  }

  private initializeSockets() {
    // Conectar ao serviço Baileys
    this.baileysSocket = io(process.env.VITE_BAILEYS_URL || 'http://localhost:3001', {
      autoConnect: false
    });

    // Conectar ao serviço WhatsApp Web.js
    this.webjsSocket = io(process.env.VITE_WEBJS_URL || 'http://localhost:3002', {
      autoConnect: false
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Eventos do Baileys
    if (this.baileysSocket) {
      this.baileysSocket.on('qr_code', (data) => {
        this.emit('qr_code', { ...data, provider: 'baileys' });
      });

      this.baileysSocket.on('connection_status', (data) => {
        this.emit('connection_status', { ...data, provider: 'baileys' });
      });

      this.baileysSocket.on('new_message', (data) => {
        this.emit('new_message', { ...data, provider: 'baileys' });
      });

      this.baileysSocket.on('message_sent', (data) => {
        this.emit('message_sent', { ...data, provider: 'baileys' });
      });

      this.baileysSocket.on('error', (data) => {
        this.emit('error', { ...data, provider: 'baileys' });
      });
    }

    // Eventos do WhatsApp Web.js
    if (this.webjsSocket) {
      this.webjsSocket.on('qr_code', (data) => {
        this.emit('qr_code', { ...data, provider: 'web.js' });
      });

      this.webjsSocket.on('connection_status', (data) => {
        this.emit('connection_status', { ...data, provider: 'web.js' });
      });

      this.webjsSocket.on('new_message', (data) => {
        this.emit('new_message', { ...data, provider: 'web.js' });
      });

      this.webjsSocket.on('message_sent', (data) => {
        this.emit('message_sent', { ...data, provider: 'web.js' });
      });

      this.webjsSocket.on('chats_list', (data) => {
        this.emit('chats_list', { ...data, provider: 'web.js' });
      });

      this.webjsSocket.on('error', (data) => {
        this.emit('error', { ...data, provider: 'web.js' });
      });
    }
  }

  private getSocket(provider: ApiProvider): Socket | null {
    return provider === 'baileys' ? this.baileysSocket : this.webjsSocket;
  }

  private emit(event: string, data: any) {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(listener => listener(data));
  }

  // Métodos públicos
  connect(provider: ApiProvider) {
    const socket = this.getSocket(provider);
    if (socket && !socket.connected) {
      socket.connect();
    }
  }

  disconnect(provider: ApiProvider) {
    const socket = this.getSocket(provider);
    if (socket && socket.connected) {
      socket.disconnect();
    }
  }

  createConnection(provider: ApiProvider, connectionId: string) {
    const socket = this.getSocket(provider);
    if (socket) {
      if (!socket.connected) {
        socket.connect();
      }
      socket.emit('create_connection', { connectionId });
    }
  }

  disconnectConnection(provider: ApiProvider, connectionId: string) {
    const socket = this.getSocket(provider);
    if (socket) {
      socket.emit('disconnect_connection', { connectionId });
    }
  }

  sendMessage(provider: ApiProvider, connectionId: string, to: string, message: string) {
    const socket = this.getSocket(provider);
    if (socket) {
      socket.emit('send_message', { connectionId, to, message });
    }
  }

  sendMedia(provider: ApiProvider, connectionId: string, to: string, media: any, caption?: string) {
    const socket = this.getSocket(provider);
    if (socket && provider === 'web.js') {
      socket.emit('send_media', { connectionId, to, media, caption });
    }
  }

  getConnectionStatus(provider: ApiProvider, connectionId: string) {
    const socket = this.getSocket(provider);
    if (socket) {
      socket.emit('get_connection_status', { connectionId });
    }
  }

  getChats(provider: ApiProvider, connectionId: string) {
    const socket = this.getSocket(provider);
    if (socket && provider === 'web.js') {
      socket.emit('get_chats', { connectionId });
    }
  }

  // Event listeners
  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Verificar status dos serviços
  async checkServiceHealth(provider: ApiProvider): Promise<boolean> {
    try {
      const baseUrl = provider === 'baileys' 
        ? (process.env.VITE_BAILEYS_URL || 'http://localhost:3001')
        : (process.env.VITE_WEBJS_URL || 'http://localhost:3002');
      
      const response = await fetch(`${baseUrl}/health`);
      return response.ok;
    } catch (error) {
      console.error(`Erro ao verificar saúde do serviço ${provider}:`, error);
      return false;
    }
  }

  // Cleanup
  destroy() {
    if (this.baileysSocket) {
      this.baileysSocket.disconnect();
      this.baileysSocket = null;
    }
    if (this.webjsSocket) {
      this.webjsSocket.disconnect();
      this.webjsSocket = null;
    }
    this.eventListeners.clear();
  }
}

// Singleton instance
export const whatsappService = new WhatsAppService();