import React, { useState, useEffect } from 'react';
import { MessageSquare, UserPlus, Send, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Activity {
  id: string;
  type: 'message' | 'contact' | 'campaign';
  description: string;
  time: string;
  icon: React.ElementType;
  color: string;
}

export const RecentActivity: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('id, content, created_at, contact:contacts(name)')
        .order('created_at', { ascending: false })
        .limit(2);
      
      const { data: contacts, error: cttError } = await supabase
        .from('contacts')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })
        .limit(2);
      
      const { data: campaigns, error: cmpError } = await supabase
        .from('campaigns')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })
        .limit(1);

      if (msgError || cttError || cmpError) {
        console.error("Error fetching activities");
        setLoading(false);
        return;
      }

      const formattedActivities: Activity[] = [];
      messages?.forEach(m => formattedActivities.push({
        id: m.id,
        type: 'message',
        description: `Nova mensagem de ${m.contact?.name || 'desconhecido'}`,
        time: formatDistanceToNow(new Date(m.created_at), { locale: ptBR, addSuffix: true }),
        icon: MessageSquare,
        color: 'text-blue-500',
      }));
      contacts?.forEach(c => formattedActivities.push({
        id: c.id,
        type: 'contact',
        description: `Novo contato: ${c.name}`,
        time: formatDistanceToNow(new Date(c.created_at), { locale: ptBR, addSuffix: true }),
        icon: UserPlus,
        color: 'text-green-500',
      }));
      campaigns?.forEach(c => formattedActivities.push({
        id: c.id,
        type: 'campaign',
        description: `Campanha "${c.name}" iniciada`,
        time: formatDistanceToNow(new Date(c.created_at), { locale: ptBR, addSuffix: true }),
        icon: Send,
        color: 'text-purple-500',
      }));

      setActivities(formattedActivities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()));
      setLoading(false);
    };

    fetchActivities();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Atividades Recentes
      </h3>
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="w-6 h-6 animate-spin text-green-600" />
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activity.icon;
            return (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`p-2 rounded-full bg-gray-100 dark:bg-gray-700 ${activity.color}`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-gray-100">{activity.description}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activity.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <button className="w-full mt-4 text-sm text-green-600 hover:text-green-700 font-medium dark:text-green-400 dark:hover:text-green-300">
        Ver todas as atividades
      </button>
    </div>
  );
};
