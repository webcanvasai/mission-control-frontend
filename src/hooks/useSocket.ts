import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import type { Ticket } from '../types/ticket';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    socket.on('tickets:init', (tickets: Ticket[]) => {
      console.log('Received initial tickets:', tickets.length);
      queryClient.setQueryData(['tickets'], tickets);
    });

    socket.on('ticket:created', (ticket: Ticket) => {
      console.log('Ticket created:', ticket.id);
      queryClient.setQueryData(['tickets'], (old: Ticket[] | undefined) => {
        if (!old) return [ticket];
        return [...old, ticket];
      });
    });

    socket.on('ticket:updated', (ticket: Ticket) => {
      console.log('Ticket updated:', ticket.id);
      queryClient.setQueryData(['tickets'], (old: Ticket[] | undefined) => {
        if (!old) return [ticket];
        return old.map(t => t.id === ticket.id ? ticket : t);
      });
      queryClient.setQueryData(['ticket', ticket.id], ticket);
    });

    socket.on('ticket:deleted', (data: { id: string }) => {
      console.log('Ticket deleted:', data.id);
      queryClient.setQueryData(['tickets'], (old: Ticket[] | undefined) => {
        if (!old) return [];
        return old.filter(t => t.id !== data.id);
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  const subscribeToTicket = useCallback((id: string) => {
    socketRef.current?.emit('ticket:subscribe', { id });
  }, []);

  const unsubscribeFromTicket = useCallback((id: string) => {
    socketRef.current?.emit('ticket:unsubscribe', { id });
  }, []);

  return {
    socket: socketRef.current,
    subscribeToTicket,
    unsubscribeFromTicket,
  };
}
