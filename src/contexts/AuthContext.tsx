
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  signInAsGuest: () => void;
  isGuest: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState<boolean>(false);

  useEffect(() => {
    console.log('AuthContext: Setting up auth state listener');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('AuthContext: Auth state changed', { event, session });
        setSession(session);
        setUser(session?.user ?? null);
        // If a real session exists, ensure guest is disabled
        if (session?.user) {
          setIsGuest(false);
          localStorage.removeItem("guest_session");
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('AuthContext: Initial session check', { session });
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsGuest(false);
        localStorage.removeItem("guest_session");
      } else {
        // Restore guest session if present
        const guest = localStorage.getItem("guest_session");
        console.log('AuthContext: Guest session check', { guest });
        setIsGuest(guest === "true");
      }
      setLoading(false);
    }).catch((error) => {
      console.error('AuthContext: Error getting session', error);
      setLoading(false);
    });

    return () => {
      console.log('AuthContext: Cleaning up subscription');
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          first_name: firstName,
          last_name: lastName,
        }
      }
    });
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    // Also clear any guest session
    setIsGuest(false);
    localStorage.removeItem("guest_session");
    setUser(null);
    setSession(null);
  };

  const signInAsGuest = () => {
    // Mark guest session in memory and persist
    setIsGuest(true);
    localStorage.setItem("guest_session", "true");
    // Ensure real user/session are cleared
    setUser(null);
    setSession(null);
  };

  const value = {
    user,
    session,
    signUp,
    signIn,
    signOut,
    signInAsGuest,
    isGuest,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
