import React, { useState, useEffect } from 'react';
import { supabase, Profile, Queue, UserQueue } from '../../lib/supabase';
import { X, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  user: Profile;
}

export const UserEditModal: React.FC<UserEditModalProps> = ({ isOpen, onClose, onSave, user }) => {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<Profile['role']>(user.role);
  const [allQueues, setAllQueues] = useState<Queue[]>([]);
  const [assignedQueues, setAssignedQueues] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: queuesData, error: queuesError } = await supabase.from('queues').select('*');
        if (queuesError) throw queuesError;
        setAllQueues(queuesData || []);

        const { data: userQueuesData, error: userQueuesError } = await supabase.from('user_queues').select('queue_id').eq('user_id', user.id);
        if (userQueuesError) throw userQueuesError;
        setAssignedQueues(userQueuesData.map(uq => uq.queue_id));
      } catch (error) {
        toast.error("Erro ao carregar dados do modal.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    setRole(user.role);
  }, [user]);

  const handleQueueToggle = (queueId: string) => {
    setAssignedQueues(prev =>
      prev.includes(queueId) ? prev.filter(id => id !== queueId) : [...prev, queueId]
    );
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    try {
      // Update profile role
      const { error: profileError } = await supabase.from('profiles').update({ role }).eq('id', user.id);
      if (profileError) throw profileError;

      // Update user queues
      const { error: deleteError } = await supabase.from('user_queues').delete().eq('user_id', user.id);
      if (deleteError) throw deleteError;

      if (assignedQueues.length > 0) {
        const newAssignments = assignedQueues.map(queue_id => ({ user_id: user.id, queue_id }));
        const { error: insertError } = await supabase.from('user_queues').insert(newAssignments);
        if (insertError) throw insertError;
      }

      toast.success("Usuário atualizado com sucesso!");
      onSave();
    } catch (error: any) {
      toast.error(error.message || "Falha ao salvar alterações.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Editar Usuário: {user.name}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {loading ? <Loader2 className="animate-spin mx-auto" /> : (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Função</label>
                <select value={role} onChange={e => setRole(e.target.value as Profile['role'])} className="w-full p-2 border rounded bg-transparent dark:border-gray-600">
                  <option value="agent">Atendente</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Filas de Atendimento</label>
                <div className="space-y-2">
                  {allQueues.map(queue => (
                    <label key={queue.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                      <input
                        type="checkbox"
                        checked={assignedQueues.includes(queue.id)}
                        onChange={() => handleQueueToggle(queue.id)}
                        className="h-4 w-4 rounded text-green-600 focus:ring-green-500"
                      />
                      <span className="flex items-center">
                        <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: queue.color }}></span>
                        {queue.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="p-4 border-t dark:border-gray-700 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg dark:border-gray-600">Cancelar</button>
          <button onClick={handleSaveChanges} disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 disabled:opacity-50">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            <span>Salvar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
