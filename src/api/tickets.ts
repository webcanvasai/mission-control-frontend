import type { Ticket, TicketUpdate } from '../types/ticket';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || `HTTP error ${response.status}`);
  }
  return response.json();
}

export async function fetchTickets(filters?: {
  status?: string;
  priority?: string;
  project?: string;
}): Promise<Ticket[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.priority) params.set('priority', filters.priority);
  if (filters?.project) params.set('project', filters.project);

  const url = params.toString() 
    ? `${API_BASE}/tickets?${params}` 
    : `${API_BASE}/tickets`;
  
  const response = await fetch(url);
  const data = await handleResponse<{ tickets: Ticket[]; count: number }>(response);
  return data.tickets;
}

export async function fetchTicket(id: string): Promise<Ticket> {
  const response = await fetch(`${API_BASE}/tickets/${id}`);
  const data = await handleResponse<{ ticket: Ticket }>(response);
  return data.ticket;
}

export async function updateTicket(id: string, update: TicketUpdate): Promise<Ticket> {
  const response = await fetch(`${API_BASE}/tickets/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update),
  });
  const data = await handleResponse<{ ticket: Ticket }>(response);
  return data.ticket;
}

export async function createTicket(ticket: Partial<Ticket>): Promise<Ticket> {
  const response = await fetch(`${API_BASE}/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ticket),
  });
  const data = await handleResponse<{ ticket: Ticket }>(response);
  return data.ticket;
}

export async function deleteTicket(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/tickets/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete ticket');
  }
}

export async function triggerGrooming(id: string): Promise<Ticket> {
  const response = await fetch(`${API_BASE}/tickets/${id}/groom`, {
    method: 'POST',
  });
  const data = await handleResponse<{ ticket: Ticket }>(response);
  return data.ticket;
}

export async function moveTicket(id: string, newStatus: string): Promise<Ticket> {
  const response = await fetch(`${API_BASE}/tickets/${id}/move`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newStatus }),
  });
  const data = await handleResponse<{ success: boolean; ticket: Ticket }>(response);
  return data.ticket;
}
