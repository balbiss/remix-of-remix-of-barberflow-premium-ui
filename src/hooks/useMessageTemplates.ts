import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface MessageTemplate {
  id: string;
  barbershop_id: string;
  label: string;
  description: string;
  template: string;
  active: boolean;
  created_at?: string;
}

export function useMessageTemplates() {
  const { user } = useAuth();
  const barbershopId = user?.barbershopId;

  return useQuery({
    queryKey: ['message-templates', barbershopId],
    queryFn: async () => {
      if (!barbershopId) return [];
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('barbershop_id', barbershopId)
        .order('created_at');
      
      if (error) throw error;
      return data as MessageTemplate[];
    },
    enabled: !!barbershopId,
  });
}

export function useUpdateMessageTemplate() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: Partial<MessageTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from('message_templates')
        .update(template)
        .eq('id', template.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-templates', user?.barbershopId] });
    },
  });
}
