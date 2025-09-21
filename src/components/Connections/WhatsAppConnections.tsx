import React, { useState, useEffect } from 'react';
import { supabase, WhatsAppConnection } from '../../lib/supabase';
import { Plus, CheckCircle, XCircle, Loader2, Trash2, Power } from 'lucide-react';
import toast from 'react-hot-toast';
import { AddConnectionModal } from './AddConnectionModal';

export const WhatsAppConnections: React.FC = () => {
  const [connections, setConnections] = useState<WhatsAppConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('whatsapp_connections').select('*').order('created_at');
      if (error) throw error;
      setConnections(data || []);
    } catch (err) {
      toast.error('Erro ao carregar conexões.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja remover esta conexão?")) return;
    try {
      const { error } = await supabase.from('whatsapp_connections').delete().eq('id', id);
      if (error) throw error;
      toast.success("Conexão removida!");
      fetchConnections();
    } catch (err) {
      toast.error("Erro ao remover conexão.");
    }
  };

  const getStatusInfo = (status: WhatsAppConnection['status']) => {
    switch (status) {
      case 'connected':
        return { icon: CheckCircle, color: 'text-green-500', label: 'Conectado' };
      case 'disconnected':
        return { icon: XCircle, color: 'text-red-500', label: 'Desconectado' };
      case 'connecting':
        return { icon: Loader2, color: 'text-yellow-500 animate-spin', label: 'Conectando' };
      case 'error':
        return { icon: XCircle, color: 'text-red-700', label: 'Erro' };
      default:
        return { icon: XCircle, color: 'text-gray-500', label: 'Desconhecido' };
    }
  };

  const getApiProviderInfo = (provider: WhatsAppConnection['api_provider']) => {
    switch (provider) {
      case 'baileys':
        return { label: 'Baileys', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' };
      case 'web.js':
        return { label: 'Web.js', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' };
      default:
        return { label: 'N/A', color: 'bg-gray-100 text-gray-800' };
    }
  };

  return (
    <>
      <div className="p-6 bg-gray-50 dark:bg-gray-900 h-full">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Conexões WhatsApp</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Gerencie suas contas do WhatsApp</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Nova Conexão</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {connections.map((conn) => {
              const statusInfo = getStatusInfo(conn.status);
              const apiInfo = getApiProviderInfo(conn.api_provider);
              const Icon = statusInfo.icon;
              return (
                <div key={conn.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{conn.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{conn.phone_number || 'Não conectado'}</p>
                      </div>
                      <div className={`flex items-center space-x-2 text-sm ${statusInfo.color}`}>
                        <Icon size={18} />
                        <span>{statusInfo.label}</span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${apiInfo.color}`}>
                        {apiInfo.label}
                      </span>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-2">
                    <button className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2">
                      <Power size={14} />
                      <span>{conn.status === 'connected' ? 'Desconectar' : 'Conectar'}</span>
                    </button>
                    <button onClick={() => handleDelete(conn.id)} className="px-3 py-1 text-sm border border-red-300 text-red-600 rounded-md hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/50 flex items-center space-x-2">
                      <Trash2 size={14} />
                      <span>Remover</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AddConnectionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          fetchConnections();
        }}
      />
    </>
  );
};
