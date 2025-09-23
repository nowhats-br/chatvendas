import React, { useState, useEffect } from 'react';
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
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      const fetchUsers = async () => {
        const { data, error } = await supabase.from('profiles').select('id, name, avatar_url');
        if (error) toast.error("Erro ao carregar usuários.");
        else setAllUsers(data || []);
      };
      fetchUsers();
    }
  }, [isOpen]);

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleCreate = async () => {
    if (!name.trim() || !user) return;
    setLoading(true);
    try {
      const { data: channelData, error } = await supabase.from('internal_channels').insert({ name, description, channel_type: type, created_by: user.id }).select().single();
      if (error) throw error;
      
      if (type === 'private') {
        const membersToInsert = [...new Set([user.id, ...selectedUsers])].map(memberId => ({
          channel_id: channelData.id,
          user_id: memberId,
        }));
        await supabase.from('internal_channel_members').insert(membersToInsert);
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
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <input type="text" placeholder="Nome do canal" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded bg-transparent dark:border-gray-600" />
          <input type="text" placeholder="Descrição (opcional)" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 border rounded bg-transparent dark:border-gray-600" />
          <div className="flex space-x-4">
            <label className="flex items-center space-x-2"><input type="radio" name="type" value="public" checked={type === 'public'} onChange={() => setType('public')} className="text-green-600 focus:ring-green-500"/> <span>Público</span></label>
            <label className="flex items-center space-x-2"><input type="radio" name="type" value="private" checked={type === 'private'} onChange={() => setType('private')} className="text-green-600 focus:ring-green-500"/> <span>Privado (Equipe)</span></label>
          </div>
          {type === 'private' && (
            <div>
              <label className="block text-sm font-medium mb-2">Adicionar Membros</label>
              <div className="space-y-2 max-h-48 overflow-y-auto border dark:border-gray-600 rounded-lg p-2">
                {allUsers.filter(u => u.id !== user?.id).map(u => (
                  <label key={u.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input type="checkbox" checked={selectedUsers.includes(u.id)} onChange={() => handleUserToggle(u.id)} className="rounded text-green-600 focus:ring-green-500" />
                    <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.name}`} alt={u.name} className="w-8 h-8 rounded-full" />
                    <span>{u.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="p-4 flex justify-end space-x-2 border-t dark:border-gray-700">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg dark:border-gray-600">Cancelar</button>
          <button onClick={handleCreate} disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" /> : 'Criar Canal'}
          </button>
        </div>
      </div>
    </div>
  );
};
