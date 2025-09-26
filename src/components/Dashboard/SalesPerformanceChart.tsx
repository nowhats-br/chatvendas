import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabase';
import { ChartDataItem } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';

interface ChartData {
  date: string;
  total_sales: number;
}

export const SalesPerformanceChart: React.FC = () => {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_sales_performance_over_time', { interval_days: 30 });
      if (error) {
        console.error(error);
      } else {
        const formattedData = data.map((item: any) => ({
          ...item,
          date: format(new Date(item.date), 'dd/MM'),
        }));
        setData(formattedData);
      }
      setLoading(false);
    };
    fetchChartData();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Performance de Vendas (Últimos 30 dias)
      </h3>
      <div className="h-80">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-green-500" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
              <XAxis dataKey="date" tick={{ fill: 'rgb(156 163 175)', fontSize: 12 }} />
              <YAxis tickFormatter={(value) => `R$${value}`} tick={{ fill: 'rgb(156 163 175)', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(31, 41, 55, 0.9)',
                  borderColor: 'rgba(128, 128, 128, 0.5)',
                  borderRadius: '0.75rem',
                }}
                formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 'Vendas']}
              />
              <Area 
                type="monotone" 
                dataKey="total_sales" 
                stroke="#10B981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorSales)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
