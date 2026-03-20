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
    // Poll every 4s while disconnected, slow down to 30s once connected
    refetchInterval: 4000,
    refetchIntervalInBackground: true,
    staleTime: 0,
  });

  const createInstance = useMutation({
    mutationFn: async (instanceName: string) => {
      if (!barbershop) throw new Error('Barbearia não carregada');
      
      // Generate a random token for this instances
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const name = instanceName || `Barbearia_${barbershop.name.replace(/\s+/g, '_')}_${barbershop.id.substring(0, 5)}`;

      const result = await whatsappApi.createInstance(name, token);
      const instanceId = result.id; // Get the hash ID from Wuzapi

      // Save to Supabase
      const { error } = await supabase
        .from('barbershops')
        .update({
          whatsapp_instance_token: token,
          whatsapp_instance_name: name,
          whatsapp_instance_id: instanceId,
          whatsapp_status: 'disconnected'
        })
        .eq('id', barbershop.id);

      if (error) throw error;
      return { token, name, instanceId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barbershop', barbershop?.id] });
    },
  });

  const deleteInstance = useMutation({
    mutationFn: async () => {
      if (!barbershop?.whatsapp_instance_id) {
        // If we don't have the internal ID, just clear Supabase anyway
        console.warn('No instance ID found, clearing Supabase only');
      } else {
        await whatsappApi.deleteInstance(barbershop.whatsapp_instance_id);
      }

      // Clear from Supabase
      const { error } = await supabase
        .from('barbershops')
        .update({
          whatsapp_instance_token: null,
          whatsapp_instance_name: null,
          whatsapp_instance_id: null,
          whatsapp_status: 'disconnected',
          whatsapp_number: null
        })
        .eq('id', barbershop?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barbershop', barbershop?.id] });
      queryClient.setQueryData(['whatsapp-status', barbershop?.id], null);
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
    deleteInstance,
    getPairingCode,
    isConfigured: !!barbershop?.whatsapp_instance_token,
  };
}
