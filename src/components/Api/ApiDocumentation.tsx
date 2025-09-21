import React, { useState } from 'react';
import { Key, Copy, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export const ApiDocumentation: React.FC = () => {
  const [apiKey, setApiKey] = useState('whz_live_********************');

  const generateNewKey = () => {
    setApiKey(`whz_live_${[...Array(20)].map(() => Math.random().toString(36)[2]).join('')}`);
    toast.success("Nova chave de API gerada!");
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey);
    toast.success("Chave de API copiada!");
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 h-full">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">API & Webhooks</h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h3 className="font-bold text-lg mb-2">Sua Chave de API</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Use esta chave para autenticar suas requisições na API. Mantenha-a segura!</p>
          <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
            <Key className="text-gray-500" />
            <code className="flex-1 font-mono text-sm">{apiKey}</code>
            <button onClick={copyToClipboard} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"><Copy size={16} /></button>
            <button onClick={generateNewKey} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"><RefreshCw size={16} /></button>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-bold text-lg mb-2">Documentação</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Nossa documentação completa da API contém tudo que você precisa para integrar o Whazing com seus sistemas.</p>
          <a href="#" className="mt-4 inline-block bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 font-medium">Acessar Documentação</a>
        </div>
      </div>
    </div>
  );
};
