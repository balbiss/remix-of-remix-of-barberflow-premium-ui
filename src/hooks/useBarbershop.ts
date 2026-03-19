import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export function useBarbershop() {
  const { user } = useAuth();
  const barbershopId = user?.barbershopId;

  return useQuery({
    queryKey: ['barbershop', barbershopId],
    queryFn: async () => {
      if (!barbershopId) return null;
      const { data, error } = await supabase
        .from('barbershops')
        .select('*')
        .eq('id', barbershopId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!barbershopId,
  });
}

export function useUpdateBarbershop() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { whatsapp_number: string }) => {
      if (!user?.barbershopId) throw new Error('ID da barbearia não encontrado');
      
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
