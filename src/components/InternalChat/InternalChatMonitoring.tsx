import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { InternalChatInterface } from './InternalChatInterface';
import { Loader2, Hash, Lock, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface MonitoredChannel {
  id: string;
  name: string;
  description: string;
  channel_type: 'public' | 'private' | 'direct';
  last_message_content: string;
  last_message_created_at: string;
  last_message_sender_name: string;
}

export const InternalChatMonitoring: React.FC = () => {
  const [channels, setChannels] = useState<MonitoredChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_all_internal_channels_with_last_message');
      if (error) throw error;
      setChannels(data || []);
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar canais para monitoramento.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChannel = (channel: MonitoredChannel) => {
    // The RPC returns a flat structure, we need to adapt it for InternalChatInterface
    setSelectedChannel({
      id: channel.id,
      name: channel.name,
      description: channel.description,
      channel_type: channel.channel_type,
    });
  };

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900 flex">
      <div className="w-full lg:w-96 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Monitoramento de Chat</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Visualize todas as conversas internas.</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-full"><Loader2 className="w-6 h-6 animate-spin text-green-600" /></div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {channels.map((channel) => (
                <div key={channel.id} onClick={() => handleSelectChannel(channel)} className={`p-3 cursor-pointer flex items-center space-x-3 transition-colors ${selectedChannel?.id === channel.id ? 'bg-green-50 dark:bg-green-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                  {channel.channel_type === 'public' && <Hash size={20} className="text-gray-400" />}
                  {channel.channel_type === 'private' && <Lock size={20} className="text-gray-400" />}
                  {channel.channel_type === 'direct' && <User size={20} className="text-gray-400" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 truncate">{channel.name}</h4>
                      {channel.last_message_created_at && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                          {formatDistanceToNow(new Date(channel.last_message_created_at), { locale: ptBR, addSuffix: true })}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {channel.last_message_sender_name ? `${channel.last_message_sender_name}: ` : ''}
                      {channel.last_message_content || 'Nenhuma mensagem ainda.'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <InternalChatInterface selectedChannel={selectedChannel} />
    </div>
  );
};
