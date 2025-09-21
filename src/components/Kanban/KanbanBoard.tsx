import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { supabase, Ticket } from '../../lib/supabase';
import { TicketCard } from './TicketCard';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

type TicketStatus = 'pending' | 'open' | 'closed' | 'transferred';

const columnMap: Record<TicketStatus, string> = {
  pending: 'Pendente',
  open: 'Em Atendimento',
  closed: 'Resolvido',
  transferred: 'Transferido',
};

const columnOrder: TicketStatus[] = ['pending', 'open', 'closed', 'transferred'];

type Columns = Record<TicketStatus, {
  name: string;
  items: Ticket[];
}>;

export const KanbanBoard: React.FC = () => {
  const [columns, setColumns] = useState<Columns | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*, contact:contacts(*), user:profiles(*)')
        .in('status', ['pending', 'open', 'closed', 'transferred']);

      if (error) throw error;

      const initialColumns: Columns = {
        pending: { name: 'Pendente', items: [] },
        open: { name: 'Em Atendimento', items: [] },
        closed: { name: 'Resolvido', items: [] },
        transferred: { name: 'Transferido', items: [] },
      };

      data.forEach((ticket) => {
        if (initialColumns[ticket.status as TicketStatus]) {
          initialColumns[ticket.status as TicketStatus].items.push(ticket);
        }
      });
      
      setColumns(initialColumns);
    } catch (err) {
      toast.error('Erro ao carregar os tickets.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination || !columns) return;

    const { source, destination, draggableId } = result;

    if (source.droppableId === destination.droppableId) return;

    const startColumn = columns[source.droppableId as TicketStatus];
    const endColumn = columns[destination.droppableId as TicketStatus];
    
    const startItems = Array.from(startColumn.items);
    const [movedItem] = startItems.splice(source.index, 1);
    const endItems = Array.from(endColumn.items);
    endItems.splice(destination.index, 0, movedItem);

    const newColumns = {
      ...columns,
      [source.droppableId]: {
        ...startColumn,
        items: startItems,
      },
      [destination.droppableId]: {
        ...endColumn,
        items: endItems,
      },
    };
    setColumns(newColumns);

    const newStatus = destination.droppableId as TicketStatus;
    const { error } = await supabase
      .from('tickets')
      .update({ status: newStatus })
      .eq('id', draggableId);

    if (error) {
      toast.error('Falha ao atualizar o status do ticket.');
      // Revert state on error
      setColumns(columns);
    } else {
      toast.success(`Ticket movido para "${columnMap[newStatus]}"`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-x-auto">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex space-x-4 h-full">
          {columnOrder.map((columnId) => {
            const column = columns?.[columnId];
            if (!column) return null;
            return (
              <div key={columnId} className="w-72 bg-gray-100 rounded-lg flex flex-col">
                <h3 className="p-4 text-md font-semibold text-gray-700 border-b">{column.name} ({column.items.length})</h3>
                <Droppable droppableId={columnId}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`p-4 flex-1 overflow-y-auto ${snapshot.isDraggingOver ? 'bg-green-50' : ''}`}
                    >
                      {column.items.map((item, index) => (
                        <TicketCard key={item.id} ticket={item} index={index} />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
};
