import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingCart, MessageSquare, Clock, Loader2 } from 'lucide-react';
import { KpiCard } from './KpiCard';
import { SalesPerformanceChart } from './SalesPerformanceChart';
import { TopAgentsList } from './TopAgentsList';
import { SalesByAgentChart } from './SalesByAgentChart';
import { RecentActivity } from './RecentActivity';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface KpiData {
  metric: string;
  value: number;
  change: number;
}

export const Dashboard: React.FC = () => {
  const [kpis, setKpis] = useState<KpiData[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKpis = async () => {
      try {
        const { data, error } = await supabase.rpc('get_dashboard_kpis');
        if (error) throw error;
        setKpis(data);
      } catch (error) {
        console.error("Error fetching dashboard KPIs:", error);
        toast.error("Não foi possível carregar os indicadores do dashboard.");
      } finally {
        setLoading(false);
      }
    };

    fetchKpis();
  }, []);

  const getKpiValue = (metric: string) => kpis?.find(k => k.metric === metric);

  if (loading) {
    return (
      <div className="p-8 h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-10 h-10 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 bg-gray-50 dark:bg-gray-900 h-full overflow-y-auto">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Receita Total (Mês)"
          value={`R$ ${getKpiValue('total_revenue')?.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`}
          change={getKpiValue('total_revenue')?.change || 0}
          icon={DollarSign}
          period="vs. mês anterior"
        />
        <KpiCard
          title="Vendas (Mês)"
          value={getKpiValue('total_sales')?.value.toLocaleString('pt-BR') || '0'}
          change={getKpiValue('total_sales')?.change || 0}
          icon={ShoppingCart}
          period="vs. mês anterior"
        />
        <KpiCard
          title="Novos Tickets (Mês)"
          value={getKpiValue('new_tickets')?.value.toLocaleString('pt-BR') || '0'}
          change={getKpiValue('new_tickets')?.change || 0}
          icon={MessageSquare}
          period="vs. mês anterior"
        />
        <KpiCard
          title="Tempo Médio de Resposta"
          value={`${getKpiValue('avg_response_time')?.value.toFixed(1) || '0.0'} min`}
          change={getKpiValue('avg_response_time')?.change || 0}
          icon={Clock}
          period="vs. mês anterior"
          invertChangeColor={true}
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          <SalesPerformanceChart />
          <SalesByAgentChart />
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          <TopAgentsList />
          <RecentActivity />
        </div>
      </div>
    </div>
  );
};
