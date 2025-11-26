import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase, supabaseMissingEnv } from '../lib/supabase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const profileFetchInFlight = useRef(false);
  const lastProfileUserId = useRef<string | null>(null);

  useEffect(() => {
    if (supabaseMissingEnv) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (session && isSessionExpired(session)) {
          supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }

        setSession(session);
        if (session?.user) {
          fetchUserProfile(session.user.id);
        } else {
          setLoading(false);
        }
      })
      .catch(() => {
        setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const eventName = event as string;

      if (eventName === 'TOKEN_REFRESH_FAILED') {
        console.error('[auth] token refresh failed, signing out to stop retry loop');
        supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setLoading(false);
        return;
      }

      setSession(session);
      if (session?.user) {
        const shouldFetchProfile =
          eventName === 'SIGNED_IN' ||
          eventName === 'TOKEN_REFRESHED' ||
          eventName === 'USER_UPDATED';

        if (session && isSessionExpired(session)) {
          supabase.auth.signOut();
          setUser(null);
          setSession(null);
          setLoading(false);
          return;
        }

        if (shouldFetchProfile) {
          fetchUserProfile(session.user.id);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    if (profileFetchInFlight.current && lastProfileUserId.current === userId) {
      return;
    }

    profileFetchInFlight.current = true;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      // If no profile exists, create one (for Google OAuth users)
      if (!data) {
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (authUser) {
          const { data: newProfile, error: insertError } = await supabase
            .from('users')
            .upsert(
              {
                id: authUser.id,
                email: authUser.email || '',
                full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'New User',
                onboarding_completed: false,
              },
              { onConflict: 'id' }
            )
            .select()
            .single();

          if (insertError) throw insertError;

          setUser(newProfile);
        } else {
          setUser(null);
        }
      } else {
        setUser(data);
      }
      lastProfileUserId.current = userId;
    } catch (error) {
      console.error('[auth] Failed to fetch user profile, falling back to auth user', error);
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (authUser) {
        setUser({
          id: authUser.id,
          email: authUser.email || '',
          full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
          onboarding_completed: false,
          created_at: authUser.created_at || new Date().toISOString(),
        });
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
      profileFetchInFlight.current = false;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/onboarding`,
        },
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      if (!user) throw new Error('No user logged in');

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      setUser({ ...user, ...updates });
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const isSessionExpired = (session: Session) => {
  const expiresAt = session.expires_at;
  if (!expiresAt) return false;
  const now = Math.floor(Date.now() / 1000);
  return expiresAt < now;
};
