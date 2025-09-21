import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabase';
import { subDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChartData {
  date: string;
  messages: number;
}

export const MessagesChart: React.FC = () => {
  const [data, setData] = useState<ChartData[]>([]);

  useEffect(() => {
    const fetchChartData = async () => {
      const dateArray = Array.from({ length: 10 }, (_, i) => subDays(new Date(), i)).reverse();
      const promises = dateArray.map(async (date) => {
        const start = date.toISOString().slice(0, 10) + 'T00:00:00.000Z';
        const end = date.toISOString().slice(0, 10) + 'T23:59:59.999Z';
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', start)
          .lte('created_at', end);
        return {
          date: format(date, 'dd/MM'),
          messages: count || 0,
        };
      });
      const chartData = await Promise.all(promises);
      setData(chartData);
    };
    fetchChartData();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Mensagens dos Últimos 10 Dias
      </h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
            <XAxis dataKey="date" tick={{ fill: 'rgb(156 163 175)' }} />
            <YAxis tick={{ fill: 'rgb(156 163 175)' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(31, 41, 55, 0.8)',
                borderColor: 'rgba(128, 128, 128, 0.5)',
                color: '#fff',
              }}
            />
            <Area 
              type="monotone" 
              dataKey="messages" 
              stroke="#059669" 
              fill="#059669" 
              fillOpacity={0.1}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
