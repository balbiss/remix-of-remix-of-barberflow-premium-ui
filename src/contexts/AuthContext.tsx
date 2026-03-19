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

async function loadUserProfile(supabaseUser: SupabaseUser, retryCount = 0): Promise<User | null> {
  console.log(`[Auth] Carregando perfil (${retryCount}):`, supabaseUser.id);
  
  try {
    // 1. Buscar Perfil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();

    if (profileError || !profile) {
      console.warn('[Auth] Perfil não encontrado:', profileError?.message);
      
      // Se for recém criado, tenta novamente após 1.5s
      if (retryCount < 2) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        return loadUserProfile(supabaseUser, retryCount + 1);
      }
      return null;
    }

    // 2. Buscar Barbearia
    const { data: barbershop, error: bsError } = await supabase
      .from('barbershops')
      .select('*')
      .eq('id', profile.barbershop_id)
      .single();

    if (bsError || !barbershop) {
      console.error('[Auth] Erro ao buscar barbearia:', bsError?.message);
      return null;
    }

    let barberId: string | undefined;
    if (profile.role === 'barber') {
      const { data: barber } = await supabase
        .from('barbers')
        .select('id')
        .eq('user_id', supabaseUser.id)
        .maybeSingle(); // Usar maybeSingle para evitar erro se ainda não vinculado
      barberId = barber?.id;
    }

    console.log('[Auth] Perfil carregado com sucesso:', profile.email);

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
  } catch (err) {
    console.error('[Auth] Erro inesperado em loadUserProfile:', err);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isInitialLoad = true;
    let mounted = true;

    // Timeout de segurança: 8 segundos para garantir que o loading suma
    const timeoutId = setTimeout(() => {
      if (mounted && isInitialLoad) {
        console.warn('Auth timeout: Forçando encerramento do loading');
        setIsLoading(false);
      }
    }, 8000);

    const handleSession = async (session: Session | null) => {
      try {
        if (session?.user) {
          const profile = await loadUserProfile(session.user);
          if (mounted) {
            setUser(profile);
            setIsLoading(false);
            isInitialLoad = false;
          }
        } else {
          if (mounted) {
            setUser(null);
            setIsLoading(false);
            isInitialLoad = false;
          }
        }
      } catch (err) {
        console.error('Error handling session:', err);
        if (mounted) {
          setUser(null);
          setIsLoading(false);
          isInitialLoad = false;
        }
      }
    };

    // 1. Carregamento inicial direto
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        handleSession(session);
      }
    });

    // 2. Ouvir mudanças de estado (Login/Logout/Refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (mounted) {
          handleSession(session);
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
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
      // 1. Verificar se o e-mail já foi pré-cadastrado como barbeiro (Case-insensitive)
      const { data: invitedBarber, error: inviteError } = await supabase
        .from('barbers')
        .select('*, barbershops(name)')
        .ilike('email', signUpData.email.trim())
        .is('user_id', null)
        .maybeSingle();

      if (inviteError) {
        console.error('Erro ao verificar convite de barbeiro:', inviteError);
      }

      // 2. Criar o usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
      });

      if (authError || !authData.user) {
        return { success: false, error: authError?.message || 'Erro ao criar conta' };
      }

      const userId = authData.user.id;
      let role: UserRole = 'owner';
      let barbershopId = '';

      if (invitedBarber) {
        // Fluxo de Barbeiro Convidado
        role = 'barber';
        barbershopId = invitedBarber.barbershop_id;
        
        // Atualizar o registro do barbeiro com o ID do usuário
        await supabase
          .from('barbers')
          .update({ user_id: userId })
          .eq('id', invitedBarber.id);
      } else {
        // Fluxo de Dono (Cria nova barbearia)
        const { data: barbershop, error: bsError } = await supabase
          .from('barbershops')
          .insert({ name: signUpData.barbershopName || 'Minha Barbearia', owner_id: userId })
          .select()
          .single();

        if (bsError || !barbershop) {
          return { success: false, error: 'Erro ao configurar sua barbearia' };
        }
        barbershopId = barbershop.id;
      }

      // 3. Criar Perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          name: signUpData.name,
          email: signUpData.email,
          role: role,
          barbershop_id: barbershopId,
        });

      if (profileError) {
        return { success: false, error: 'Erro ao criar seu perfil profissional' };
      }

      // Recarregar perfil
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
