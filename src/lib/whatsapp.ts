import { supabase } from './supabase';

const PROXY_URL = 'https://oziqitfcquydsmzgxgsv.supabase.co/functions/v1/whatsapp-api';

export interface WuzapiStatus {
  connected: boolean;
  instance_key?: string;
  phone_connected?: string;
}

const getHeaders = async (instanceToken?: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': session ? `Bearer ${session.access_token}` : '',
  };
  if (instanceToken) {
    headers['token'] = instanceToken;
  }
  return headers;
};

export const whatsappApi = {
  // Step 1 of pairing: connects to WhatsApp servers (required before pairphone)
  connectSession: async (instanceToken: string) => {
    const headers = await getHeaders(instanceToken);
    const response = await fetch(`${PROXY_URL}/session/connect`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ Immediate: true }),
    });
    // We don't throw on error here since socket might already be connecting
    return response.json().catch(() => ({}));
  },

  createInstance: async (name: string, token: string) => {
    const headers = await getHeaders();
    const response = await fetch(`${PROXY_URL}/admin/users`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name, token }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao criar instância no Wuzapi');
    }
    
    return response.json();
  },

  getPairingCode: async (instanceToken: string, phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');

    // Step 1: Connect to WhatsApp servers (required before pairphone)
    await whatsappApi.connectSession(instanceToken);

    // Wait a moment for the connection to establish
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 2: Get pairing code
    const headers = await getHeaders(instanceToken);
    const response = await fetch(`${PROXY_URL}/session/pairphone`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ Phone: cleanPhone }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Erro ao gerar código (status ${response.status})`);
    }

    const data = await response.json();
    return data.data?.LinkingCode;
  },

  getStatus: async (instanceToken: string): Promise<WuzapiStatus> => {
    const headers = await getHeaders(instanceToken);
    const response = await fetch(`${PROXY_URL}/session/status`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      return { connected: false };
    }

    const data = await response.json();
    return {
      connected: data.data?.Connected && data.data?.LoggedIn,
    };
  },

  checkUser: async (instanceToken: string, phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const headers = await getHeaders(instanceToken);
    const response = await fetch(`${PROXY_URL}/user/check`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ Phone: [cleanPhone] }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao verificar número no WhatsApp');
    }

    const result = await response.json();
    return result.data?.Users?.[0]?.IsInWhatsapp || false;
  },

  sendText: async (instanceToken: string, number: string, text: string) => {
    const cleanNumber = number.replace(/\D/g, '');
    const headers = await getHeaders(instanceToken);
    const response = await fetch(`${PROXY_URL}/chat/send/text`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        Phone: cleanNumber,
        Body: text,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao enviar mensagem');
    }

    return response.json();
  },
};
