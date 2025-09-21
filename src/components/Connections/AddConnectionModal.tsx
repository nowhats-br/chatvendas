import React, { useState } from 'react';
import { supabase, WhatsAppConnection } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { X, Loader2, Save, ArrowRight, Server, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';

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
  const { user } = useAuth();

  const handleNextStep = async () => {
    if (!name) {
      toast.error("O nome da conexão é obrigatório.");
      return;
    }
    setLoading(true);
    // In a real scenario, you would call your backend here to generate a QR code
    // For now, we'll simulate it and move to the next step.
    try {
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
      
      // Simulate QR code generation
      setQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=connId:${data.id}`);
      setStep(2);

    } catch (err: any) {
      toast.error(err.message || "Erro ao criar conexão.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setName('');
    setQrCode(null);
    onClose();
  };
  
  const handleFinish = () => {
    toast.success("Conexão adicionada! Aguardando leitura do QR Code.");
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
            <p className="text-gray-600 dark:text-gray-300 mb-4">Abra o WhatsApp no seu celular, vá para **Aparelhos conectados** e escaneie o QR Code abaixo.</p>
            <div className="flex justify-center items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-6 h-64">
              {qrCode ? (
                <img src={qrCode} alt="QR Code" className="w-56 h-56" />
              ) : (
                <Loader2 className="w-12 h-12 animate-spin text-green-500" />
              )}
            </div>
            <div className="flex justify-end">
              <button onClick={handleFinish} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Concluir
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
