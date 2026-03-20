import { supabase } from './supabase';
import { whatsappApi } from './whatsapp';

export const whatsappService = {
  sendTemplateMessage: async (
    barbershopId: string, 
    clientId: string, 
    templateLabel: string, 
    variables: Record<string, string>
  ) => {
    try {
      // 1. Get Barbershop WhatsApp Config
      const { data: barbershop, error: bError } = await supabase
        .from('barbershops')
        .select('name, whatsapp_instance_token, whatsapp_status')
        .eq('id', barbershopId)
        .single();

      if (bError || !barbershop?.whatsapp_instance_token || barbershop.whatsapp_status !== 'connected') {
        console.warn('WhatsApp not connected for this barbershop');
        return;
      }

      // 2. Get Client Phone
      const { data: client, error: cError } = await supabase
        .from('clients')
        .select('name, phone')
        .eq('id', clientId)
        .single();

      if (cError || !client?.phone) {
        console.warn('Client phone not found');
        return;
      }

      // 3. Get Template
      const { data: template, error: tError } = await supabase
        .from('message_templates')
        .select('template, active')
        .eq('barbershop_id', barbershopId)
        .eq('label', templateLabel)
        .single();

      if (tError || !template?.active) {
        console.warn(`Template ${templateLabel} not found or inactive`);
        return;
      }

      // 4. Mount Message
      let message = template.template;
      const allVars = {
        ...variables,
        nome: client.name,
        barbearia: barbershop.name,
      };

      Object.entries(allVars).forEach(([key, value]) => {
        message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
      });

      // 5. Verify User
      const hasWhatsapp = await whatsappApi.checkUser(barbershop.whatsapp_instance_token, client.phone);
      if (!hasWhatsapp) {
        console.warn('Client does not have a valid WhatsApp account');
        return;
      }

      // 6. Send
      await whatsappApi.sendText(barbershop.whatsapp_instance_token, client.phone, message);
      console.log(`Message sent to ${client.phone}: ${message}`);
    } catch (err) {
      console.error('Error in whatsappService.sendTemplateMessage:', err);
    }
  },

  sendValidationCode: async (
    barbershopId: string,
    clientId: string,
    pin: string
  ) => {
    try {
      // 1. Get Barbershop WhatsApp Config
      const { data: barbershop, error: bError } = await supabase
        .from('barbershops')
        .select('name, whatsapp_instance_token, whatsapp_status')
        .eq('id', barbershopId)
        .single();

      if (bError || !barbershop?.whatsapp_instance_token || barbershop.whatsapp_status !== 'connected') {
        return { success: false, error: 'WhatsApp não conectado para esta barbearia.' };
      }

      // 2. Get Client Phone
      const { data: client, error: cError } = await supabase
        .from('clients')
        .select('name, phone')
        .eq('id', clientId)
        .single();

      if (cError || !client?.phone) {
        return { success: false, error: 'Cliente sem número de telefone cadastrado.' };
      }

      // 3. Verify Number
      const hasWhatsapp = await whatsappApi.checkUser(barbershop.whatsapp_instance_token, client.phone);
      if (!hasWhatsapp) {
        return { success: false, error: 'O número de telefone não está associado a uma conta WhatsApp.' };
      }

      // 4. Mount Message
      const message = `Seu código de validação de atendimento na barbearia *${barbershop.name}* é: *${pin}*\n\nInforme este código ao seu barbeiro para concluir o atendimento e garantir seus pontos de fidelidade!`;

      // 5. Send Message
      await whatsappApi.sendText(barbershop.whatsapp_instance_token, client.phone, message);
      console.log(`Validation code sent to ${client.phone}: ${pin}`);
      
      return { success: true };
    } catch (err: any) {
      console.error('Error in whatsappService.sendValidationCode:', err);
      return { success: false, error: err.message || 'Erro inesperado ao enviar mensagem.' };
    }
  }
};
