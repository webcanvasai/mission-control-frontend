import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTickets, updateTicket, createTicket, deleteTicket, triggerGrooming, moveTicket } from '../api/tickets';
import type { Ticket, TicketStatus, TicketUpdate } from '../types/ticket';

export function useTickets(filters?: { project?: string }) {
  return useQuery({
    queryKey: ['tickets', filters],
    queryFn: () => fetchTickets(filters),
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, update }: { id: string; update: TicketUpdate }) =>
      updateTicket(id, update),
    onMutate: async ({ id, update }) => {
      await queryClient.cancelQueries({ queryKey: ['tickets'] });
      
      const previousTickets = queryClient.getQueryData<Ticket[]>(['tickets']);
      
      // Optimistic update with new timestamp
      queryClient.setQueryData(['tickets'], (old: Ticket[] | undefined) => {
        if (!old) return old;
        return old.map(ticket =>
          ticket.id === id 
            ? { ...ticket, ...update, updatedAt: new Date().toISOString() } 
            : ticket
        );
      });

      return { previousTickets };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTickets) {
        queryClient.setQueryData(['tickets'], context.previousTickets);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}

export function useMoveTicket() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, newStatus }: { id: string; newStatus: TicketStatus }) =>
      moveTicket(id, newStatus),
    onMutate: async ({ id, newStatus }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tickets'] });
      
      const previousTickets = queryClient.getQueryData<Ticket[]>(['tickets']);
      
      // Optimistic update with new timestamp
      queryClient.setQueryData(['tickets'], (old: Ticket[] | undefined) => {
        if (!old) return old;
        return old.map(ticket =>
          ticket.id === id 
            ? { ...ticket, status: newStatus, updatedAt: new Date().toISOString() } 
            : ticket
        );
      });

      return { previousTickets };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousTickets) {
        queryClient.setQueryData(['tickets'], context.previousTickets);
      }
    },
    onSettled: () => {
      // Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  return (ticketId: string, newStatus: TicketStatus) => {
    mutation.mutate({ id: ticketId, newStatus });
  };
}

export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}

export function useDeleteTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}

export function useTriggerGrooming() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: triggerGrooming,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}
