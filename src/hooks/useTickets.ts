import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTickets, updateTicket, createTicket, deleteTicket, triggerGrooming } from '../api/tickets';
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
      
      queryClient.setQueryData(['tickets'], (old: Ticket[] | undefined) => {
        if (!old) return old;
        return old.map(ticket =>
          ticket.id === id ? { ...ticket, ...update } : ticket
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
  const updateTicketMutation = useUpdateTicket();

  return (ticketId: string, newStatus: TicketStatus) => {
    updateTicketMutation.mutate({
      id: ticketId,
      update: { status: newStatus },
    });
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
