import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

export type UserRole = 'owner' | 'barber';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  barbershopId: string;
  barbershopName: string;
  subscriptionStatus: string;
  avatar?: string;
  barberId?: string; // barbers table id (for barber role)
}

interface AuthContextType {
  user: User | null;
  role: UserRole;
  subscriptionStatus: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (data: SignUpData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

interface SignUpData {
  email: string;
  password: string;
  name: string;
  barbershopName: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function loadUserProfile(supabaseUser: SupabaseUser): Promise<User | null> {
  console.log('Iniciando carregamento de perfil:', supabaseUser.id);
  
  // 1. Buscar Perfil
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', supabaseUser.id)
    .single();

  if (profileError || !profile) {
    console.error('Erro na consulta de perfil:', profileError);
    return null;
  }

  // 2. Buscar Barbearia (Separado para evitar problemas de join/RLS)
  const { data: barbershop, error: bsError } = await supabase
    .from('barbershops')
    .select('*')
    .eq('id', profile.barbershop_id)
    .single();

  if (bsError || !barbershop) {
    console.error('Erro na consulta de barbearia:', bsError);
    return null;
  }

  let barberId: string | undefined;
  if (profile.role === 'barber') {
    const { data: barber } = await supabase
      .from('barbers')
      .select('id')
      .eq('user_id', supabaseUser.id)
      .single();
    barberId = barber?.id;
  }

  return {
    id: supabaseUser.id,
    name: profile.name,
    email: profile.email,
    role: profile.role as UserRole,
    barbershopId: profile.barbershop_id,
    barbershopName: barbershop.name || '',
    subscriptionStatus: barbershop.subscription_status || 'pending',
    avatar: profile.avatar_url || undefined,
    barberId,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const profile = await loadUserProfile(session.user);
          setUser(profile);
        }
      } catch (err) {
        console.error('Error in auth init:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          if (session?.user) {
            const profile = await loadUserProfile(session.user);
            setUser(profile);
          } else {
            setUser(null);
          }
        } catch (err) {
          console.error('Error on auth change:', err);
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        return { success: false, error: 'Email ou senha inválidos' };
      }

      if (data.user) {
        const profile = await loadUserProfile(data.user);
        if (!profile) {
          return { success: false, error: 'Perfil não encontrado. Contate o suporte.' };
        }
        setUser(profile);
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: 'Ocorreu um erro ao entrar. Tente novamente.' };
    }
  };

  const signUp = async (signUpData: SignUpData): Promise<{ success: boolean; error?: string }> => {
    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
      });

      if (authError || !authData.user) {
        return { success: false, error: authError?.message || 'Erro ao criar conta' };
      }

      const userId = authData.user.id;

      // 2. Create barbershop
      const { data: barbershop, error: bsError } = await supabase
        .from('barbershops')
        .insert({ name: signUpData.barbershopName, owner_id: userId })
        .select()
        .single();

      if (bsError || !barbershop) {
        return { success: false, error: 'Erro ao configurar sua barbearia' };
      }

      // 3. Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          name: signUpData.name,
          email: signUpData.email,
          role: 'owner',
          barbershop_id: barbershop.id,
        });

      if (profileError) {
        return { success: false, error: 'Erro ao criar seu perfil profissional' };
      }

      // Reload profile
      const profile = await loadUserProfile(authData.user);
      setUser(profile);

      return { success: true };
    } catch (err) {
      return { success: false, error: 'Ocorreu um erro inesperado. Tente novamente.' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      role: user?.role || 'barber',
      subscriptionStatus: user?.subscriptionStatus || 'pending',
      isAuthenticated: !!user,
      isLoading,
      login,
      signUp,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
