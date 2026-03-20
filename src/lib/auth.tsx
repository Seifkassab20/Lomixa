import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
import { ensureUserEntityExists } from './store';
import { User } from '@supabase/supabase-js';

type Role = 'pharma' | 'hospital' | 'doctor' | 'rep' | null;

interface AuthContextType {
  user: User | null;
  userId: string | null;
  role: Role;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If Supabase is not configured, immediately use demo mode
    if (!isSupabaseConfigured) {
      loadDemoSession();
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        const userRole = session.user.user_metadata?.role as Role;
        if (userRole) {
          setRole(userRole);
          ensureUserEntityExists(session.user);
          setLoading(false);
        } else {
          loadDemoSession();
        }
      } else {
        loadDemoSession();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        const userRole = session.user.user_metadata?.role as Role;
        if (userRole) {
          setRole(userRole);
          ensureUserEntityExists(session.user);
          setLoading(false);
        } else {
          loadDemoSession();
        }
      } else {
        loadDemoSession();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadDemoSession = () => {
    const storedRole = localStorage.getItem('demo_role') as Role;
    const storedEmail = localStorage.getItem('demo_email') || 'demo@lomixa.sa';
    const storedName = localStorage.getItem('demo_name') || storedEmail.split('@')[0];
    const storedMobile = localStorage.getItem('demo_mobile') || '';
    const storedOrg = localStorage.getItem('demo_org') || '';
    if (storedRole) {
      setRole(storedRole);
      setUser({
        id: `demo_${storedRole}_user`,
        email: storedEmail,
        user_metadata: { full_name: storedName, mobile: storedMobile, organization: storedOrg },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as any);
    }
    setLoading(false);
  };

    // This is no longer needed since role is in user_metadata, 
    // but we keep the stub to avoid runtime crashes if called elsewhere
    const fetchUserRole = async (userId: string) => {
      setLoading(false);
    };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut().catch(() => {});
    }
    localStorage.removeItem('demo_role');
    localStorage.removeItem('demo_email');
    localStorage.removeItem('demo_name');
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, userId: user?.id || null, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
