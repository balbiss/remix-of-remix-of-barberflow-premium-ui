import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface Service {
  id: string;
  barbershop_id: string;
  name: string;
  default_price: number | null;
  active: boolean;
  created_at?: string;
}

export function useServices() {
  const { user } = useAuth();
  const barbershopId = user?.barbershopId;

  return useQuery({
    queryKey: ['services', barbershopId],
    queryFn: async () => {
      if (!barbershopId) return [];
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('barbershop_id', barbershopId)
        .eq('active', true)
        .order('name');
      
      if (error) throw error;
      return data as Service[];
    },
    enabled: !!barbershopId,
  });
}

export function useAddService() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (service: Omit<Service, 'id' | 'barbershop_id' | 'created_at'>) => {
      if (!user?.barbershopId) throw new Error('ID da barbearia não encontrado');
      const { data, error } = await supabase
        .from('services')
        .insert({ ...service, barbershop_id: user.barbershopId })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', user?.barbershopId] });
    },
  });
}

export function useUpdateService() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (service: Partial<Service> & { id: string }) => {
      const { data, error } = await supabase
        .from('services')
        .update(service)
        .eq('id', service.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', user?.barbershopId] });
    },
  });
}

export function useDeleteService() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', user?.barbershopId] });
    },
  });
}
