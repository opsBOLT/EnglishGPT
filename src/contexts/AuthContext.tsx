import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
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

  useEffect(() => {
    console.log('[AuthContext] Initializing auth state');

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[AuthContext] Initial session check:', {
        hasSession: !!session,
        userId: session?.user?.id
      });
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AuthContext] Auth state changed:', {
        event,
        hasSession: !!session,
        userId: session?.user?.id
      });
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    console.log('[AuthContext] Fetching user profile for:', userId);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      console.log('[AuthContext] User profile fetched:', {
        hasData: !!data,
        userId: data?.id,
        email: data?.email,
        onboarding_completed: data?.onboarding_completed
      });

      // If no profile exists, create one (for Google OAuth users)
      if (!data) {
        console.log('[AuthContext] No profile found, creating one for OAuth user');
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (authUser) {
          const { data: newProfile, error: insertError } = await supabase
            .from('users')
            .insert({
              id: authUser.id,
              email: authUser.email || '',
              full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'New User',
              onboarding_completed: false,
            })
            .select()
            .single();

          if (insertError) {
            console.error('[AuthContext] Error creating profile for OAuth user:', insertError);
            throw insertError;
          }

          console.log('[AuthContext] Created new profile for OAuth user:', newProfile);
          setUser(newProfile);
        } else {
          console.error('[AuthContext] No auth user found when creating profile');
          setUser(null);
        }
      } else {
        setUser(data);
      }
    } catch (error) {
      console.error('[AuthContext] Error fetching user profile:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    console.log('[AuthContext] signUp called for:', email);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      console.log('[AuthContext] Auth signup result:', {
        hasError: !!authError,
        error: authError,
        hasUser: !!authData.user,
        userId: authData.user?.id,
        hasSession: !!authData.session
      });

      if (authError) throw authError;

      if (authData.user) {
        const derivedName = fullName || email.split('@')[0] || 'New User';
        console.log('[AuthContext] Creating user profile with name:', derivedName);

        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email,
            full_name: derivedName,
            onboarding_completed: false,
          });

        console.log('[AuthContext] Profile creation result:', {
          hasError: !!profileError,
          error: profileError
        });

        if (profileError) throw profileError;
      }

      console.log('[AuthContext] signUp completed successfully');
      return { error: null };
    } catch (error) {
      console.error('[AuthContext] signUp failed:', error);
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
