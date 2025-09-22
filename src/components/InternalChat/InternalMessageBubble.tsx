import React from 'react';
import { InternalMessage } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface InternalMessageBubbleProps {
  message: InternalMessage;
}

export const InternalMessageBubble: React.FC<InternalMessageBubbleProps> = ({ message }) => {
  const { user } = useAuth();
  const isMe = message.user_id === user?.id;

  return (
    <div className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
      {!isMe && (
        <img
          src={message.user?.avatar_url || `https://ui-avatars.com/api/?name=${message.user?.name}&background=random`}
          alt={message.user?.name}
          className="w-8 h-8 rounded-full"
        />
      )}
      <div className={`max-w-xl px-4 py-2 rounded-lg shadow-sm ${isMe ? 'bg-green-600 text-white rounded-br-none' : 'bg-white dark:bg-gray-700 rounded-bl-none'}`}>
        {!isMe && <p className="text-xs font-bold text-green-500 mb-1">{message.user?.name}</p>}
        <p className="text-sm break-words">{message.content}</p>
        <p className={`text-xs mt-1 text-right ${isMe ? 'text-green-100' : 'text-gray-400'}`}>
          {format(new Date(message.created_at), 'HH:mm', { locale: ptBR })}
        </p>
      </div>
    </div>
  );
};
