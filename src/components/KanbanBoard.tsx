import { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import type { Ticket, TicketStatus } from '../types/ticket';
import { STATUS_ORDER } from '../types/ticket';
import { Lane } from './Lane';
import { TicketCard } from './TicketCard';
import { useMoveTicket } from '../hooks/useTickets';

interface KanbanBoardProps {
  tickets: Ticket[];
  onTicketClick: (ticket: Ticket) => void;
}

export function KanbanBoard({ tickets, onTicketClick }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const moveTicket = useMoveTicket();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const ticketsByStatus = useMemo(() => {
    const grouped: Record<TicketStatus, Ticket[]> = {
      'backlog': [],
      'groomed': [],
      'todo': [],
      'in-progress': [],
      'done': [],
    };

    tickets.forEach(ticket => {
      const status = ticket.status as TicketStatus;
      if (grouped[status]) {
        grouped[status].push(ticket);
      } else {
        grouped['backlog'].push(ticket);
      }
    });

    // Sort by priority within each lane
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    Object.keys(grouped).forEach(status => {
      grouped[status as TicketStatus].sort((a, b) => 
        priorityOrder[a.priority] - priorityOrder[b.priority]
      );
    });

    return grouped;
  }, [tickets]);

  const activeTicket = useMemo(
    () => tickets.find(t => t.id === activeId),
    [activeId, tickets]
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const ticketId = active.id as string;
    const overId = over.id as string;

    // Check if dropped on a lane
    if (STATUS_ORDER.includes(overId as TicketStatus)) {
      const newStatus = overId as TicketStatus;
      const ticket = tickets.find(t => t.id === ticketId);
      
      if (ticket && ticket.status !== newStatus) {
        moveTicket(ticketId, newStatus);
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 h-full">
        {STATUS_ORDER.map(status => (
          <Lane
            key={status}
            status={status}
            tickets={ticketsByStatus[status]}
            onTicketClick={onTicketClick}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTicket ? (
          <div className="rotate-3 opacity-90">
            <TicketCard ticket={activeTicket} onClick={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
