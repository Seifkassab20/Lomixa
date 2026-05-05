import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
import { ensureUserEntityExists, useStoreListener } from './store';
import { User } from '@supabase/supabase-js';
import { useTranslation } from 'react-i18next';

type Role = 'pharma' | 'hospital' | 'doctor' | 'rep' | 'admin' | null;

interface AuthContextType {
  user: User | null;
  userId: string | null;
  role: Role;
  emailVerified: boolean;
  isPending: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshVerificationStatus: () => Promise<void>;
  t: (key: string) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [emailVerified, setEmailVerified] = useState<boolean>(true);
  const [isPending, setIsPending] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
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
          fetchVerificationStatus(session.user.id, userRole);
          setLoading(false);
        } else {
          loadDemoSession();
        }
      } else {
        loadDemoSession();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        const userRole = session.user.user_metadata?.role as Role;
        if (userRole) {
          setRole(userRole);
          ensureUserEntityExists(session.user);
          fetchVerificationStatus(session.user.id, userRole);
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

  // Listen for local store mutations (e.g. from syncCloudData)
  useStoreListener(() => {
    if (user?.id && role) {
      fetchVerificationStatus(user.id, role);
    }
  });

  const loadDemoSession = () => {
    const storedRole = localStorage.getItem('demo_role') as Role;
    const storedEmail = localStorage.getItem('demo_email') || 'demo@lomixa.sa';
    if (storedRole) {
      setRole(storedRole);
      setEmailVerified(true);
      setUser({
        id: `demo_${storedRole}_user`,
        email: storedEmail,
        user_metadata: { full_name: storedEmail.split('@')[0] },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as any);
    }
    setLoading(false);
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut().catch(() => {});
    }
    localStorage.removeItem('demo_role');
    localStorage.removeItem('demo_email');
    setUser(null);
    setRole(null);
    setEmailVerified(false);
  };

  const fetchVerificationStatus = async (uid: string, role: string | null) => {
    // Check pending status from store
    if (uid && role) {
      import('./store').then(async ({ getAuthorizationDetails }) => {
        const { isPending } = await getAuthorizationDetails(uid, role);
        setIsPending(!!isPending);
      });
    }
    setEmailVerified(true);
  };

  const refreshVerificationStatus = async () => {
    if (user?.id) {
      await fetchVerificationStatus(user.id, role);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userId: user?.id || null, role, emailVerified, isPending, loading, signOut, refreshVerificationStatus, t }}>
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
