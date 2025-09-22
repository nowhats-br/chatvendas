import React, { useState } from 'react';
import { InternalChannel, Profile, supabase } from '../../lib/supabase';
import { Loader2, Hash, Lock, User, Plus, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface ChannelListProps {
  channels: InternalChannel[];
  selectedChannel: InternalChannel | null;
  onSelectChannel: (channel: InternalChannel) => void;
  loading: boolean;
  onChannelCreated: () => void;
}

export const ChannelList: React.FC<ChannelListProps> = ({ channels, selectedChannel, onSelectChannel, loading, onChannelCreated }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  return (
    <>
      <div className="w-full lg:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Canais</h2>
          <button onClick={() => setIsModalOpen(true)} className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" title="Novo Canal">
            <Plus size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-full"><Loader2 className="w-6 h-6 animate-spin text-green-600" /></div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {channels.map((channel) => (
                <div key={channel.id} onClick={() => onSelectChannel(channel)} className={`p-3 cursor-pointer flex items-center space-x-3 transition-colors ${selectedChannel?.id === channel.id ? 'bg-green-50 dark:bg-green-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                  {channel.channel_type === 'public' && <Hash size={20} className="text-gray-400" />}
                  {channel.channel_type === 'private' && <Lock size={20} className="text-gray-400" />}
                  {channel.channel_type === 'direct' && <User size={20} className="text-gray-400" />}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 truncate">{channel.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{channel.description || 'Sem descrição'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {isModalOpen && <NewChannelModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={onChannelCreated} />}
    </>
  );
};

const NewChannelModal: React.FC<{ isOpen: boolean, onClose: () => void, onSuccess: () => void }> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'public' | 'private'>('public');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleCreate = async () => {
    if (!name.trim() || !user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from('internal_channels').insert({ name, description, channel_type: type, created_by: user.id }).select().single();
      if (error) throw error;
      
      // If private, add creator as member
      if (type === 'private') {
        await supabase.from('internal_channel_members').insert({ channel_id: data.id, user_id: user.id });
      }

      toast.success("Canal criado com sucesso!");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Erro ao criar canal.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Novo Canal</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <input type="text" placeholder="Nome do canal" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded bg-transparent" />
          <input type="text" placeholder="Descrição (opcional)" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 border rounded bg-transparent" />
          <div className="flex space-x-4">
            <label><input type="radio" name="type" value="public" checked={type === 'public'} onChange={() => setType('public')} /> Público</label>
            <label><input type="radio" name="type" value="private" checked={type === 'private'} onChange={() => setType('private')} /> Privado</label>
          </div>
        </div>
        <div className="p-4 flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 border rounded">Cancelar</button>
          <button onClick={handleCreate} disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" /> : 'Criar'}
          </button>
        </div>
      </div>
    </div>
  );
};
