import { useQuery } from '@tanstack/react-query';
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
