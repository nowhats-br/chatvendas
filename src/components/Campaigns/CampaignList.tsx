import React, { useState, useEffect } from 'react';
import { Plus, Play, Pause, MoreHorizontal, Loader2 } from 'lucide-react';
import { supabase, Campaign } from '../../lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';

export const CampaignList: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      toast.error("Erro ao carregar campanhas.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'sending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'paused': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getStatusLabel = (status: Campaign['status']) => {
    const labels = {
      draft: 'Rascunho', scheduled: 'Agendada', sending: 'Enviando',
      completed: 'Concluída', paused: 'Pausada', cancelled: 'Cancelada'
    };
    return labels[status] || 'Desconhecido';
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Campanhas</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{campaigns.length} campanhas criadas</p>
        </div>
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
          <Plus size={20} />
          <span>Nova Campanha</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{campaign.name}</h3>
                <div className="flex items-center space-x-2">
                  {campaign.status === 'sending' && <button className="p-1 text-yellow-600 hover:text-yellow-700"><Pause size={16} /></button>}
                  {(campaign.status === 'draft' || campaign.status === 'paused') && <button className="p-1 text-green-600 hover:text-green-700"><Play size={16} /></button>}
                  <button className="p-1 text-gray-400 hover:text-gray-600"><MoreHorizontal size={16} /></button>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{campaign.message_content}</p>
              <div className="flex justify-between items-center mb-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>{getStatusLabel(campaign.status)}</span>
                {campaign.scheduled_at && <span className="text-xs text-gray-500 dark:text-gray-400">{format(new Date(campaign.scheduled_at), 'dd/MM/yy HH:mm', { locale: ptBR })}</span>}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-gray-600 dark:text-gray-400">Enviadas:</span><span className="font-medium dark:text-gray-200">{campaign.sent_count.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-600 dark:text-gray-400">Entregues:</span><span className="font-medium dark:text-gray-200">{campaign.delivered_count.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-600 dark:text-gray-400">Lidas:</span><span className="font-medium dark:text-gray-200">{campaign.read_count.toLocaleString()}</span></div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2"><div className="bg-green-600 h-2 rounded-full" style={{ width: `${(campaign.sent_count / campaign.total_contacts) * 100}%` }}></div></div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400"><span>Progresso</span><span>{Math.round((campaign.sent_count / campaign.total_contacts) * 100)}%</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
