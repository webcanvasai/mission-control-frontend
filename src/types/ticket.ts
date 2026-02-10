export type TicketStatus = 'backlog' | 'todo' | 'in-progress' | 'done';

export type Priority = 'low' | 'medium' | 'high';

export type GroomingStatus = 'pending' | 'in-progress' | 'complete' | 'failed' | 'manual';

export interface GroomingInfo {
  status: GroomingStatus;
  triggeredAt?: string;
  completedAt?: string;
  sessionKey?: string;
  attempts?: number;
  lastError?: string;
}

export interface Ticket {
  id: string;
  title: string;
  status: TicketStatus;
  priority: Priority;
  project: string;
  assignee?: string;
  estimate?: number;
  createdAt: string;
  updatedAt: string;
  body: string;
  grooming?: GroomingInfo;
  qualityScore?: number;
}

export interface TicketUpdate {
  title?: string;
  status?: TicketStatus;
  priority?: Priority;
  project?: string;
  assignee?: string;
  estimate?: number;
  body?: string;
}

export const STATUS_ORDER: TicketStatus[] = ['backlog', 'todo', 'in-progress', 'done'];

export const STATUS_LABELS: Record<TicketStatus, string> = {
  'backlog': 'Backlog',
  'todo': 'To Do',
  'in-progress': 'In Progress',
  'done': 'Done',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  'low': 'bg-blue-500',
  'medium': 'bg-yellow-500',
  'high': 'bg-red-500',
};

export const PROJECT_COLORS: Record<string, string> = {
  'Optrader': 'bg-purple-600',
  'Grapevine': 'bg-green-600',
  '1099w9': 'bg-orange-600',
  'Mission Control': 'bg-cyan-600',
};
