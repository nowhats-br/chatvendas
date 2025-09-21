import React, { useState } from 'react';
import { X, User, Star, FileText, Tag, Kanban, Wallet, ArrowRight, RotateCcw } from 'lucide-react';
import { Ticket } from '../../lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TicketSidebarProps {
  ticket: Ticket;
  onClose: () => void;
}

export const TicketSidebar: React.FC<TicketSidebarProps> = ({ ticket, onClose }) => {
  const [activeTab, setActiveTab] = useState<'protocol' | 'rating' | 'notes' | 'tags' | 'kanban' | 'wallet'>('protocol');
  const [notes, setNotes] = useState(ticket.notes || '');
  const [tags, setTags] = useState(ticket.tags || []);

  const tabs = [
    { id: 'protocol', label: 'Protocolo', icon: FileText },
    { id: 'rating', label: 'Avaliação', icon: Star },
    { id: 'notes', label: 'Notas', icon: FileText },
    { id: 'tags', label: 'Etiquetas', icon: Tag },
    { id: 'kanban', label: 'Kanban', icon: Kanban },
    { id: 'wallet', label: 'Carteira', icon: Wallet },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'protocol':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Protocolo
              </label>
              <p className="text-sm text-gray-900">{ticket.protocol}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                ticket.status === 'open' ? 'bg-green-100 text-green-800' :
                ticket.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                ticket.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {ticket.status === 'open' ? 'Aberto' :
                 ticket.status === 'pending' ? 'Pendente' :
                 ticket.status === 'closed' ? 'Fechado' : 'Transferido'}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Criado em
              </label>
              <p className="text-sm text-gray-900">
                {format(new Date(ticket.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </p>
            </div>

            {ticket.started_at && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Iniciado em
                </label>
                <p className="text-sm text-gray-900">
                  {format(new Date(ticket.started_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </p>
              </div>
            )}

            <div className="pt-4 space-y-2">
              <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                <RotateCcw size={16} />
                <span>Reabrir Ticket</span>
              </button>
              
              <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <ArrowRight size={16} />
                <span>Transferir</span>
              </button>
            </div>
          </div>
        );

      case 'rating':
        return (
          <div className="space-y-4">
            {ticket.rating ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Avaliação do Cliente
                </label>
                <div className="flex space-x-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={20}
                      className={star <= ticket.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                    />
                  ))}
                </div>
                {ticket.rating_comment && (
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {ticket.rating_comment}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Star size={48} className="mx-auto text-gray-400 mb-3" />
                <p className="text-gray-500">Ainda não avaliado</p>
              </div>
            )}
          </div>
        );

      case 'notes':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas do Atendimento
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione notas sobre este atendimento..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={6}
              />
            </div>
            <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Salvar Notas
            </button>
          </div>
        );

      case 'tags':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Etiquetas
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Adicionar etiqueta..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value) {
                    setTags([...tags, e.currentTarget.value]);
                    e.currentTarget.value = '';
                  }
                }}
              />
            </div>
          </div>
        );

      case 'kanban':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <Kanban size={48} className="mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500">Status visual do ticket</p>
            </div>
            
            <div className="space-y-2">
              {['Novo', 'Em Andamento', 'Aguardando Cliente', 'Resolvido'].map((status) => (
                <div
                  key={status}
                  className={`p-3 rounded-lg border-2 ${
                    status === 'Em Andamento' ? 'border-green-500 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <p className="text-sm font-medium">{status}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'wallet':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <Wallet size={48} className="mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500">Informações financeiras</p>
            </div>
            
            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Valor Total</p>
                <p className="text-lg font-bold text-gray-900">R$ 0,00</p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Status</p>
                <p className="text-sm font-medium text-gray-700">Sem pendências</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Detalhes</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contact Info */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
            <span className="text-white font-medium">
              {ticket.contact?.name?.charAt(0) || 'U'}
            </span>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">
              {ticket.contact?.name || 'Usuário'}
            </h4>
            <p className="text-sm text-gray-500">{ticket.contact?.phone}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-gray-100 rounded-lg p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex flex-col items-center p-2 text-xs font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon size={16} className="mb-1" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {renderTabContent()}
      </div>
    </div>
  );
};
