import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Loader2, RefreshCw, Wifi, WifiOff } from 'lucide-react';

interface QRCodeDisplayProps {
  qrCodeData: string | null;
  provider: 'baileys' | 'web.js';
  connectionStatus?: 'initializing' | 'qr_ready' | 'authenticated' | 'connected' | 'disconnected' | 'error';
  isConnecting: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  qrCodeData,
  provider,
  connectionStatus = 'initializing',
  isConnecting,
  error,
  onRetry
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrCodeGenerated, setQrCodeGenerated] = useState(false);

  useEffect(() => {
    if (qrCodeData && canvasRef.current) {
      generateQRCode(qrCodeData);
    }
  }, [qrCodeData]);

  const generateQRCode = async (data: string) => {
    try {
      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, data, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrCodeGenerated(true);
      }
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      setQrCodeGenerated(false);
    }
  };

  const getStatusInfo = () => {
    switch (connectionStatus) {
      case 'initializing':
        return {
          icon: <Loader2 className="w-6 h-6 animate-spin text-blue-500" />,
          message: `Inicializando ${provider}...`,
          color: 'text-blue-600'
        };
      case 'qr_ready':
        return {
          icon: <Wifi className="w-6 h-6 text-green-500" />,
          message: 'QR Code pronto para escaneamento',
          color: 'text-green-600'
        };
      case 'authenticated':
        return {
          icon: <Loader2 className="w-6 h-6 animate-spin text-green-500" />,
          message: 'Autenticado! Conectando...',
          color: 'text-green-600'
        };
      case 'connected':
        return {
          icon: <Wifi className="w-6 h-6 text-green-500" />,
          message: 'Conectado com sucesso!',
          color: 'text-green-600'
        };
      case 'disconnected':
        return {
          icon: <WifiOff className="w-6 h-6 text-gray-500" />,
          message: 'Desconectado',
          color: 'text-gray-600'
        };
      case 'error':
        return {
          icon: <WifiOff className="w-6 h-6 text-red-500" />,
          message: error || 'Erro na conexão',
          color: 'text-red-600'
        };
      default:
        return {
          icon: <Loader2 className="w-6 h-6 animate-spin text-gray-500" />,
          message: 'Aguardando...',
          color: 'text-gray-600'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      {/* Status Header */}
      <div className="flex items-center space-x-3">
        {statusInfo.icon}
        <div className="text-center">
          <p className={`text-sm font-medium ${statusInfo.color}`}>
            {statusInfo.message}
          </p>
          <p className="text-xs text-gray-500 capitalize">
            Provedor: {provider}
          </p>
        </div>
      </div>

      {/* QR Code Area */}
      <div className="relative">
        {qrCodeData && qrCodeGenerated ? (
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <canvas
              ref={canvasRef}
              className="block"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>
        ) : isConnecting ? (
          <div className="w-64 h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-green-500 mx-auto mb-4" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Conectando com {provider}...
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Aguardando geração do QR Code
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="w-64 h-64 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center border border-red-200 dark:border-red-800">
            <div className="text-center p-4">
              <WifiOff className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                {error}
              </p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2 mx-auto"
                >
                  <RefreshCw size={16} />
                  <span>Tentar Novamente</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="w-64 h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-lg mx-auto mb-4"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Aguardando QR Code
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      {qrCodeData && qrCodeGenerated && (
        <div className="text-center max-w-sm">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            <strong>Como escanear:</strong>
          </p>
          <ol className="text-xs text-gray-500 dark:text-gray-400 space-y-1 text-left">
            <li>1. Abra o WhatsApp no seu celular</li>
            <li>2. Vá para <strong>Aparelhos conectados</strong></li>
            <li>3. Toque em <strong>Conectar um aparelho</strong></li>
            <li>4. Escaneie o QR Code acima</li>
          </ol>
        </div>
      )}
    </div>
  );
};