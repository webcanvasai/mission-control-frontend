import { getAccessToken, supabase } from '../lib/supabase';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export type ProjectRole = 'owner' | 'member' | 'viewer' | 'admin';

export interface Project {
  name: string;
  role: ProjectRole;
  memberCount: number;
  ticketCount: number;
}

export interface ProjectMember {
  user_id: string;
  email: string;
  role: ProjectRole;
  created_at: string;
}

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

/**
 * Fetch all projects the current user has access to
 */
export async function fetchProjects(): Promise<Project[]> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/projects`, { headers });
  const data = await handleResponse<{ projects: Project[] }>(response);
  return data.projects;
}

/**
 * Fetch members of a specific project
 */
export async function fetchProjectMembers(projectName: string): Promise<ProjectMember[]> {
  const headers = await getAuthHeaders();
  const encodedName = encodeURIComponent(projectName);
  const response = await fetch(`${API_BASE}/projects/${encodedName}/members`, { headers });
  const data = await handleResponse<{ members: ProjectMember[] }>(response);
  return data.members;
}

/**
 * Add a member to a project
 */
export async function addProjectMember(
  projectName: string,
  email: string,
  role: ProjectRole = 'viewer'
): Promise<ProjectMember> {
  const headers = await getAuthHeaders();
  const encodedName = encodeURIComponent(projectName);
  const response = await fetch(`${API_BASE}/projects/${encodedName}/members`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, role }),
  });
  const data = await handleResponse<{ success: boolean; member: ProjectMember }>(response);
  return data.member;
}

/**
 * Update a member's role in a project
 */
export async function updateProjectMemberRole(
  projectName: string,
  userId: string,
  role: ProjectRole
): Promise<void> {
  const headers = await getAuthHeaders();
  const encodedName = encodeURIComponent(projectName);
  const response = await fetch(`${API_BASE}/projects/${encodedName}/members/${userId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ role }),
  });
  await handleResponse<{ success: boolean }>(response);
}

/**
 * Remove a member from a project
 */
export async function removeProjectMember(
  projectName: string,
  userId: string
): Promise<void> {
  const headers = await getAuthHeaders();
  const encodedName = encodeURIComponent(projectName);
  const response = await fetch(`${API_BASE}/projects/${encodedName}/members/${userId}`, {
    method: 'DELETE',
    headers,
  });
  await handleResponse<{ success: boolean }>(response);
}

/**
 * Fetch all projects (admin only)
 */
export async function fetchAllProjects(): Promise<
  Array<{
    name: string;
    memberCount: number;
    ticketCount: number;
    hasMembers: boolean;
  }>
> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/projects/all`, { headers });
  const data = await handleResponse<{ projects: any[] }>(response);
  return data.projects;
}

/**
 * Check if user has at least the required role in a project
 */
export function hasMinimumRole(
  userRole: ProjectRole | null,
  requiredRole: ProjectRole
): boolean {
  if (!userRole) return false;
  if (userRole === 'admin') return true;

  const hierarchy: Record<ProjectRole, number> = {
    admin: 4,
    owner: 3,
    member: 2,
    viewer: 1,
  };

  return hierarchy[userRole] >= hierarchy[requiredRole];
}

/**
 * Get permission checks for a given role
 */
export function getProjectPermissions(role: ProjectRole | null) {
  return {
    canView: hasMinimumRole(role, 'viewer'),
    canEdit: hasMinimumRole(role, 'member'),
    canDelete: hasMinimumRole(role, 'owner'),
    canManageMembers: role === 'owner' || role === 'admin',
    isAdmin: role === 'admin',
  };
}
