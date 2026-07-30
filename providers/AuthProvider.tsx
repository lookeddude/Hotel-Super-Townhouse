'use client';

/**
 * AuthProvider — Phase 4 Implementation
 * ──────────────────────────────────────
 * Provides authenticated session, user profile, and role context to all client components.
 * Listens to Supabase auth state changes and resolves role from the user_roles table.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { useSupabase } from './SupabaseProvider';
import {
  getUserRole,
  signOut as authSignOut,
  type UserRole,
  type AuthUser,
  isAdminRole,
} from '@/lib/supabase/auth';

// ─── Context Type ─────────────────────────────────────────────────────────────

interface AuthContextValue {
  // State
  session: Session | null;
  user: User | null;
  profile: AuthUser | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCustomer: boolean;
  // Actions
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  profile: null,
  role: null,
  isLoading: true,
  isAuthenticated: false,
  isAdmin: false,
  isCustomer: true,
  signOut: async () => {},
  refreshRole: async () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

interface AuthProviderProps {
  children: ReactNode;
  initialSession?: Session | null;
}

export function AuthProvider({ children, initialSession = null }: AuthProviderProps) {
  const { supabase } = useSupabase();
  const [session, setSession] = useState<Session | null>(initialSession);
  const [role, setRole] = useState<UserRole | null>(null);
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const user = session?.user ?? null;
  const isAuthenticated = !!session;
  const isAdmin = role ? isAdminRole(role) : false;
  const isCustomer = role === 'customer' || role === null;

  // ── Load role and profile from DB ──────────────────────────────────────────

  const loadUserData = useCallback(
    async (currentUser: User | null) => {
      if (!currentUser) {
        setRole(null);
        setProfile(null);
        return;
      }

      try {
        const [resolvedRole, profileData] = await Promise.all([
          getUserRole(supabase, currentUser.id),
          supabase
            .from('profiles')
            .select('full_name, avatar_url, email_verified')
            .eq('id', currentUser.id)
            .single(),
        ]);

        setRole(resolvedRole);
        setProfile({
          id: currentUser.id,
          email: currentUser.email ?? '',
          fullName: profileData.data?.full_name ?? null,
          avatarUrl: profileData.data?.avatar_url ?? null,
          role: resolvedRole,
          emailVerified: profileData.data?.email_verified ?? false,
        });
      } catch {
        setRole('customer');
        setProfile(null);
      }
    },
    [supabase]
  );

  const refreshRole = useCallback(async () => {
    if (user) await loadUserData(user);
  }, [user, loadUserData]);

  // ── Auth state listener ────────────────────────────────────────────────────

  useEffect(() => {
    // Get initial session — if no session, resolve immediately (no DB calls needed)
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (!s) {
        // No session — unauthenticated user, resolve instantly
        setIsLoading(false);
      } else {
        // Authenticated — fetch role and profile
        loadUserData(s.user).finally(() => setIsLoading(false));
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        await loadUserData(newSession.user);
      } else {
        setRole(null);
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase, loadUserData]);

  // ── Sign out ────────────────────────────────────────────────────────────────

  const signOut = useCallback(async () => {
    await authSignOut(supabase);
    setSession(null);
    setRole(null);
    setProfile(null);
  }, [supabase]);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        role,
        isLoading,
        isAuthenticated,
        isAdmin,
        isCustomer,
        signOut,
        refreshRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Access auth state from any client component.
 * @example
 *   const { user, isAuthenticated, isAdmin, role, signOut } = useAuth();
 */
export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
