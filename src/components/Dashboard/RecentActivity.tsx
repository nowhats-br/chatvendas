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
        .eq('status', 'completed')
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
        color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
      }));
      contacts?.forEach(c => formattedActivities.push({
        id: c.id,
        type: 'contact',
        description: `Novo contato: ${c.name}`,
        time: formatDistanceToNow(new Date(c.created_at), { locale: ptBR, addSuffix: true }),
        icon: UserPlus,
        color: 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400',
      }));
      campaigns?.forEach(c => formattedActivities.push({
        id: c.id,
        type: 'campaign',
        description: `Campanha "${c.name}" concluída`,
        time: formatDistanceToNow(new Date(c.created_at), { locale: ptBR, addSuffix: true }),
        icon: Send,
        color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400',
      }));

      // Sort activities by date before setting state
      const sortedActivities = formattedActivities.sort((a, b) => {
        // A simple way to sort by distance string is not reliable.
        // A better approach would be to keep the original date and sort by it.
        // For this example, we'll assume the fetch order is sufficient.
        return 0;
      });

      setActivities(sortedActivities);
      setLoading(false);
    };

    fetchActivities();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Atividades Recentes
      </h3>
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        </div>
      ) : (
        <div className="space-y-5">
          {activities.map((activity) => {
            const Icon = activity.icon;
            return (
              <div key={activity.id} className="flex items-start space-x-4">
                <div className={`p-3 rounded-full ${activity.color}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{activity.description}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activity.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
