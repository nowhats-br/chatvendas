import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Mic, Smile, ArrowLeft, MoreVertical, RotateCcw, CheckCircle, ArrowRightLeft, CalendarPlus, ShoppingCart } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Ticket, Message } from '../../lib/supabase';
import { TicketSidebar } from './TicketSidebar';
import { MessageBubble } from '../MessageBubble';
import { QuickReplies } from './QuickReplies';
import { SalesModal } from '../Sales/SalesModal';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { v4 as uuidv4 } from 'uuid';
import { ApiError } from '../../types';

interface ChatInterfaceProps {
  selectedTicket: Ticket | null;
  onBackToList: () => void;
  onUpdateTicket: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ selectedTicket, onBackToList, onUpdateTicket }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file || !selectedTicket) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${user!.id}/${selectedTicket.id}/${fileName}`;

    toast.loading('Enviando arquivo...');
    const { error: uploadError } = await supabase.storage.from('media').upload(filePath, file);

    if (uploadError) {
      toast.dismiss();
      toast.error('Falha ao enviar arquivo.');
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(filePath);
    
    await supabase.from('messages').insert({
      ticket_id: selectedTicket.id,
      user_id: user!.id,
      content: file.name,
      message_type: file.type.startsWith('image/') ? 'image' : 'document',
      media_url: publicUrl,
      media_mimetype: file.type,
      is_from_contact: false,
    });
    
    toast.dismiss();
    toast.success('Arquivo enviado!');
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, noClick: true, noKeyboard: true });

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages();
      const subscription = supabase
        .channel(`messages:${selectedTicket.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `ticket_id=eq.${selectedTicket.id}` }, 
          (payload) => {
            setMessages(currentMessages => [...currentMessages, payload.new as Message]);
            scrollToBottom();
          }
        )
        .subscribe();
      return () => { supabase.removeChannel(subscription); };
    } else {
      setMessages([]);
    }
  }, [selectedTicket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    if (!selectedTicket) return;
    setLoading(true);
    const { data, error } = await supabase.from('messages').select('*, user:profiles(*), contact:contacts(*)').eq('ticket_id', selectedTicket.id).order('created_at');
    if (error) toast.error("Erro ao carregar mensagens.");
    else setMessages(data || []);
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket || !user) return;
    const tempId = uuidv4();
    const tempMessage: Message = {
        id: tempId,
        ticket_id: selectedTicket.id,
        user_id: user.id,
        content: newMessage,
        message_type: 'text',
        is_from_contact: false,
        created_at: new Date().toISOString(),
        delivery_status: 'sent',
        user: user,
        contact: selectedTicket.contact
    };
    setMessages(current => [...current, tempMessage]);
    setNewMessage('');
    
    const { error } = await supabase.from('messages').insert({ ticket_id: selectedTicket.id, user_id: user.id, content: newMessage, message_type: 'text' });
    
    if (error) {
        toast.error("Erro ao enviar mensagem.");
        setMessages(current => current.filter(m => m.id !== tempId));
    }
  };

  const handleTicketAction = async (status: 'closed' | 'open') => {
    if (!selectedTicket) return;
    const { error } = await supabase.from('tickets').update({ status }).eq('id', selectedTicket.id);
    if (error) {
      toast.error(`Falha ao ${status === 'closed' ? 'resolver' : 'reabrir'} o ticket.`);
    } else {
      toast.success(`Ticket ${status === 'closed' ? 'resolvido' : 'reaberto'}!`);
      onUpdateTicket();
    }
  };
  
  const handleRecordAudio = () => {
    toast.success('Funcionalidade de gravação de áudio em desenvolvimento!');
  }

  const handleSaleCreated = (saleTotal: number) => {
    if (!selectedTicket || !user) return;
    const saleMessage = `Venda de R$ ${saleTotal.toFixed(2)} registrada.`;
    supabase.from('messages').insert({
      ticket_id: selectedTicket.id,
      user_id: user.id,
      content: saleMessage,
      message_type: 'system',
      is_from_contact: false,
    }).then();
  };

  if (!selectedTicket) {
    return (
      <div className="flex-1 flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 hidden lg:flex" style={{ backgroundImage: 'url(/bg-chat.png)', backgroundSize: 'contain', backgroundRepeat: 'repeat' }}>
        <div className="text-center bg-white dark:bg-gray-800 p-10 rounded-lg shadow-lg">
          <img src="/logo-connect.svg" alt="Whazing Connect" className="mx-auto mb-4 w-48" />
          <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">Mantenha seu time conectado</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm">Selecione uma conversa para começar a atender seus clientes com a melhor plataforma do mercado.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div {...getRootProps()} className={`flex-1 flex flex-col h-full bg-gray-100 dark:bg-gray-800/50 ${isDragActive ? 'outline-dashed outline-2 outline-offset-[-10px] outline-green-500' : ''}`} style={{ backgroundImage: 'url(/bg-chat.png)', backgroundSize: 'contain', backgroundRepeat: 'repeat' }}>
        <input {...getInputProps()} />
        {/* Chat Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <button onClick={onBackToList} className="lg:hidden p-2 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><ArrowLeft size={20} /></button>
            <img className="w-10 h-10 rounded-full" src={selectedTicket.contact?.avatar_url || `https://ui-avatars.com/api/?name=${selectedTicket.contact?.name || 'C'}&background=10B981&color=fff`} alt="Avatar" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">{selectedTicket.contact?.name || selectedTicket.contact?.phone}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Protocolo: {selectedTicket.protocol}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button onClick={() => setIsSalesModalOpen(true)} className="p-2 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full" title="Registrar Venda"><ShoppingCart size={18} /></button>
            <button onClick={() => handleTicketAction('open')} className="p-2 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full" title="Reabrir"><RotateCcw size={18} /></button>
            <button className="p-2 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full" title="Agendar"><CalendarPlus size={18} /></button>
            <button className="p-2 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full" title="Transferir"><ArrowRightLeft size={18} /></button>
            <button onClick={() => handleTicketAction('closed')} className="p-2 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full" title="Resolver"><CheckCircle size={18} /></button>
            <button onClick={() => setShowSidebar(!showSidebar)} className="p-2 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><MoreVertical size={20} /></button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Messages Area */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loading ? <div className="flex justify-center items-center h-full"><Loader2 className="w-6 h-6 animate-spin text-green-600" /></div> : messages.map((message) => <MessageBubble key={message.id} message={message} />)}
              <div ref={messagesEndRef} />
            </div>
            <QuickReplies onSelectReply={(content) => setNewMessage(prev => prev + content)} />
            {/* Message Input */}
            <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 flex-shrink-0">
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><Smile size={24} /></button>
                <label htmlFor="file-upload" className="p-2 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full cursor-pointer"><Paperclip size={24} /></label>
                <div className="flex-1 relative">
                  <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())} placeholder="Digite uma mensagem" className="w-full px-4 py-2.5 border-none rounded-lg bg-gray-100 dark:bg-gray-700 focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
                {newMessage ? (
                  <button onClick={sendMessage} disabled={!newMessage.trim() || loading} className="bg-green-600 text-white p-3 rounded-full hover:bg-green-700 disabled:opacity-50"><Send size={20} /></button>
                ) : (
                  <button onClick={handleRecordAudio} className="p-2 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><Mic size={24} /></button>
                )}
              </div>
            </div>
          </div>
          {showSidebar && <TicketSidebar ticket={selectedTicket} onClose={() => setShowSidebar(false)} />}
        </div>
      </div>
      {isSalesModalOpen && selectedTicket && (
        <SalesModal
          isOpen={isSalesModalOpen}
          onClose={() => setIsSalesModalOpen(false)}
          ticket={selectedTicket}
          onSaleCreated={handleSaleCreated}
        />
      )}
    </>
  );
};
