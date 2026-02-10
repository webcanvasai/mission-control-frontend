import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Ticket } from '../types/ticket';
import { PRIORITY_COLORS, PROJECT_COLORS } from '../types/ticket';
import { formatDistanceToNow } from 'date-fns';
import { GripVertical, Loader2, CheckCircle, AlertCircle, Clock, Sparkles } from 'lucide-react';
import clsx from 'clsx';

interface TicketCardProps {
  ticket: Ticket;
  onClick: (ticket: Ticket) => void;
}

export function TicketCard({ ticket, onClick }: TicketCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ticket.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const groomingIcon = () => {
    if (!ticket.grooming) return null;
    
    switch (ticket.grooming.status) {
      case 'pending':
        return <span title="Grooming pending"><Clock className="w-3 h-3 text-yellow-400" /></span>;
      case 'in-progress':
        return <span title="Grooming in progress"><Loader2 className="w-3 h-3 text-blue-400 animate-spin" /></span>;
      case 'complete':
        return <span title="Grooming complete"><CheckCircle className="w-3 h-3 text-green-400" /></span>;
      case 'failed':
        return <span title={`Grooming failed: ${ticket.grooming.lastError || 'Unknown error'}`}><AlertCircle className="w-3 h-3 text-red-400" /></span>;
      case 'manual':
        return <span title="Manually groomed"><Sparkles className="w-3 h-3 text-purple-400" /></span>;
      default:
        return null;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        'bg-gray-800 rounded-lg p-3 shadow-md border border-gray-700',
        'hover:border-gray-600 cursor-pointer transition-all',
        isDragging && 'opacity-50 shadow-lg ring-2 ring-blue-500'
      )}
      onClick={() => onClick(ticket)}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 p-1 -ml-1 rounded hover:bg-gray-700 cursor-grab active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4 text-gray-500" />
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-500 font-mono">{ticket.id}</span>
            {groomingIcon()}
            {ticket.estimate && (
              <span className="text-xs bg-gray-700 px-1.5 py-0.5 rounded">
                {ticket.estimate}pt
              </span>
            )}
          </div>
          
          <h4 className="text-sm font-medium text-gray-100 line-clamp-2">
            {ticket.title}
          </h4>
          
          <div className="flex items-center gap-2 mt-2">
            <span className={clsx(
              'text-xs px-1.5 py-0.5 rounded',
              PROJECT_COLORS[ticket.project] || 'bg-gray-600'
            )}>
              {ticket.project}
            </span>
            <span className={clsx(
              'w-2 h-2 rounded-full',
              PRIORITY_COLORS[ticket.priority]
            )} title={`${ticket.priority} priority`} />
            <span className="text-xs text-gray-500 ml-auto">
              {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
