import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface Client {
  id: string;
  barbershop_id: string;
  name: string;
  phone: string;
  loyalty_stamps: number;
  total_spent: number;
  last_visit: string;
  created_at?: string;
}

export function useClients() {
  const { user } = useAuth();
  const barbershopId = user?.barbershopId;

  return useQuery({
    queryKey: ['clients', barbershopId],
    queryFn: async () => {
      if (!barbershopId) return [];
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('barbershop_id', barbershopId)
        .order('name');
      
      if (error) throw error;
      return data as Client[];
    },
    enabled: !!barbershopId,
  });
}

export function useAddClient() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (client: Omit<Client, 'id' | 'barbershop_id' | 'created_at'>) => {
      if (!user?.barbershopId) throw new Error('ID da barbearia não encontrado');

      const { data: existingClient, error: searchError } = await supabase
        .from('clients')
        .select('id, name')
        .eq('barbershop_id', user.barbershopId)
        .eq('phone', client.phone)
        .maybeSingle();

      if (searchError) throw searchError;
      if (existingClient) {
        throw new Error(`Este número de WhatsApp já está cadastrado para o cliente: ${existingClient.name}`);
      }

      const { data, error } = await supabase
        .from('clients')
        .insert({ ...client, barbershop_id: user.barbershopId })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', user?.barbershopId] });
    },
  });
}

export function useUpdateClient() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (client: Partial<Client> & { id: string }) => {
      if (!user?.barbershopId) throw new Error('ID da barbearia não encontrado');

      if (client.phone) {
        const { data: existingClient, error: searchError } = await supabase
          .from('clients')
          .select('id, name')
          .eq('barbershop_id', user.barbershopId)
          .eq('phone', client.phone)
          .neq('id', client.id)
          .maybeSingle();

        if (searchError) throw searchError;
        if (existingClient) {
          throw new Error(`Este número de WhatsApp já está cadastrado para o cliente: ${existingClient.name}`);
        }
      }

      const { data, error } = await supabase
        .from('clients')
        .update(client)
        .eq('id', client.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', user?.barbershopId] });
    },
  });
}

export function useDeleteClient() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', user?.barbershopId] });
    },
  });
}
