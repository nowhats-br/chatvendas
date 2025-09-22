import React, { useState, useEffect } from 'react';
import { supabase, InternalChannel, Profile } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ChannelList } from './ChannelList';
import { InternalChatInterface } from './InternalChatInterface';
import toast from 'react-hot-toast';

export const InternalChat: React.FC = () => {
  const [channels, setChannels] = useState<InternalChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<InternalChannel | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_internal_channels_for_user', { p_user_id: user.id });
      if (error) throw error;
      setChannels(data || []);
      if(data && data.length > 0) {
        setSelectedChannel(data[0]);
      }
    } catch (error) {
      toast.error("Erro ao carregar canais.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900 flex">
      <ChannelList
        channels={channels}
        selectedChannel={selectedChannel}
        onSelectChannel={setSelectedChannel}
        loading={loading}
        onChannelCreated={fetchChannels}
      />
      <InternalChatInterface
        selectedChannel={selectedChannel}
      />
    </div>
  );
};
