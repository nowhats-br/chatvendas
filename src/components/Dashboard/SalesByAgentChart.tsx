import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { supabase } from '../../lib/supabase';
import { Loader2 } from 'lucide-react';

interface AgentSalesData {
  agent_name: string;
  total_sales: number;
}

const COLORS = ['#059669', '#10B981', '#34D399', '#6EE7B7', '#A7F3D0'];

export const SalesByAgentChart: React.FC = () => {
  const [data, setData] = useState<AgentSalesData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSalesData = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_sales_by_agent');
      if (error) console.error(error);
      else setData(data.slice(0, 10) || []); // Get top 10
      setLoading(false);
    };
    fetchSalesData();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Vendas por Atendente
      </h3>
      <div className="h-80">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-green-500" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.1)" />
              <XAxis type="number" tickFormatter={(value) => `R$${value/1000}k`} tick={{ fill: 'rgb(156 163 175)', fontSize: 12 }} />
              <YAxis type="category" dataKey="agent_name" width={80} tick={{ fill: 'rgb(156 163 175)', fontSize: 12 }} />
              <Tooltip
                cursor={{ fill: 'rgba(243, 244, 246, 0.5)' }}
                contentStyle={{
                  backgroundColor: 'rgba(31, 41, 55, 0.9)',
                  borderColor: 'rgba(128, 128, 128, 0.5)',
                  borderRadius: '0.75rem',
                }}
                formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 'Total de Vendas']}
              />
              <Bar dataKey="total_sales" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
