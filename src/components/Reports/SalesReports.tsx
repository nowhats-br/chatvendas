import React, { useState, useEffect } from 'react';
import { supabase, Sale } from '../../lib/supabase';
import { Loader2, DollarSign, ShoppingBag, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { StatsCard } from '../Dashboard/StatsCard';

export const SalesReports: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('sales').select('*, sale_items(*, product:products(*))').order('created_at', { ascending: false });
    if (error) console.error(error);
    else setSales(data || []);
    setLoading(false);
  };

  const totalRevenue = sales.reduce((acc, sale) => acc + sale.total_amount, 0);
  const totalSales = sales.length;
  const uniqueCustomers = new Set(sales.map(s => s.contact_id)).size;

  const salesByDay = sales.reduce((acc, sale) => {
    const day = format(new Date(sale.created_at), 'dd/MM');
    acc[day] = (acc[day] || 0) + sale.total_amount;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(salesByDay).map(([date, total]) => ({ date, total })).reverse();

  if (loading) {
    return <div className="p-6 h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-green-600" /></div>;
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 h-full overflow-y-auto">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Relatórios de Vendas</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatsCard title="Receita Total" value={`R$ ${totalRevenue.toFixed(2)}`} icon={DollarSign} color="green" />
        <StatsCard title="Total de Vendas" value={totalSales} icon={ShoppingBag} color="blue" />
        <StatsCard title="Clientes Únicos" value={uniqueCustomers} icon={Users} color="purple" />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Vendas por Dia</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
              <XAxis dataKey="date" tick={{ fill: 'rgb(156 163 175)' }} />
              <YAxis tickFormatter={(value) => `R$${value}`} tick={{ fill: 'rgb(156 163 175)' }} />
              <Tooltip formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Total']} contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', borderColor: 'rgba(128, 128, 128, 0.5)' }} />
              <Legend />
              <Bar dataKey="total" fill="#059669" name="Total Vendido" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold p-6">Últimas Vendas</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Itens</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sales.slice(0, 10).map(sale => (
                <tr key={sale.id}>
                  <td className="px-6 py-4">{format(new Date(sale.created_at), 'dd/MM/yy HH:mm', { locale: ptBR })}</td>
                  <td className="px-6 py-4">{sale.contact?.name || 'N/A'}</td>
                  <td className="px-6 py-4">{sale.sale_items?.reduce((acc, item) => acc + item.quantity, 0)}</td>
                  <td className="px-6 py-4 font-bold">R$ {sale.total_amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
