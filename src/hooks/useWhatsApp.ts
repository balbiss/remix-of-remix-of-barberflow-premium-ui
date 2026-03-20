import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { whatsappApi, WuzapiStatus } from '@/lib/whatsapp';
import { useBarbershop } from './useBarbershop';

export function useWhatsApp() {
  const { user } = useAuth();
  const { data: barbershop } = useBarbershop();
  const queryClient = useQueryClient();

  const statusQuery = useQuery({
    queryKey: ['whatsapp-status', barbershop?.id],
    queryFn: async () => {
      if (!barbershop?.whatsapp_instance_token) return { connected: false } as WuzapiStatus;
      const status = await whatsappApi.getStatus(barbershop.whatsapp_instance_token);
      
      // Update Supabase if status changed
      const newStatus = status.connected ? 'connected' : 'disconnected';
      if (barbershop.whatsapp_status !== newStatus) {
        await supabase
          .from('barbershops')
          .update({ whatsapp_status: newStatus })
          .eq('id', barbershop.id);
        
        // Invalidate barbershop query to refresh local data
        queryClient.invalidateQueries({ queryKey: ['barbershop', barbershop.id] });
      }
      
      return status;
    },
    enabled: !!barbershop?.whatsapp_instance_token,
    refetchInterval: (query) => {
      // If not connected, poll every 5 seconds to catch the pairing
      return query.state.data?.connected ? 30000 : 5000;
    },
  });

  const createInstance = useMutation({
    mutationFn: async () => {
      if (!barbershop) throw new Error('Barbearia não carregada');
      
      // Generate a random token for this instances
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const name = `Barbearia_${barbershop.name.replace(/\s+/g, '_')}_${barbershop.id.substring(0, 5)}`;

      await whatsappApi.createInstance(name, token);

      // Save to Supabase
      const { error } = await supabase
        .from('barbershops')
        .update({
          whatsapp_instance_token: token,
          whatsapp_instance_name: name,
          whatsapp_status: 'disconnected'
        })
        .eq('id', barbershop.id);

      if (error) throw error;
      return { token, name };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barbershop', barbershop?.id] });
    },
  });

  const getPairingCode = useMutation({
    mutationFn: async (phone: string) => {
      if (!barbershop?.whatsapp_instance_token) {
        throw new Error('Instância não criada. Crie a instância primeiro.');
      }
      return whatsappApi.getPairingCode(barbershop.whatsapp_instance_token, phone);
    },
  });

  return {
    status: statusQuery.data,
    loadingStatus: statusQuery.isLoading,
    createInstance,
    getPairingCode,
    isConfigured: !!barbershop?.whatsapp_instance_token,
  };
}
