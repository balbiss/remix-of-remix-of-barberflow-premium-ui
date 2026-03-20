const WUZAPI_URL = 'https://weeb.inoovaweb.com.br';
const WUZAPI_ADMIN_TOKEN = '44507d94623ef3c92c7c8b908b786836';

export interface WuzapiStatus {
  connected: boolean;
  instance_key?: string;
  phone_connected?: string;
}

export const whatsappApi = {
  createInstance: async (name: string, token: string) => {
    const response = await fetch(`${WUZAPI_URL}/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': WUZAPI_ADMIN_TOKEN,
      },
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
    const response = await fetch(`${WUZAPI_URL}/session/pairphone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': instanceToken,
      },
      body: JSON.stringify({ Phone: cleanPhone }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao gerar código de pareamento');
    }

    const data = await response.json();
    return data.data?.LinkingCode;
  },

  getStatus: async (instanceToken: string): Promise<WuzapiStatus> => {
    const response = await fetch(`${WUZAPI_URL}/session/status`, {
      method: 'GET',
      headers: {
        'token': instanceToken,
      },
    });

    if (!response.ok) {
      return { connected: false };
    }

    const data = await response.json();
    return {
      connected: data.data?.Connected && data.data?.LoggedIn,
      // Note: mapping case from API response (Connected, LoggedIn)
    };
  },

  checkUser: async (instanceToken: string, phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const response = await fetch(`${WUZAPI_URL}/user/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': instanceToken,
      },
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
    const response = await fetch(`${WUZAPI_URL}/chat/send/text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': instanceToken,
      },
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
