import React, { useState, useEffect } from 'react';
import { supabase, Contact, Ticket, Sale } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { X, Save, User, FileText, ShoppingCart, Loader2, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ApiError } from '../../types';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  contact: Contact | null;
  onNavigateToChat: (ticket: Ticket) => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose, onSave, contact, onNavigateToChat }) => {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [createTask, setCreateTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [activeTab, setActiveTab] = useState('details');
  const [ticketHistory, setTicketHistory] = useState<Ticket[]>([]);
  const [salesHistory, setSalesHistory] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (contact) {
      setFormData({ name: contact.name || '', phone: contact.phone, email: contact.email || '' });
      fetchHistory(contact.id);
    } else {
      setFormData({ name: '', phone: '', email: '' });
      setTicketHistory([]);
      setSalesHistory([]);
    }
    setActiveTab('details');
  }, [contact, isOpen]);

  const fetchHistory = async (contactId: string) => {
    const { data: tickets } = await supabase.from('tickets').select('*').eq('contact_id', contactId).order('created_at', { ascending: false });
    setTicketHistory(tickets || []);
    const { data: sales } = await supabase.from('sales').select('*, sale_items(*)').eq('contact_id', contactId).order('created_at', { ascending: false });
    setSalesHistory(sales || []);
  };

  const handleSaveContact = async () => {
    if (!formData.name || !formData.phone) {
      toast.error('Nome e telefone são obrigatórios.');
      return;
    }
    setLoading(true);

    try {
      let query = supabase.from('contacts').select('id').eq('phone', formData.phone);
      if (contact) {
        query = query.neq('id', contact.id);
      }
      const { data: existingContact, error: checkError } = await query.maybeSingle();

      if (checkError) throw checkError;
      if (existingContact) {
        toast.error('Este número de telefone já está cadastrado.');
        setLoading(false);
        return;
      }

      const contactData = {
        id: contact?.id,
        ...formData,
      };
      const { data: savedContact, error: contactError } = await supabase.from('contacts').upsert(contactData).select().single();
      if (contactError) throw contactError;

      if (createTask && taskTitle) {
        const { error: taskError } = await supabase.from('tasks').insert({ user_id: user!.id, title: taskTitle, contact_id: savedContact.id });
        if (taskError) throw taskError;
      }

      toast.success(`Contato ${contact ? 'atualizado' : 'criado'} com sucesso!`);
      
      if (!contact) {
        const protocol = `WA-${Date.now()}`;
        const { data: newTicket, error: ticketError } = await supabase
          .from('tickets')
          .insert({ contact_id: savedContact.id, user_id: user!.id, status: 'open', protocol, subject: 'Ticket de Boas-Vindas' })
          .select('*, contact:contacts(*)')
          .single();
        if (ticketError) throw ticketError;
        
        toast.success('Ticket de exemplo criado!');
        onNavigateToChat(newTicket);
      }

      onSave();
    } catch (error: ApiError | any) {
      const errorMessage = error?.message || 'Erro ao salvar contato';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async () => {
    if (!contact || !user) return;
    setLoading(true);
    try {
      let { data: existingTicket } = await supabase
        .from('tickets')
        .select(`*, contact:contacts(*)`)
        .eq('contact_id', contact.id)
        .in('status', ['open', 'pending'])
        .maybeSingle();

      if (existingTicket) {
        onNavigateToChat(existingTicket);
      } else {
        const protocol = `WA-${Date.now()}`;
        const { data: newTicket, error: newTicketError } = await supabase
          .from('tickets')
          .insert({ contact_id: contact.id, user_id: user.id, status: 'open', protocol })
          .select(`*, contact:contacts(*)`)
          .single();
        if (newTicketError) throw newTicketError;
        onNavigateToChat(newTicket!);
      }
      onClose();
    } catch (err) {
      toast.error("Não foi possível iniciar a conversa.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full flex flex-col">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center flex-shrink-0">
          <h2 className="text-lg font-semibold">{contact ? 'Editar Contato' : 'Novo Contato'}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><X size={20} /></button>
        </div>
        
        <div className="flex border-b dark:border-gray-700 flex-shrink-0">
          <button onClick={() => setActiveTab('details')} className={`flex-1 p-3 text-sm font-medium flex items-center justify-center space-x-2 ${activeTab === 'details' ? 'border-b-2 border-green-500 text-green-500' : 'text-gray-500'}`}><User size={16}/><span>Detalhes</span></button>
          <button onClick={() => setActiveTab('tickets')} disabled={!contact} className={`flex-1 p-3 text-sm font-medium flex items-center justify-center space-x-2 ${activeTab === 'tickets' ? 'border-b-2 border-green-500 text-green-500' : 'text-gray-500'} disabled:opacity-50 disabled:cursor-not-allowed`}><FileText size={16}/><span>Tickets</span></button>
          <button onClick={() => setActiveTab('sales')} disabled={!contact} className={`flex-1 p-3 text-sm font-medium flex items-center justify-center space-x-2 ${activeTab === 'sales' ? 'border-b-2 border-green-500 text-green-500' : 'text-gray-500'} disabled:opacity-50 disabled:cursor-not-allowed`}><ShoppingCart size={16}/><span>Vendas</span></button>
        </div>

        <div className="p-6 overflow-y-auto min-h-[20rem]">
          {activeTab === 'details' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome*</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border rounded bg-transparent dark:border-gray-600" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Telefone*</label>
                <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-2 border rounded bg-transparent dark:border-gray-600" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-2 border rounded bg-transparent dark:border-gray-600" />
              </div>
              <div className="pt-2">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={createTask} onChange={e => setCreateTask(e.target.checked)} className="rounded text-green-500 focus:ring-green-500" />
                  <span>Criar tarefa de acompanhamento</span>
                </label>
                {createTask && (
                  <input type="text" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} placeholder="Título da tarefa..." className="w-full p-2 border rounded bg-transparent mt-2 dark:border-gray-600" />
                )}
              </div>
            </div>
          )}
          {activeTab === 'tickets' && (
            <div>
              <h3 className="font-semibold mb-3">Histórico de Tickets</h3>
              <ul className="space-y-2">
                {ticketHistory.length > 0 ? ticketHistory.map(t => (
                  <li key={t.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="font-medium">{t.subject || t.protocol}</p>
                    <p className="text-sm text-gray-500">Status: {t.status} - Em {format(new Date(t.created_at), 'dd/MM/yyyy', {locale: ptBR})}</p>
                  </li>
                )) : <p className="text-gray-500">Nenhum histórico de tickets encontrado.</p>}
              </ul>
            </div>
          )}
          {activeTab === 'sales' && (
            <div>
              <h3 className="font-semibold mb-3">Histórico de Vendas</h3>
              <ul className="space-y-2">
                {salesHistory.length > 0 ? salesHistory.map(s => (
                  <li key={s.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex justify-between items-center">
                      <p className="font-medium">Venda #{s.id.slice(0, 8)}</p>
                      <p className="font-bold text-green-600">R$ {s.total_amount.toFixed(2)}</p>
                    </div>
                    <p className="text-sm text-gray-500">Status: {s.status} - Em {format(new Date(s.created_at), 'dd/MM/yyyy', {locale: ptBR})}</p>
                    <p className="text-sm text-gray-500">{s.sale_items?.length} item(ns)</p>
                  </li>
                )) : <p className="text-gray-500">Nenhum histórico de vendas encontrado.</p>}
              </ul>
            </div>
          )}
        </div>

        <div className="p-4 border-t dark:border-gray-700 flex justify-between items-center flex-shrink-0">
          <div>
            {contact && (
              <button onClick={handleStartChat} disabled={loading} className="px-4 py-2 bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/80 flex items-center space-x-2 disabled:opacity-50">
                <MessageSquare size={18} />
                <span>Iniciar Conversa</span>
              </button>
            )}
          </div>
          <div className="flex space-x-3">
            <button onClick={onClose} className="px-4 py-2 border rounded-lg dark:border-gray-600">Cancelar</button>
            <button onClick={handleSaveContact} disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 disabled:opacity-50">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              <span>Salvar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
