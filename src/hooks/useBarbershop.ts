import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export function useUpdateBarbershop() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { whatsapp_number: string }) => {
      if (!user?.barbershopId) throw new Error('No barbershop ID');
      
      const { error } = await supabase
        .from('barbershops')
        .update(data)
        .eq('id', user.barbershopId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barbershop', user?.barbershopId] });
    },
  });
}
