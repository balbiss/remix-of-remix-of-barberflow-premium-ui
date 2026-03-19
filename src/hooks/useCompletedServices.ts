import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface CompletedService {
  id: string;
  barbershop_id: string;
  barber_id: string | null;
  client_id: string;
  service_name: string;
  service_price: number;
  date: string;
  time: string;
  validated: boolean;
  loyalty_points: number;
  pin_code?: string;
  created_at?: string;
  // Joins
  barber?: { name: string };
  client?: { name: string };
}

export function useCompletedServices(date?: string) {
  const { user } = useAuth();
  const barbershopId = user?.barbershopId;

  return useQuery({
    queryKey: ['completed-services', barbershopId, date],
    queryFn: async () => {
      if (!barbershopId) return [];
      let query = supabase
        .from('completed_services')
        .select('*, barber:barber_id(name), client:client_id(name)')
        .eq('barbershop_id', barbershopId);
      
      if (date) {
        query = query.eq('date', date);
      }

      const { data, error } = await query.order('date', { ascending: false }).order('time', { ascending: false });
      
      if (error) throw error;
      return data as (CompletedService & { barber: { name: string }, client: { name: string } })[];
    },
    enabled: !!barbershopId,
  });
}

export function useAddCompletedService() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (service: Omit<CompletedService, 'id' | 'barbershop_id' | 'created_at'>) => {
      if (!user?.barbershopId) throw new Error('ID da barbearia não encontrado');
      
      // 1. Insert completed service
      const { data, error } = await supabase
        .from('completed_services')
        .insert({ ...service, barbershop_id: user.barbershopId })
        .select()
        .single();
      
      if (error) throw error;

      // 2. Update client loyalty and total spent
      // This could be a DB trigger too, but let's do it here for clarity or rely on DB trigger if we added one.
      // We didn't add a trigger for total_spent update yet, so let's do an RPC or manual update.
      const { error: clientError } = await supabase.rpc('increment_client_stats', {
        p_client_id: service.client_id,
        p_amount: service.service_price,
        p_points: service.loyalty_points
      });

      // Note: If RPC doesn't exist, we'd need to create it. I didn't create it in my previous migration.
      // I'll add a migration for this RPC now.
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['completed-services', user?.barbershopId] });
      queryClient.invalidateQueries({ queryKey: ['clients', user?.barbershopId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats', user?.barbershopId] });
    },
  });
}

export function useDashboardStats() {
  const { user } = useAuth();
  const barbershopId = user?.barbershopId;

  return useQuery({
    queryKey: ['dashboard-stats', barbershopId],
    queryFn: async () => {
      if (!barbershopId) return null;
      
      const { data, error } = await supabase.rpc('get_owner_dashboard_stats', {
        p_barbershop_id: barbershopId
      });

      if (error) throw error;
      return data;
    },
    enabled: !!barbershopId && user?.role === 'owner',
  });
}

export function useBarberDashboardStats(barberId?: string) {
  const { user } = useAuth();
  const barbershopId = user?.barbershopId;

  return useQuery({
    queryKey: ['barber-dashboard-stats', barberId],
    queryFn: async () => {
      if (!barberId) return null;
      
      const { data, error } = await supabase.rpc('get_barber_dashboard_stats', {
        p_barber_id: barberId
      });

      if (error) throw error;
      return data;
    },
    enabled: !!barberId,
  });
}
