import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface QRCodeData {
  connectionId: string;
  qr: string;
  provider: 'baileys' | 'web.js';
}

export interface ConnectionStatus {
  connectionId: string;
  status: 'initializing' | 'qr_ready' | 'authenticated' | 'connected' | 'disconnected' | 'error';
  phoneNumber?: string;
  reason?: string;
  provider: 'baileys' | 'web.js';
}

export interface ConnectionCreatedData {
  connectionId: string;
  provider: 'baileys' | 'web.js';
  status: string;
}

export interface ConnectError {
  message: string;
  type: string;
  description?: string;
}

export interface WhatsAppConnectionHook {
  qrCode: string | null;
  connectionStatus: ConnectionStatus | null;
  isConnecting: boolean;
  error: string | null;
  createConnection: (provider: 'baileys' | 'web.js', connectionId: string) => void;
  disconnectConnection: (connectionId: string) => void;
  clearQRCode: () => void;
}

export const useWhatsAppConnection = (): WhatsAppConnectionHook => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sockets, setSockets] = useState<{
    baileys: Socket | null;
    webjs: Socket | null;
  }>({
    baileys: null,
    webjs: null
  });

  // Inicializar sockets
  useEffect(() => {
    const baileysSocket = io(import.meta.env.VITE_BAILEYS_URL || 'http://localhost:3001', {
      autoConnect: false,
      transports: ['websocket', 'polling']
    });

    const webjsSocket = io(import.meta.env.VITE_WEBJS_URL || 'http://localhost:3003', {
      autoConnect: false,
      transports: ['websocket', 'polling']
    });

    // Event listeners para Baileys
    baileysSocket.on('qr_code', (data: QRCodeData) => {
      console.log('QR Code recebido do Baileys:', data);
      setQrCode(data.qr);
      setIsConnecting(false);
    });

    baileysSocket.on('connection_status', (data: ConnectionStatus) => {
      console.log('Status de conexão Baileys:', data);
      setConnectionStatus(data);
      
      if (data.status === 'connected') {
        setQrCode(null);
        setIsConnecting(false);
      } else if (data.status === 'error') {
        setError(data.reason || 'Erro na conexão');
        setIsConnecting(false);
      }
    });

    baileysSocket.on('connection_created', (data: ConnectionCreatedData) => {
      console.log('Conexão Baileys criada:', data);
    });

    // Event listeners para Web.js
    webjsSocket.on('qr_code', (data: QRCodeData) => {
      console.log('QR Code recebido do Web.js:', data);
      setQrCode(data.qr);
      setIsConnecting(false);
    });

    webjsSocket.on('connection_status', (data: ConnectionStatus) => {
      console.log('Status de conexão Web.js:', data);
      setConnectionStatus(data);
      
      if (data.status === 'connected') {
        setQrCode(null);
        setIsConnecting(false);
      } else if (data.status === 'error') {
        setError(data.reason || 'Erro na conexão');
        setIsConnecting(false);
      }
    });

    webjsSocket.on('connection_created', (data: ConnectionCreatedData) => {
      console.log('Conexão Web.js criada:', data);
    });

    // Error handlers
    baileysSocket.on('connect_error', (error: ConnectError) => {
      console.error('Erro de conexão Baileys:', error);
      setError('Erro ao conectar com o serviço Baileys');
      setIsConnecting(false);
    });

    webjsSocket.on('connect_error', (error: ConnectError) => {
      console.error('Erro de conexão Web.js:', error);
      setError('Erro ao conectar com o serviço Web.js');
      setIsConnecting(false);
    });

    setSockets({
      baileys: baileysSocket,
      webjs: webjsSocket
    });

    return () => {
      baileysSocket.disconnect();
      webjsSocket.disconnect();
    };
  }, []);

  const createConnection = useCallback((provider: 'baileys' | 'web.js', connectionId: string) => {
    setError(null);
    setQrCode(null);
    setIsConnecting(true);
    
    const socket = provider === 'baileys' ? sockets.baileys : sockets.webjs;
    
    if (!socket) {
      setError('Socket não inicializado');
      setIsConnecting(false);
      return;
    }

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit('create_connection', { connectionId });
  }, [sockets]);

  const disconnectConnection = useCallback((connectionId: string) => {
    if (connectionStatus) {
      const socket = connectionStatus.provider === 'baileys' ? sockets.baileys : sockets.webjs;
      
      if (socket && socket.connected) {
        socket.emit('disconnect_connection', { connectionId });
      }
    }
    
    setQrCode(null);
    setConnectionStatus(null);
    setIsConnecting(false);
  }, [connectionStatus, sockets]);

  const clearQRCode = useCallback(() => {
    setQrCode(null);
  }, []);

  return {
    qrCode,
    connectionStatus,
    isConnecting,
    error,
    createConnection,
    disconnectConnection,
    clearQRCode
  };
};