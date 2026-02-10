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

  // Fetch user role from user_roles table
  const fetchRole = async (userId: string) => {
    try {
      console.log('[AuthContext] Fetching role for user:', userId);
      
      // Check if we have a valid session
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      console.log('[AuthContext] Current session:', currentSession ? 'exists' : 'missing');
      console.log('[AuthContext] Session user:', currentSession?.user?.id);
      
      // Try using the RPC function first (bypasses RLS)
      console.log('[AuthContext] Trying RPC function get_my_role()');
      const { data: rpcRole, error: rpcError } = await supabase.rpc('get_my_role');
      
      if (!rpcError && rpcRole) {
        console.log('[AuthContext] Got role from RPC:', rpcRole);
        setRole(rpcRole as UserRole);
        return;
      }
      
      console.log('[AuthContext] RPC failed, trying direct query. Error:', rpcError);
      
      // Fallback to direct query with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), 5000)
      );
      
      const queryPromise = supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      console.log('[AuthContext] Role query result:', { data, error });

      if (error) {
        console.error('[AuthContext] Error fetching role:', error);
        // Default to viewer if no role found
        setRole('viewer');
      } else {
        const roleValue = (data?.role as UserRole) || 'viewer';
        console.log('[AuthContext] Setting role to:', roleValue);
        setRole(roleValue);
      }
    } catch (error) {
      console.error('[AuthContext] Failed to fetch role (exception):', error);
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
