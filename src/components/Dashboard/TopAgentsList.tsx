import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, Crown } from 'lucide-react';

interface AgentData {
  agent_id: string;
  agent_name: string;
  agent_avatar: string;
  total_sales: number;
}

export const TopAgentsList: React.FC = () => {
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopAgents = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_top_performing_agents', { limit_count: 5 });
      if (error) console.error(error);
      else setAgents(data || []);
      setLoading(false);
    };
    fetchTopAgents();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Top Atendentes por Vendas</h3>
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        </div>
      ) : (
        <ul className="space-y-4">
          {agents.map((agent, index) => (
            <li key={agent.agent_id} className="flex items-center space-x-4">
              <span className="font-bold text-lg text-gray-400 dark:text-gray-500 w-6">#{index + 1}</span>
              <img
                src={agent.agent_avatar || `https://ui-avatars.com/api/?name=${agent.agent_name}&background=random`}
                alt={agent.agent_name}
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1">
                <p className="font-semibold text-gray-800 dark:text-gray-200">{agent.agent_name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  R$ {agent.total_sales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              {index === 0 && <Crown className="text-yellow-400" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
