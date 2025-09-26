import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { X, Loader2, Save, ArrowRight, Server, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWhatsAppConnection } from '../../hooks/useWhatsAppConnection';
import { QRCodeDisplay } from './QRCodeDisplay';
import { query } from '../../lib/postgres';

interface AddConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ApiProvider = 'baileys' | 'web.js';

export const AddConnectionModal: React.FC<AddConnectionModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [apiProvider, setApiProvider] = useState<ApiProvider>('baileys');
  const [loading, setLoading] = useState(false);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const { user } = useAuth();
  
  // Hook para gerenciar conexões WhatsApp
  const {
    qrCode,
    connectionStatus,
    isConnecting,
    error,
    createConnection,
    disconnectConnection,
    clearQRCode
  } = useWhatsAppConnection();

  const handleNextStep = async () => {
    if (!name.trim()) {
      toast.error("O nome da conexão é obrigatório.");
      return;
    }
    
    if (!user?.id) {
      toast.error("Usuário não autenticado.");
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await query(
        'INSERT INTO whatsapp_connections (name, api_provider, status, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
        [name.trim(), apiProvider, 'connecting', user.id]
      );
      
      if (!result.rows || result.rows.length === 0) {
        throw new Error('Falha ao criar conexão');
      }
      
      const data = result.rows[0];
      
      // Armazenar o ID da conexão e criar conexão real
      setConnectionId(data.id);
      await createConnection(apiProvider, data.id);
      setStep(2);

    } catch (err: any) {
      toast.error(err.message || "Erro ao criar conexão.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Desconectar se houver uma conexão ativa
    if (connectionId) {
      disconnectConnection(connectionId);
    }
    
    // Reset do estado
    setStep(1);
    setName('');
    setApiProvider('baileys');
    setConnectionId(null);
    clearQRCode();
    onClose();
  };
  
  const handleComplete = async () => {
    if (!connectionId) {
      toast.error("ID da conexão não encontrado.");
      return;
    }
    
    setLoading(true);
    
    try {
      // Atualizar status da conexão no banco
      await query(
        'UPDATE whatsapp_connections SET status = $1, connected_at = $2 WHERE id = $3',
        ['connected', new Date().toISOString(), connectionId]
      );
      

      
      toast.success("Conexão estabelecida com sucesso!");
      onSuccess();
      handleClose();
    } catch (err: any) {
      toast.error(err.message || "Erro ao finalizar conexão.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Nova Conexão WhatsApp</h2>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><X size={20} /></button>
        </div>
        
        {step === 1 && (
          <div className="p-6">
            <div className="mb-4">
              <label htmlFor="conn-name" className="block text-sm font-medium mb-1">Nome da Conexão</label>
              <input
                id="conn-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Vendas Principal"
                className="w-full p-2 border rounded bg-transparent dark:border-gray-600"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Provedor da API</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setApiProvider('baileys')}
                  className={`p-4 border-2 rounded-lg flex flex-col items-center justify-center ${apiProvider === 'baileys' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'dark:border-gray-600'}`}
                >
                  <Server size={24} className="mb-2" />
                  <span className="font-semibold">Baileys</span>
                  <span className="text-xs text-gray-500">Recomendado</span>
                </button>
                <button
                  onClick={() => setApiProvider('web.js')}
                  className={`p-4 border-2 rounded-lg flex flex-col items-center justify-center ${apiProvider === 'web.js' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'dark:border-gray-600'}`}
                >
                  <Smartphone size={24} className="mb-2" />
                  <span className="font-semibold">Web.js</span>
                  <span className="text-xs text-gray-500">Navegador</span>
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <button 
                onClick={handleNextStep} 
                disabled={loading || !name.trim()} 
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                <span>{loading ? 'Criando...' : 'Avançar'}</span>
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="p-6">
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Conectar WhatsApp
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Escaneie o QR Code com seu WhatsApp para conectar
                </p>
              </div>

              <QRCodeDisplay
                qrCodeData={qrCode}
                provider={apiProvider}
                connectionStatus={connectionStatus?.status}
                isConnecting={isConnecting}
                error={error}
                onRetry={() => connectionId && createConnection(apiProvider, connectionId)}
              />

              {/* Botão de finalizar quando conectado */}
              {connectionStatus?.status === 'connected' && (
                <div className="flex justify-center">
                  <button
                    onClick={handleComplete}
                    disabled={loading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    <span>{loading ? 'Finalizando...' : 'Finalizar Conexão'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
