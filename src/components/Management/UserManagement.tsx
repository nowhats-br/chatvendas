import React, { useState, useEffect } from 'react';
import { supabase, Profile, Queue, Team } from '../../lib/supabase';
import { Plus, Loader2, Edit, Trash2, Users, FolderOpen, UserPlus as TeamIcon } from 'lucide-react';
import { ApiError, TeamMember, TabItem } from '../../types';
import toast from 'react-hot-toast';
import { UserEditModal } from './UserEditModal';

// Sub-component for Users
const UsersTab: React.FC = () => {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<Profile | null>(null);

    useEffect(() => {
        fetchProfiles();
    }, []);

    const fetchProfiles = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) toast.error("Erro ao carregar usuários.");
        else setProfiles(data || []);
        setLoading(false);
    };
    
    const handleEdit = (user: Profile) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const handleDelete = async (user: Profile) => {
        if (!window.confirm(`Tem certeza que deseja remover o usuário ${user.name}? Esta ação é irreversível.`)) return;
        
        setLoading(true);
        try {
            const { error } = await supabase.rpc('delete_user_profile', { target_user_id: user.id });
            if (error) throw error;
            toast.success("Perfil de usuário removido com sucesso.");
            fetchProfiles();
        } catch (error: ApiError | any) {
            const errorMessage = error?.message || "Erro ao remover usuário.";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div>
                <div className="flex justify-end mb-4">
                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2">
                        <Plus size={20} />
                        <span>Convidar Usuário</span>
                    </button>
                </div>
                {loading ? <Loader2 className="animate-spin mx-auto" /> : (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Usuário</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Função</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {profiles.map(p => (
                                    <tr key={p.id}>
                                        <td className="px-6 py-4 flex items-center space-x-3">
                                            <img src={p.avatar_url || `https://ui-avatars.com/api/?name=${p.name}`} alt={p.name} className="w-10 h-10 rounded-full" />
                                            <div>
                                                <p className="font-medium">{p.name}</p>
                                                <p className="text-sm text-gray-500">{p.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4"><span className="capitalize px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">{p.role}</span></td>
                                        <td className="px-6 py-4">
                                            <button onClick={() => handleEdit(p)} className="p-2 text-gray-400 hover:text-blue-500"><Edit size={18} /></button>
                                            <button onClick={() => handleDelete(p)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={18} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            {isModalOpen && selectedUser && (
                <UserEditModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={() => {
                        setIsModalOpen(false);
                        fetchProfiles();
                    }}
                    user={selectedUser}
                />
            )}
        </>
    );
};

// Sub-component for Queues
const QueuesTab: React.FC = () => {
    const [queues, setQueues] = useState<Queue[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchQueues();
    }, []);

    const fetchQueues = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('queues').select('*');
        if (error) toast.error("Erro ao carregar filas.");
        else setQueues(data || []);
        setLoading(false);
    };
    
    return (
        <div>
            <div className="flex justify-end mb-4">
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2">
                    <Plus size={20} />
                    <span>Nova Fila</span>
                </button>
            </div>
            {loading ? <Loader2 className="animate-spin mx-auto" /> : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {queues.map(q => (
                        <div key={q.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center space-x-3">
                                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: q.color}}></div>
                                    <h3 className="font-semibold">{q.name}</h3>
                                </div>
                                <div className="flex space-x-1">
                                    <button className="p-2 text-gray-400 hover:text-blue-500"><Edit size={16} /></button>
                                    <button className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 mt-2">{q.description || 'Sem descrição.'}</p>
                        </div>
                    ))}
                 </div>
            )}
        </div>
    );
};

// Sub-component for Teams
const TeamsTab: React.FC = () => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('teams').select('*, leader:profiles(name), team_members(count)');
        if (error) toast.error("Erro ao carregar equipes.");
        else setTeams(data as any || []);
        setLoading(false);
    };

    return (
        <div>
            <div className="flex justify-end mb-4">
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2">
                    <Plus size={20} />
                    <span>Nova Equipe</span>
                </button>
            </div>
            {loading ? <Loader2 className="animate-spin mx-auto" /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teams.map(t => (
                        <div key={t.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4">
                            <div className="flex justify-between items-start">
                                <h3 className="font-semibold">{t.name}</h3>
                                <div className="flex space-x-1">
                                    <button className="p-2 text-gray-400 hover:text-blue-500"><Edit size={16} /></button>
                                    <button className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 mt-2 line-clamp-2">{t.description || 'Sem descrição.'}</p>
                            <div className="mt-4 pt-4 border-t dark:border-gray-700 text-sm space-y-2">
                                <p><span className="font-medium text-gray-600 dark:text-gray-400">Líder:</span> {t.leader?.name || 'Não definido'}</p>
                                <p><span className="font-medium text-gray-600 dark:text-gray-400">Membros:</span> {(t.team_members?.[0] as TeamMember)?.count || 0}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


interface UserManagementProps {
  activeTab: 'users' | 'queues' | 'teams';
}

export const UserManagement: React.FC<UserManagementProps> = ({ activeTab }) => {
  const [currentTab, setCurrentTab] = useState(activeTab);

  useEffect(() => {
    setCurrentTab(activeTab);
  }, [activeTab]);
  
  const tabs: TabItem[] = [
    { id: 'users', label: 'Usuários' },
    { id: 'queues', label: 'Filas' },
    { id: 'teams', label: 'Equipes' },
  ];

  const renderContent = () => {
    switch(currentTab) {
      case 'users': return <UsersTab />;
      case 'queues': return <QueuesTab />;
      case 'teams': return <TeamsTab />;
      default: return <UsersTab />;
    }
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 h-full overflow-y-auto">
        <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Gerenciamento</h2>
            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                <nav className="-mb-px flex space-x-6">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setCurrentTab(tab.id as 'users' | 'queues' | 'teams')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                                currentTab === tab.id
                                ? 'border-green-500 text-green-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}>
                            {tab.id === 'users' && <Users size={18} />}
                            {tab.id === 'queues' && <FolderOpen size={18} />}
                            {tab.id === 'teams' && <TeamIcon size={18} />}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </nav>
            </div>
            {renderContent()}
        </div>
    </div>
  );
};
