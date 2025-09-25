import React, { useState, useEffect } from 'react';
import { supabase, Task, Profile, Contact } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { X, Save, Loader2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { ApiError } from '../../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  task: Task | null;
  users: Profile[];
}

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave, task, users }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'normal',
    status: 'todo',
    assigned_to: '',
    contact_id: '',
  });
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchContacts();
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
        priority: task.priority,
        status: task.status,
        assigned_to: task.assigned_to || '',
        contact_id: task.contact_id || '',
      });
    } else {
      setFormData({
        title: '', description: '', due_date: '', priority: 'normal',
        status: 'todo', assigned_to: user?.id || '', contact_id: ''
      });
    }
  }, [task, isOpen, user]);

  const fetchContacts = async () => {
    const { data } = await supabase.from('contacts').select('id, name').order('name');
    setContacts(data || []);
  };

  const handleSaveTask = async () => {
    if (!formData.title) {
      toast.error('O título da tarefa é obrigatório.');
      return;
    }
    setLoading(true);
    try {
      const taskData = {
        id: task?.id,
        user_id: task?.user_id || user!.id,
        ...formData,
        due_date: formData.due_date || null,
        contact_id: formData.contact_id || null,
        assigned_to: formData.assigned_to || null,
      };
      const { error } = await supabase.from('tasks').upsert(taskData);
      if (error) throw error;
      toast.success(`Tarefa ${task ? 'atualizada' : 'criada'} com sucesso!`);
      onSave();
    } catch (error: ApiError | any) {
      const errorMessage = error?.message || 'Erro ao salvar tarefa';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!task) return;
    if (!window.confirm("Tem certeza que deseja apagar esta tarefa?")) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', task.id);
      if (error) throw error;
      toast.success("Tarefa apagada com sucesso!");
      onSave();
    } catch (error: ApiError | any) {
      const errorMessage = error?.message || 'Erro ao excluir tarefa';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold">{task ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium mb-1">Título*</label>
            <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full p-2 border rounded bg-transparent dark:border-gray-600" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Descrição</label>
            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full p-2 border rounded bg-transparent dark:border-gray-600" rows={4}></textarea>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Prazo</label>
              <input type="date" value={formData.due_date} onChange={e => setFormData({ ...formData, due_date: e.target.value })} className="w-full p-2 border rounded bg-transparent dark:border-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Prioridade</label>
              <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })} className="w-full p-2 border rounded bg-transparent dark:border-gray-600">
                <option value="low">Baixa</option>
                <option value="normal">Normal</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full p-2 border rounded bg-transparent dark:border-gray-600">
                <option value="todo">A Fazer</option>
                <option value="in_progress">Em Progresso</option>
                <option value="done">Concluída</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Responsável</label>
              <select value={formData.assigned_to} onChange={e => setFormData({ ...formData, assigned_to: e.target.value })} className="w-full p-2 border rounded bg-transparent dark:border-gray-600">
                <option value="">Ninguém</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Vincular Contato</label>
            <select value={formData.contact_id} onChange={e => setFormData({ ...formData, contact_id: e.target.value })} className="w-full p-2 border rounded bg-transparent dark:border-gray-600">
              <option value="">Nenhum</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="p-4 border-t dark:border-gray-700 flex justify-between items-center">
          <div>
            {task && (
              <button onClick={handleDeleteTask} disabled={loading} className="px-4 py-2 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 flex items-center space-x-2 disabled:opacity-50">
                <Trash2 size={18} />
                <span>Apagar</span>
              </button>
            )}
          </div>
          <div className="flex space-x-3">
            <button onClick={onClose} className="px-4 py-2 border rounded-lg dark:border-gray-600">Cancelar</button>
            <button onClick={handleSaveTask} disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 disabled:opacity-50">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              <span>Salvar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
