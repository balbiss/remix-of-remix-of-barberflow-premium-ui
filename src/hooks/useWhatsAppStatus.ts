import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { whatsappApi } from '@/lib/whatsapp';
import { useAuth } from '@/contexts/AuthContext';
import { useBarbershop } from './useBarbershop';

export function useWhatsAppStatus() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: barbershop } = useBarbershop();
  const instanceToken = barbershop?.whatsapp_instance_token;

  return useQuery({
    queryKey: ['whatsapp-status', instanceToken],
    queryFn: async () => {
      if (!instanceToken) return { connected: false };
      
      try {
        const liveStatus = await whatsappApi.getStatus(instanceToken);
        const currentDbStatus = barbershop?.whatsapp_status;
        const newDbStatus = liveStatus.connected ? 'connected' : 'disconnected';

        // Se o status da API for diferente do status salvo no Banco, atualizamos o banco para manter sincronizado
        if (currentDbStatus !== newDbStatus) {
          console.log(`[WhatsApp] Syncing status: ${currentDbStatus} -> ${newDbStatus}`);
          await supabase
            .from('barbershops')
            .update({ whatsapp_status: newDbStatus })
            .eq('id', barbershop.id);
          
          // Invalida a query da barbearia para que o resto do app saiba da mudança
          queryClient.invalidateQueries({ queryKey: ['barbershop', barbershop.id] });
        }

        return liveStatus;
      } catch (error) {
        console.error('[WhatsApp] Error fetching status:', error);
        return { connected: false };
      }
    },
    enabled: !!instanceToken && user?.role === 'owner',
    refetchInterval: 60000, // Checa a cada 1 minuto se o painel estiver aberto
  });
}
