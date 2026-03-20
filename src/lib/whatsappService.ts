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

      // 4. Fill Template
      let message = template.template;
      const allVars = {
        ...variables,
        nome: client.name,
        barbearia: barbershop.name,
      };

      Object.entries(allVars).forEach(([key, value]) => {
        message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
      });

      // 5. Check if Number has WhatsApp (User Request)
      const hasWhatsApp = await whatsappApi.checkUser(barbershop.whatsapp_instance_token, client.phone);
      if (!hasWhatsApp) {
        console.warn(`Phone ${client.phone} is not on WhatsApp. Message not sent.`);
        return;
      }

      // 6. Send
      await whatsappApi.sendText(barbershop.whatsapp_instance_token, client.phone, message);
      console.log(`Message sent to ${client.phone}: ${message}`);
    } catch (err) {
      console.error('Error in whatsappService.sendTemplateMessage:', err);
    }
  }
};
