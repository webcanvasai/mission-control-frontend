import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type UserRole = 'admin' | 'editor' | 'viewer';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  canEdit: boolean;
  canDelete: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  canEdit: false,
  canDelete: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user role from API
  const fetchRole = async (userId: string) => {
    try {
      console.log('[AuthContext] Fetching role for user:', userId);
      
      // Get current session token
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      console.log('[AuthContext] Current session:', currentSession ? 'exists' : 'missing');
      
      if (!currentSession?.access_token) {
        console.error('[AuthContext] No access token available');
        setRole('viewer');
        return;
      }
      
      // Call API to get user info and role (bypasses RLS issues)
      const API_BASE = import.meta.env.VITE_API_URL || '/api';
      console.log('[AuthContext] Calling /api/auth/me');
      
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${currentSession.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('[AuthContext] API error:', response.status, response.statusText);
        setRole('viewer');
        return;
      }

      const data = await response.json();
      console.log('[AuthContext] Got user data from API:', data);
      
      const roleValue = (data.user?.role as UserRole) || 'viewer';
      console.log('[AuthContext] Setting role to:', roleValue);
      setRole(roleValue);
    } catch (error) {
      console.error('[AuthContext] Failed to fetch role:', error);
      setRole('viewer');
    } finally {
      console.log('[AuthContext] Setting loading to false');
      setLoading(false);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchRole(session.user.id);
        } else {
          setRole(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || email.split('@')[0],
        }
      }
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
  };

  // Permission helpers
  const canEdit = role === 'admin' || role === 'editor';
  const canDelete = role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        loading,
        signIn,
        signUp,
        signOut,
        canEdit,
        canDelete,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
