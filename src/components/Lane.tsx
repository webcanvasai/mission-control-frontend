import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Ticket, TicketStatus } from '../types/ticket';
import { STATUS_LABELS } from '../types/ticket';
import { TicketCard } from './TicketCard';
import clsx from 'clsx';

interface LaneProps {
  status: TicketStatus;
  tickets: Ticket[];
  onTicketClick: (ticket: Ticket) => void;
}

const LANE_COLORS: Record<TicketStatus, string> = {
  'backlog': 'border-t-gray-500',
  'groomed': 'border-t-purple-500',
  'todo': 'border-t-blue-500',
  'in-progress': 'border-t-yellow-500',
  'done': 'border-t-green-500',
};

export function Lane({ status, tickets, onTicketClick }: LaneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  const ticketIds = tickets.map(t => t.id);

  return (
    <div
      className={clsx(
        'lane bg-gray-850 rounded-lg border-t-4 min-w-[280px] max-w-[320px] flex flex-col',
        'bg-gray-800/50',
        LANE_COLORS[status],
        isOver && 'ring-2 ring-blue-500 ring-opacity-50'
      )}
    >
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-200">{STATUS_LABELS[status]}</h3>
          <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">
            {tickets.length}
          </span>
        </div>
      </div>
      
      <div
        ref={setNodeRef}
        className="lane-content flex-1 overflow-y-auto p-2 space-y-2 min-h-[200px]"
      >
        <SortableContext items={ticketIds} strategy={verticalListSortingStrategy}>
          {tickets.map(ticket => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onClick={onTicketClick}
            />
          ))}
        </SortableContext>
        
        {tickets.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-8">
            No tickets
          </div>
        )}
      </div>
    </div>
  );
}
