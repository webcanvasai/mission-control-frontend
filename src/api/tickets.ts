import type { Ticket, TicketUpdate } from '../types/ticket';
import { getAccessToken, supabase } from '../lib/supabase';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Get headers with authorization token
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await getAccessToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    // Handle 401 - token expired or invalid
    if (response.status === 401) {
      console.log('Auth token expired, signing out...');
      await supabase.auth.signOut();
      window.location.href = '/login';
      throw new Error('Session expired. Please sign in again.');
    }

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
  
  const headers = await getAuthHeaders();
  const response = await fetch(url, { headers });
  const data = await handleResponse<{ tickets: Ticket[]; count: number }>(response);
  return data.tickets;
}

export async function fetchTicket(id: string): Promise<Ticket> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/tickets/${id}`, { headers });
  const data = await handleResponse<{ ticket: Ticket }>(response);
  return data.ticket;
}

export async function updateTicket(id: string, update: TicketUpdate): Promise<Ticket> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/tickets/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(update),
  });
  const data = await handleResponse<{ ticket: Ticket }>(response);
  return data.ticket;
}

export async function createTicket(ticket: Partial<Ticket>): Promise<Ticket> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/tickets`, {
    method: 'POST',
    headers,
    body: JSON.stringify(ticket),
  });
  const data = await handleResponse<{ ticket: Ticket }>(response);
  return data.ticket;
}

export async function deleteTicket(id: string): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/tickets/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!response.ok) {
    if (response.status === 401) {
      window.location.href = '/login';
      throw new Error('Session expired');
    }
    const error = await response.json().catch(() => ({ message: 'Failed to delete ticket' }));
    throw new Error(error.message);
  }
}

export async function triggerGrooming(id: string): Promise<{ status: string; ticketId: string; sessionKey?: string }> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/tickets/${id}/groom`, {
    method: 'POST',
    headers,
  });
  return handleResponse<{ status: string; ticketId: string; sessionKey?: string }>(response);
}

export async function moveTicket(id: string, newStatus: string): Promise<Ticket> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/tickets/${id}/move`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ newStatus }),
  });
  const data = await handleResponse<{ success: boolean; ticket: Ticket }>(response);
  return data.ticket;
}
