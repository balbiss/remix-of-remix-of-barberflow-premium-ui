import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface AdminBarbershop {
  id: string;
  name: string;
  owner_id: string;
  subscription_status: string;
  subscription_expiry: string | null;
  whatsapp_status: string;
  created_at: string;
  owner_email?: string;
}

export function useSaaSAdmin() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isSuperAdmin = user?.role === 'superadmin';

  const shopsQuery = useQuery({
    queryKey: ['saas-admin', 'barbershops'],
    queryFn: async () => {
      if (!isSuperAdmin) throw new Error('Acesso negado');

      // 1. Get all barbershops
      const { data: shops, error: shopsError } = await supabase
        .from('barbershops')
        .select('*')
        .order('created_at', { ascending: false });

      if (shopsError) throw shopsError;

      // 2. Get owner emails for each shop
      const ownerIds = [...new Set(shops.map(s => s.owner_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', ownerIds);

      if (profilesError) throw profilesError;

      // Map emails to shops
      return shops.map(shop => ({
        ...shop,
        owner_email: profiles.find(p => p.id === shop.owner_id)?.email
      })) as AdminBarbershop[];
    },
    enabled: isSuperAdmin,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, expiry }: { id: string, status?: string, expiry?: string | null }) => {
      const updates: any = {};
      if (status) updates.subscription_status = status;
      if (expiry !== undefined) updates.subscription_expiry = expiry;

      const { data, error } = await supabase
        .from('barbershops')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saas-admin', 'barbershops'] });
    },
  });

  return {
    shops: shopsQuery.data || [],
    isLoading: shopsQuery.isLoading,
    updateStatus: updateStatusMutation.mutateAsync,
  };
}
