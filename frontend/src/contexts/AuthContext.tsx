import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface AuthResult {
  error: string | null;
}

interface AuthContextValue {
  user:          User | null;
  session:       Session | null;
  loading:       boolean;
  isConfigured:  boolean;
  signUp:        (email: string, password: string, displayName: string) => Promise<AuthResult>;
  signIn:        (email: string, password: string) => Promise<AuthResult>;
  signOut:       () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<AuthResult>;
  updatePassword: (newPassword: string) => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function friendlyAuthError(error: AuthError | Error | null): string | null {
  if (!error) return null;
  const msg = error.message ?? 'Something went wrong';
  // Translate the most common Supabase error strings into friendlier copy
  if (/invalid login credentials/i.test(msg)) return 'Incorrect email or password.';
  if (/email not confirmed/i.test(msg)) return 'Please confirm your email before signing in.';
  if (/user already registered/i.test(msg)) return 'An account with this email already exists.';
  if (/password should be at least/i.test(msg)) return msg;
  if (/rate limit/i.test(msg)) return 'Too many attempts. Please wait a moment and try again.';
  return msg;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName: string): Promise<AuthResult> => {
    if (!supabase) return { error: 'Authentication is not configured.' };
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    return { error: friendlyAuthError(error) };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return { error: 'Authentication is not configured.' };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: friendlyAuthError(error) };
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const requestPasswordReset = useCallback(async (email: string): Promise<AuthResult> => {
    if (!supabase) return { error: 'Authentication is not configured.' };
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { error: friendlyAuthError(error) };
  }, []);

  const updatePassword = useCallback(async (newPassword: string): Promise<AuthResult> => {
    if (!supabase) return { error: 'Authentication is not configured.' };
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: friendlyAuthError(error) };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isConfigured: isSupabaseConfigured,
        signUp,
        signIn,
        signOut,
        requestPasswordReset,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
