import React from 'react';
import { Ticket } from '../../lib/supabase';
import { Draggable } from '@hello-pangea/dnd';
import { User, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TicketCardProps {
  ticket: Ticket;
  index: number;
}

export const TicketCard: React.FC<TicketCardProps> = ({ ticket, index }) => {
  return (
    <Draggable draggableId={ticket.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4 ${
            snapshot.isDragging ? 'shadow-lg ring-2 ring-green-500' : ''
          }`}
        >
          <p className="font-semibold text-gray-800 text-sm mb-2">{ticket.subject || ticket.protocol}</p>
          <div className="flex items-center space-x-2 text-xs text-gray-600 mb-3">
            <User size={14} />
            <span>{ticket.contact?.name || ticket.contact?.phone}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <Clock size={14} />
              <span>
                {formatDistanceToNow(new Date(ticket.updated_at!), { addSuffix: true, locale: ptBR })}
              </span>
            </div>
            {ticket.user?.avatar_url ? (
              <img src={ticket.user.avatar_url} alt={ticket.user.name} className="w-6 h-6 rounded-full" />
            ) : (
              <div className="w-6 h-6 bg-blue-200 text-blue-800 flex items-center justify-center rounded-full text-xs font-bold">
                {ticket.user?.name?.charAt(0) || 'A'}
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};
