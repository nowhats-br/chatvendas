import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Hash, Lock, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, InternalChannel, InternalMessage } from '../../lib/supabase';
import { InternalMessageBubble } from './InternalMessageBubble';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

interface InternalChatInterfaceProps {
  selectedChannel: InternalChannel | null;
}

export const InternalChatInterface: React.FC<InternalChatInterfaceProps> = ({ selectedChannel }) => {
  const [messages, setMessages] = useState<InternalMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, profile } = useAuth();

  useEffect(() => {
    if (selectedChannel) {
      fetchMessages();
      const subscription = supabase
        .channel(`internal-messages:${selectedChannel.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'internal_messages', filter: `channel_id=eq.${selectedChannel.id}` },
          async (payload) => {
            const newMessage = payload.new as InternalMessage;
            const { data: userProfile, error } = await supabase.from('profiles').select('*').eq('id', newMessage.user_id).single();
            if (!error) {
              newMessage.user = userProfile;
            }
            setMessages(currentMessages => [...currentMessages, newMessage]);
            scrollToBottom();
          }
        )
        .subscribe();
      return () => { supabase.removeChannel(subscription); };
    } else {
      setMessages([]);
    }
  }, [selectedChannel]);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    if (!selectedChannel) return;
    setLoading(true);
    const { data, error } = await supabase.from('internal_messages').select('*, user:profiles(*)').eq('channel_id', selectedChannel.id).order('created_at');
    if (error) toast.error("Erro ao carregar mensagens.");
    else setMessages(data || []);
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChannel || !user) return;
    const tempId = uuidv4();
    const tempMessage: any = {
        id: tempId,
        channel_id: selectedChannel.id,
        user_id: user.id,
        content: newMessage,
        created_at: new Date().toISOString(),
        user: profile
    };
    setMessages(current => [...current, tempMessage]);
    setNewMessage('');

    const { error } = await supabase.from('internal_messages').insert({ channel_id: selectedChannel.id, user_id: user.id, content: newMessage });
    if (error) {
        toast.error("Erro ao enviar mensagem.");
        setMessages(current => current.filter(m => m.id !== tempId));
    }
  };

  if (!selectedChannel) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100">Selecione um canal</h3>
          <p className="text-gray-500 dark:text-gray-400">Comece a conversar com sua equipe.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-100 dark:bg-gray-800/50">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center space-x-3">
        {selectedChannel.channel_type === 'public' && <Hash className="text-gray-400" />}
        {selectedChannel.channel_type === 'private' && <Lock className="text-gray-400" />}
        {selectedChannel.channel_type === 'direct' && <Users className="text-gray-400" />}
        <div>
          <h3 className="font-medium text-gray-900 dark:text-gray-100">{selectedChannel.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{selectedChannel.description}</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? <div className="flex justify-center items-center h-full"><Loader2 className="w-6 h-6 animate-spin text-green-600" /></div> : messages.map((message) => <InternalMessageBubble key={message.id} message={message} />)}
        <div ref={messagesEndRef} />
      </div>
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="relative">
          <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())} placeholder={`Mensagem em #${selectedChannel.name}`} className="w-full pl-4 pr-12 py-2.5 border-none rounded-lg bg-gray-100 dark:bg-gray-700 focus:ring-2 focus:ring-green-500" />
          <button onClick={sendMessage} disabled={!newMessage.trim() || loading} className="absolute right-2 top-1/2 -translate-y-1/2 bg-green-600 text-white p-2 rounded-full hover:bg-green-700 disabled:opacity-50"><Send size={18} /></button>
        </div>
      </div>
    </div>
  );
};
