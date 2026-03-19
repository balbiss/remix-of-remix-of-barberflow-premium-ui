import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface Barber {
  id: string;
  user_id?: string;
  barbershop_id: string;
  name: string;
  phone: string;
  email?: string;
  commission: number;
  active: boolean;
  created_at?: string;
}

export function useBarbers() {
  const { user } = useAuth();
  const barbershopId = user?.barbershopId;

  return useQuery({
    queryKey: ['barbers', barbershopId],
    queryFn: async () => {
      if (!barbershopId) return [];
      const { data, error } = await supabase
        .from('barbers')
        .select('*')
        .eq('barbershop_id', barbershopId)
        .order('name');
      
      if (error) throw error;
      return data as Barber[];
    },
    enabled: !!barbershopId,
  });
}

export function useAddBarber() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (barber: Omit<Barber, 'id' | 'barbershop_id' | 'created_at'> & { password?: string }) => {
      if (!user?.barbershopId) throw new Error('ID da barbearia não encontrado');

      // Se tiver senha, usamos a Edge Function para criar a conta de acesso também
      if (barber.password) {
        const { data, error } = await supabase.functions.invoke('create-barber', {
          body: {
            email: barber.email,
            password: barber.password,
            name: barber.name,
            phone: barber.phone,
            commission: barber.commission,
            barbershopId: user.barbershopId
          }
        });

        if (error) throw error;
        if (data.error) throw new Error(data.error);
        return data;
      }

      // Fluxo antigo (apenas convite sem senha)
      const { data, error } = await supabase
        .from('barbers')
        .insert({
          name: barber.name,
          phone: barber.phone,
          email: barber.email,
          commission: barber.commission,
          active: true,
          barbershop_id: user.barbershopId
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barbers', user?.barbershopId] });
    },
  });
}

export function useUpdateBarber() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (barber: Partial<Barber> & { id: string }) => {
      const { data, error } = await supabase
        .from('barbers')
        .update(barber)
        .eq('id', barber.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barbers', user?.barbershopId] });
    },
  });
}

export function useDeleteBarber() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('barbers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barbers', user?.barbershopId] });
    },
  });
}

export function useToggleBarberActive() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { data, error } = await supabase
        .from('barbers')
        .update({ active })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barbers', user?.barbershopId] });
    },
  });
}
