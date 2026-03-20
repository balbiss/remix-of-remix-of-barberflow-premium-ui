import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { whatsappService } from '@/lib/whatsappService';

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
      
      // 1. Fetch current client stamps and barbershop limit for notification logic
      const [{ data: clientBefore }, { data: barbershop }] = await Promise.all([
        supabase.from('clients').select('loyalty_stamps').eq('id', service.client_id).single(),
        supabase.from('barbershops').select('loyalty_stamps_limit').eq('id', user.barbershopId).single()
      ]);

      // 2. Insert completed service
      const { data, error } = await supabase
        .from('completed_services')
        .insert({ ...service, barbershop_id: user.barbershopId })
        .select()
        .single();
      
      if (error) throw error;

      // 3. Update client loyalty and total spent
      const { error: clientError } = await supabase.rpc('increment_client_stats', {
        p_client_id: service.client_id,
        p_amount: service.service_price,
        p_points: service.loyalty_points
      });

      if (clientError) console.error('Error incrementing client stats:', clientError);

       // 4. Send WhatsApp Notification
       try {
         const oldStamps = clientBefore?.loyalty_stamps || 0;
         const newStamps = oldStamps + service.loyalty_points;
         const limit = barbershop?.loyalty_stamps_limit || 10;

         if (newStamps >= limit && oldStamps < limit) {
           // Send Loyalty Reward Template
           await whatsappService.sendTemplateMessage(
             user.barbershopId,
             service.client_id,
             'Fidelidade',
             {
               servico: service.service_name
             }
           );
         } else {
           // Send Standard Service Completed Template
           await whatsappService.sendTemplateMessage(
             user.barbershopId,
             service.client_id,
             'Serviço Realizado',
             {
               servico: service.service_name,
               valor: service.service_price.toString(),
               pontos: service.loyalty_points.toString(),
               total_selos: newStamps.toString()
             }
           );
         }
       } catch (wsError) {
         console.error('WhatsApp notification failed:', wsError);
       }

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

export function useUpdateCompletedService() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, service_name, service_price }: { id: string; service_name: string; service_price: number }) => {
      const { error } = await supabase
        .from('completed_services')
        .update({ service_name, service_price })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      // Invalida todas as queries que começam com 'completed-services' para garantir que filtros por data também sejam atualizados
      queryClient.invalidateQueries({ queryKey: ['completed-services'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useDeleteCompletedService() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('completed_services')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      // Invalida todas as queries que começam com 'completed-services'
      queryClient.invalidateQueries({ queryKey: ['completed-services'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}
