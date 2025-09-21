import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Check, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Task {
  id: string;
  user_id: string;
  title: string;
  is_completed: boolean;
  created_at: string;
}

export const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from('tasks').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (error) toast.error('Erro ao carregar tarefas.');
    else setTasks(data || []);
    setLoading(false);
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !user) return;
    const { data, error } = await supabase.from('tasks').insert({ title: newTaskTitle, user_id: user.id }).select();
    if (error) toast.error('Erro ao adicionar tarefa.');
    else {
      setTasks([data[0], ...tasks]);
      setNewTaskTitle('');
      toast.success('Tarefa adicionada!');
    }
  };

  const toggleTask = async (task: Task) => {
    const { error } = await supabase.from('tasks').update({ is_completed: !task.is_completed }).eq('id', task.id);
    if (error) toast.error('Erro ao atualizar tarefa.');
    else fetchTasks();
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) toast.error('Erro ao deletar tarefa.');
    else {
      setTasks(tasks.filter(t => t.id !== taskId));
      toast.success('Tarefa removida.');
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 h-full">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Minhas Tarefas</h2>
        <form onSubmit={addTask} className="flex space-x-2 mb-6">
          <input type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Adicionar nova tarefa..." className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-transparent" />
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"><Plus size={20} /><span>Adicionar</span></button>
        </form>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          {loading ? <div className="flex justify-center items-center h-48"><Loader2 className="w-8 h-8 animate-spin text-green-600" /></div> : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {tasks.map(task => (
                <li key={task.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button onClick={() => toggleTask(task)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${task.is_completed ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                      {task.is_completed && <Check size={16} className="text-white" />}
                    </button>
                    <span className={`text-gray-800 dark:text-gray-200 ${task.is_completed ? 'line-through text-gray-500' : ''}`}>{task.title}</span>
                  </div>
                  <button onClick={() => deleteTask(task.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={18} /></button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
