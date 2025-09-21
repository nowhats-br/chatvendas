import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Edit, Trash2, Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface QuickMessage {
  id: string;
  title: string;
  content: string;
  shortcut?: string;
}

export const QuickMessageManager: React.FC = () => {
  const [messages, setMessages] = useState<QuickMessage[]>([]);
  const [editingMessage, setEditingMessage] = useState<Partial<QuickMessage> | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('quick_messages').select('*').eq('user_id', user!.id);
    if (error) toast.error("Erro ao carregar mensagens rápidas.");
    else setMessages(data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!editingMessage || !editingMessage.title || !editingMessage.content) {
      toast.error("Título e conteúdo são obrigatórios.");
      return;
    }
    const messageToSave = { ...editingMessage, user_id: user!.id };
    const { error } = await supabase.from('quick_messages').upsert(messageToSave);
    if (error) toast.error("Falha ao salvar mensagem.");
    else {
      toast.success("Mensagem salva!");
      setEditingMessage(null);
      fetchMessages();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja apagar esta mensagem?")) return;
    const { error } = await supabase.from('quick_messages').delete().eq('id', id);
    if (error) toast.error("Falha ao apagar mensagem.");
    else {
      toast.success("Mensagem apagada!");
      fetchMessages();
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mensagens Rápidas</h2>
        <button onClick={() => setEditingMessage({ title: '', content: '' })} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"><Plus size={20} /><span>Nova Mensagem</span></button>
      </div>
      {editingMessage && (
        <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
          <input type="text" placeholder="Título" value={editingMessage.title} onChange={e => setEditingMessage({ ...editingMessage, title: e.target.value })} className="w-full p-2 border rounded bg-transparent" />
          <textarea placeholder="Conteúdo da mensagem" value={editingMessage.content} onChange={e => setEditingMessage({ ...editingMessage, content: e.target.value })} className="w-full p-2 border rounded bg-transparent" rows={4}></textarea>
          <input type="text" placeholder="Atalho (opcional)" value={editingMessage.shortcut || ''} onChange={e => setEditingMessage({ ...editingMessage, shortcut: e.target.value })} className="w-full p-2 border rounded bg-transparent" />
          <div className="flex justify-end space-x-2">
            <button onClick={() => setEditingMessage(null)} className="px-4 py-2 border rounded">Cancelar</button>
            <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded flex items-center space-x-2"><Save size={16} /><span>Salvar</span></button>
          </div>
        </div>
      )}
      {loading ? <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-green-600" /></div> : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {messages.map(msg => (
              <li key={msg.id} className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-bold">{msg.title} {msg.shortcut && <span className="text-xs bg-gray-200 dark:bg-gray-600 p-1 rounded">/{msg.shortcut}</span>}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{msg.content}</p>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => setEditingMessage(msg)} className="p-2 hover:text-blue-500"><Edit size={18} /></button>
                  <button onClick={() => handleDelete(msg.id)} className="p-2 hover:text-red-500"><Trash2 size={18} /></button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
