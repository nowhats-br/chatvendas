import React, { useState, useEffect, useMemo } from 'react';
import { supabase, Task, Profile } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Loader2, Filter, Flag, Calendar, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { TaskModal } from './TaskModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const priorityConfig = {
  urgent: { label: 'Urgente', color: 'bg-red-500', iconColor: 'text-red-500' },
  high: { label: 'Alta', color: 'bg-orange-500', iconColor: 'text-orange-500' },
  normal: { label: 'Normal', color: 'bg-yellow-500', iconColor: 'text-yellow-500' },
  low: { label: 'Baixa', color: 'bg-blue-500', iconColor: 'text-blue-500' },
};

const statusConfig = {
  todo: { label: 'A Fazer' },
  in_progress: { label: 'Em Progresso' },
  done: { label: 'Concluída' },
};

export const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { user } = useAuth();
  
  const [filters, setFilters] = useState({ status: 'all', priority: 'all' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [tasksRes, usersRes] = await Promise.all([
        supabase.from('tasks').select('*, contact:contacts(name), assignee:profiles(name, avatar_url)').order('due_date', { ascending: true, nullsFirst: false }),
        supabase.from('profiles').select('id, name, avatar_url')
      ]);
      
      if (tasksRes.error) throw tasksRes.error;
      if (usersRes.error) throw usersRes.error;

      setTasks(tasksRes.data || []);
      setUsers(usersRes.data || []);
    } catch (error) {
      toast.error('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleOpenModal = (task: Task | null) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const statusMatch = filters.status === 'all' || task.status === filters.status;
      const priorityMatch = filters.priority === 'all' || task.priority === filters.priority;
      return statusMatch && priorityMatch;
    });
  }, [tasks, filters]);

  return (
    <>
      <div className="p-6 bg-gray-50 dark:bg-gray-900 h-full overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Gerenciador de Tarefas</h2>
            <button onClick={() => handleOpenModal(null)} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2">
              <Plus size={20} />
              <span>Nova Tarefa</span>
            </button>
          </div>

          <div className="flex space-x-4 mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
            <Filter size={20} className="text-gray-500 mt-2" />
            <div className="flex-1">
              <label className="text-sm font-medium">Status</label>
              <select onChange={e => setFilters({...filters, status: e.target.value})} value={filters.status} className="w-full mt-1 p-2 border rounded bg-transparent dark:border-gray-600">
                <option value="all">Todos</option>
                <option value="todo">A Fazer</option>
                <option value="in_progress">Em Progresso</option>
                <option value="done">Concluída</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Prioridade</label>
              <select onChange={e => setFilters({...filters, priority: e.target.value})} value={filters.priority} className="w-full mt-1 p-2 border rounded bg-transparent dark:border-gray-600">
                <option value="all">Todas</option>
                <option value="urgent">Urgente</option>
                <option value="high">Alta</option>
                <option value="normal">Normal</option>
                <option value="low">Baixa</option>
              </select>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-green-600" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Tarefa</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Prioridade</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Prazo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Responsável</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredTasks.map(task => (
                      <tr key={task.id} onClick={() => handleOpenModal(task)} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                        <td className="px-6 py-4">
                          <div className={`font-medium ${task.status === 'done' ? 'line-through text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>{task.title}</div>
                          <div className="text-sm text-gray-500">{task.contact?.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`flex items-center space-x-2 text-sm ${priorityConfig[task.priority].iconColor}`}>
                            <Flag size={16} />
                            <span>{priorityConfig[task.priority].label}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                            {statusConfig[task.status].label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {task.due_date ? (
                            <span className="flex items-center space-x-2">
                              <Calendar size={16} />
                              <span>{format(new Date(task.due_date), 'dd/MM/yyyy')}</span>
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4">
                          {task.assignee ? (
                            <div className="flex items-center space-x-2">
                              <img src={task.assignee.avatar_url || `https://ui-avatars.com/api/?name=${task.assignee.name}`} alt={task.assignee.name} className="w-6 h-6 rounded-full" />
                              <span className="text-sm">{task.assignee.name}</span>
                            </div>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      {isModalOpen && (
        <TaskModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={() => {
            handleCloseModal();
            fetchData();
          }}
          task={selectedTask}
          users={users}
        />
      )}
    </>
  );
};
