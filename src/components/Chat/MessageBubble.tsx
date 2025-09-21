import React from 'react';
import { Check, CheckCheck, Clock, Download, File } from 'lucide-react';
import { Message } from '../../lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isFromContact = message.is_from_contact;
  
  const getDeliveryIcon = () => {
    switch (message.delivery_status) {
      case 'sent':
        return <Check size={16} className="text-gray-400" />;
      case 'delivered':
        return <CheckCheck size={16} className="text-gray-400" />;
      case 'read':
        return <CheckCheck size={16} className="text-blue-500" />;
      default:
        return <Clock size={16} className="text-gray-400" />;
    }
  };

  const renderMedia = () => {
    if (!message.media_url) return null;
    
    switch (message.message_type) {
      case 'image':
        return <img src={message.media_url} alt="Imagem" className="max-w-full h-auto rounded-lg mt-1" />;
      case 'document':
        return (
          <a href={message.media_url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 bg-gray-100 dark:bg-gray-600 p-3 rounded-lg mt-1 hover:bg-gray-200 dark:hover:bg-gray-500">
            <File size={32} className="text-gray-500 dark:text-gray-300" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{message.content}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{message.media_mimetype}</p>
            </div>
            <Download size={20} className="text-gray-500 dark:text-gray-300" />
          </a>
        );
      case 'audio':
        return <audio controls src={message.media_url} className="w-full mt-1" />;
      case 'video':
        return <video controls src={message.media_url} className="w-full max-h-60 rounded-lg mt-1" />;
      default:
        return null;
    }
  };

  return (
    <div className={`flex ${isFromContact ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-xs lg:max-w-xl px-3 py-2 rounded-lg shadow-sm ${
        isFromContact 
          ? 'bg-white dark:bg-gray-700' 
          : 'bg-whatsapp-light dark:bg-whatsapp-teal'
      }`}>
        <div className="break-words">
          {message.message_type === 'text' ? (
            <p className="text-sm text-gray-800 dark:text-gray-100">{message.content}</p>
          ) : (
            <div>
              {renderMedia()}
              {message.content && message.message_type !== 'document' && (
                <p className="text-sm mt-1 text-gray-800 dark:text-gray-100">{message.content}</p>
              )}
            </div>
          )}
        </div>

        <div className={`flex items-center justify-end space-x-1.5 mt-1 text-xs ${
          isFromContact ? 'text-gray-500 dark:text-gray-400' : 'text-gray-500 dark:text-gray-300'
        }`}>
          <span>
            {format(new Date(message.created_at), 'HH:mm', { locale: ptBR })}
          </span>
          {!isFromContact && getDeliveryIcon()}
        </div>
      </div>
    </div>
  );
};
