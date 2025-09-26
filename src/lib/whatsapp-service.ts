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

export interface QRCodeData {
  connectionId: string;
  qr: string;
  provider: 'baileys' | 'web.js';
}

export interface MessageData {
  id: string;
  from: string;
  to: string;
  body: string;
  timestamp: number;
  type: string;
  provider: 'baileys' | 'web.js';
}

export interface ServiceResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export type ApiProvider = 'baileys' | 'web.js';

class WhatsAppService {
  private baileysSocket: Socket | null = null;
  private webjsSocket: Socket | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.initializeSockets();
  }

  private initializeSockets(): void {
    // Conectar ao serviço Baileys
    this.baileysSocket = io(import.meta.env.VITE_BAILEYS_URL || 'http://localhost:3001', {
      autoConnect: false
    });

    // Conectar ao serviço WhatsApp Web.js
    this.webjsSocket = io(import.meta.env.VITE_WEBJS_URL || 'http://localhost:3003', {
      autoConnect: false
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Eventos do Baileys
    if (this.baileysSocket) {
      this.baileysSocket.on('qr_code', (data: QRCodeData) => {
        this.emit('qr_code', { ...data, provider: 'baileys' });
      });

      this.baileysSocket.on('connection_status', (data: ConnectionStatus) => {
        this.emit('connection_status', { ...data, provider: 'baileys' });
      });

      this.baileysSocket.on('new_message', (data: MessageData) => {
        this.emit('new_message', { ...data, provider: 'baileys' });
      });

      this.baileysSocket.on('message_sent', (data: MessageData) => {
        this.emit('message_sent', { ...data, provider: 'baileys' });
      });

      this.baileysSocket.on('error', (data: { error: string; provider?: string }) => {
        this.emit('error', { ...data, provider: 'baileys' });
      });
    }

    // Eventos do WhatsApp Web.js
    if (this.webjsSocket) {
      this.webjsSocket.on('qr_code', (data: QRCodeData) => {
        this.emit('qr_code', { ...data, provider: 'web.js' });
      });

      this.webjsSocket.on('connection_status', (data: ConnectionStatus) => {
        this.emit('connection_status', { ...data, provider: 'web.js' });
      });

      this.webjsSocket.on('new_message', (data: MessageData) => {
        this.emit('new_message', { ...data, provider: 'web.js' });
      });

      this.webjsSocket.on('message_sent', (data: MessageData) => {
        this.emit('message_sent', { ...data, provider: 'web.js' });
      });

      this.webjsSocket.on('chats_list', (data: ChatsListData) => {
        this.emit('chats_list', { ...data, provider: 'web.js' });
      });

      this.webjsSocket.on('error', (data: { error: string; provider?: string }) => {
        this.emit('error', { ...data, provider: 'web.js' });
      });
    }
  }

  private getSocket(provider: ApiProvider): Socket | null {
    return provider === 'baileys' ? this.baileysSocket : this.webjsSocket;
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(listener => listener(data));
  }

  // Métodos públicos
  connect(provider: ApiProvider): void {
    const socket = this.getSocket(provider);
    if (socket && !socket.connected) {
      socket.connect();
    }
  }

  disconnect(provider: ApiProvider): void {
    const socket = this.getSocket(provider);
    if (socket && socket.connected) {
      socket.disconnect();
    }
  }

  createConnection(provider: ApiProvider, connectionId: string): void {
    const socket = this.getSocket(provider);
    if (socket) {
      if (!socket.connected) {
        socket.connect();
      }
      socket.emit('create_connection', { connectionId });
    }
  }

  disconnectConnection(provider: ApiProvider, connectionId: string): void {
    const socket = this.getSocket(provider);
    if (socket) {
      socket.emit('disconnect_connection', { connectionId });
    }
  }

  async sendMessage(connectionId: string, to: string, message: string, provider: 'baileys' | 'web.js' = 'baileys'): Promise<ServiceResponse> {
    const socket = provider === 'baileys' ? this.baileysSocket : this.webjsSocket;
    
    if (!socket || !socket.connected) {
      throw new Error(`${provider} socket não está conectado`);
    }

    return new Promise((resolve, reject) => {
      socket.emit('send_message', { connectionId, to, message }, (response: ServiceResponse) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error || 'Erro ao enviar mensagem'));
        }
      });
    });
  }

  async sendMedia(connectionId: string, to: string, media: any, provider: 'baileys' | 'web.js' = 'baileys'): Promise<ServiceResponse> {
    const socket = provider === 'baileys' ? this.baileysSocket : this.webjsSocket;
    
    if (!socket || !socket.connected) {
      throw new Error(`${provider} socket não está conectado`);
    }

    return new Promise((resolve, reject) => {
      socket.emit('send_media', { connectionId, to, media }, (response: ServiceResponse) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error || 'Erro ao enviar mídia'));
        }
      });
    });
  }

  async getConnectionStatus(connectionId: string, provider: 'baileys' | 'web.js' = 'baileys'): Promise<ServiceResponse> {
    const socket = provider === 'baileys' ? this.baileysSocket : this.webjsSocket;
    
    if (!socket || !socket.connected) {
      throw new Error(`${provider} socket não está conectado`);
    }

    return new Promise((resolve, reject) => {
      socket.emit('get_connection_status', { connectionId }, (response: ServiceResponse) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error || 'Erro ao obter status da conexão'));
        }
      });
    });
  }

  async getChats(connectionId: string, provider: 'baileys' | 'web.js' = 'web.js'): Promise<ServiceResponse> {
    const socket = provider === 'baileys' ? this.baileysSocket : this.webjsSocket;
    
    if (!socket || !socket.connected) {
      throw new Error(`${provider} socket não está conectado`);
    }

    return new Promise((resolve, reject) => {
      socket.emit('get_chats', { connectionId }, (response: ServiceResponse) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error || 'Erro ao obter chats'));
        }
      });
    });
  }

  // Event listeners
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
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
        ? (import.meta.env.VITE_BAILEYS_URL || 'http://localhost:3001')
        : (import.meta.env.VITE_WEBJS_URL || 'http://localhost:3003');
      
      const response = await fetch(`${baseUrl}/health`);
      return response.ok;
    } catch (error: any) {
      console.error(`Erro ao verificar saúde do serviço ${provider}:`, error);
      return false;
    }
  }

  // Cleanup
  destroy(): void {
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

export interface ChatData {
  id: string;
  name: string;
  lastMessage?: string;
  timestamp?: number;
  unreadCount?: number;
  isGroup?: boolean;
}

export interface ChatsListData {
  chats: ChatData[];
  provider?: string;
}
