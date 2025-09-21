import React, { useState, useEffect } from 'react';
import { MessageSquare, Users, Send, BarChart3, Loader2 } from 'lucide-react';
import { StatsCard } from './StatsCard';
import { MessagesChart } from './MessagesChart';
import { RecentActivity } from './RecentActivity';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalMessages: number;
  totalContacts: number;
  activeCampaigns: number;
  responseRate: number;
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { count: messagesCount } = await supabase.from('messages').select('*', { count: 'exact', head: true });
        const { count: contactsCount } = await supabase.from('contacts').select('*', { count: 'exact', head: true });
        const { count: campaignsCount } = await supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('status', 'sending');
        
        // Placeholder for response rate
        const responseRate = 87;

        setStats({
          totalMessages: messagesCount || 0,
          totalContacts: contactsCount || 0,
          activeCampaigns: campaignsCount || 0,
          responseRate: responseRate,
        });

      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        toast.error("Não foi possível carregar as estatísticas.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Mensagens Enviadas"
          value={stats?.totalMessages.toLocaleString() || '0'}
          icon={MessageSquare}
          color="green"
        />
        <StatsCard
          title="Contatos Ativos"
          value={stats?.totalContacts.toLocaleString() || '0'}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Campanhas Ativas"
          value={stats?.activeCampaigns.toLocaleString() || '0'}
          icon={Send}
          color="purple"
        />
        <StatsCard
          title="Taxa de Resposta"
          value={`${stats?.responseRate || 0}%`}
          icon={BarChart3}
          color="orange"
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MessagesChart />
        </div>
        <div>
          <RecentActivity />
        </div>
      </div>
    </div>
  );
};
