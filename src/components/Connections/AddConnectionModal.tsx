import React, { useState, useEffect } from 'react';
import { supabase, WhatsAppConnection } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { X, Loader2, Save, ArrowRight, Server, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { whatsappService, ConnectionStatus } from '../../lib/whatsapp-service';

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
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('initializing');
  const { user } = useAuth();

  useEffect(() => {
    if (!isOpen) return;

    // Configurar listeners para eventos do WhatsApp
    const handleQrCode = (data: any) => {
      if (data.connectionId === connectionId) {
        setQrCode(data.qr);
      }
    };

    const handleConnectionStatus = (data: ConnectionStatus) => {
      if (data.connectionId === connectionId) {
        setConnectionStatus(data.status);
        
        if (data.status === 'connected') {
          toast.success('Conexão estabelecida com sucesso!');
          // Atualizar status no banco de dados
          if (connectionId) {
            supabase
              .from('whatsapp_connections')
              .update({ 
                status: 'connected',
                phone_number: data.phoneNumber 
              })
              .eq('id', connectionId)
              .then(() => {
                onSuccess();
                handleClose();
              });
          }
        } else if (data.status === 'error') {
          toast.error(data.error || 'Erro na conexão');
        }
      }
    };

    whatsappService.on('qr_code', handleQrCode);
    whatsappService.on('connection_status', handleConnectionStatus);

    return () => {
      whatsappService.off('qr_code', handleQrCode);
      whatsappService.off('connection_status', handleConnectionStatus);
    };
  }, [isOpen, connectionId, onSuccess]);

  const handleNextStep = async () => {
    if (!name) {
      toast.error("O nome da conexão é obrigatório.");
      return;
    }
    
    setLoading(true);
    
    try {
      // Verificar se o serviço está disponível
      const isServiceHealthy = await whatsappService.checkServiceHealth(apiProvider);
      if (!isServiceHealthy) {
        throw new Error(`Serviço ${apiProvider} não está disponível. Verifique se está rodando.`);
      }

      // Criar conexão no banco de dados
      const { data, error } = await supabase
        .from('whatsapp_connections')
        .insert({
          name,
          api_provider: apiProvider,
          status: 'connecting',
          created_by: user!.id
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setConnectionId(data.id);
      
      // Conectar ao serviço WhatsApp
      whatsappService.connect(apiProvider);
      
      // Criar conexão no serviço
      whatsappService.createConnection(apiProvider, data.id);
      
      setStep(2);

    } catch (err: any) {
      toast.error(err.message || "Erro ao criar conexão.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Desconectar conexão se estiver em processo
    if (connectionId && connectionStatus !== 'connected') {
      whatsappService.disconnectConnection(apiProvider, connectionId);
    }
    
    setStep(1);
    setName('');
    setQrCode(null);
    setConnectionId(null);
    setConnectionStatus('initializing');
    onClose();
  };
  
  const handleFinish = () => {
    if (connectionStatus === 'connected') {
      toast.success("Conexão estabelecida com sucesso!");
    } else {
      toast.success("Conexão adicionada! Aguardando leitura do QR Code.");
    }
    onSuccess();
    handleClose();
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
              <button onClick={handleNextStep} disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 disabled:opacity-50">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                <span>Avançar</span>
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="p-6 text-center">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Abra o WhatsApp no seu celular, vá para **Aparelhos conectados** e escaneie o QR Code abaixo.
            </p>
            
            <div className="flex justify-center items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-4 h-64">
              {qrCode ? (
                <img 
                  src={`data:image/png;base64,${qrCode}`} 
                  alt="QR Code WhatsApp" 
                  className="w-56 h-56 object-contain" 
                />
              ) : (
                <div className="flex flex-col items-center">
                  <Loader2 className="w-12 h-12 animate-spin text-green-500 mb-2" />
                  <span className="text-sm text-gray-500">Gerando QR Code...</span>
                </div>
              )}
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  connectionStatus === 'qr_ready' ? 'bg-yellow-500' :
                  connectionStatus === 'authenticated' ? 'bg-blue-500' :
                  connectionStatus === 'connected' ? 'bg-green-500' :
                  connectionStatus === 'error' ? 'bg-red-500' :
                  'bg-gray-400'
                }`}></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {connectionStatus === 'initializing' && 'Inicializando...'}
                  {connectionStatus === 'qr_ready' && 'QR Code pronto - Escaneie com seu celular'}
                  {connectionStatus === 'authenticated' && 'Autenticado - Conectando...'}
                  {connectionStatus === 'connected' && 'Conectado com sucesso!'}
                  {connectionStatus === 'error' && 'Erro na conexão'}
                  {connectionStatus === 'reconnecting' && 'Reconectando...'}
                </span>
              </div>
            </div>
            
            <div className="flex justify-between">
              <button 
                onClick={handleClose} 
                className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Cancelar
              </button>
              <button 
                onClick={handleFinish} 
                disabled={connectionStatus === 'initializing'}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {connectionStatus === 'connected' ? 'Concluir' : 'Continuar em segundo plano'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
