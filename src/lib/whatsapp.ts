import { supabase } from './supabase';

const PROXY_URL = 'https://oziqitfcquydsmzgxgsv.supabase.co/functions/v1/whatsapp-api';

export interface WuzapiStatus {
  connected: boolean;
  instance_key?: string;
  phone_connected?: string;
}

export const formatWhatsAppNumber = (phone: string): string => {
  let cleanPhone = phone.replace(/\D/g, '');
  
  // Se o número tiver 10 ou 11 dígitos, assumimos que é do Brasil e não tem DDI
  if (cleanPhone.length === 10 || cleanPhone.length === 11) {
    cleanPhone = `55${cleanPhone}`;
  }
  
  return cleanPhone;
};

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
      throw new Error(error.error || 'Erro ao criar instância');
    }
    
    const result = await response.json();
    return result.data; // Includes id, name, token
  },

  deleteInstance: async (instanceId?: string, token?: string) => {
    const headers = await getHeaders();
    const url = instanceId 
      ? `${PROXY_URL}/admin/users/${instanceId}/full`
      : `${PROXY_URL}/admin/users/full?token=${token}`;
      
    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao excluir instância');
    }
    
    return await response.json();
  },

  getPairingCode: async (instanceToken: string, phone: string) => {
    const formattedPhone = formatWhatsAppNumber(phone);

    // Step 1: Connect to WhatsApp servers (required before pairphone)
    await whatsappApi.connectSession(instanceToken);

    // Wait a moment for the connection to establish
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 2: Get pairing code
    const headers = await getHeaders(instanceToken);
    const response = await fetch(`${PROXY_URL}/session/pairphone`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ Phone: formattedPhone }),
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
    const statusData = data.data || {};
    
    // Support both Connected (OpenAPI) and connected (Actual API)
    const isConnected = !!(statusData.Connected || statusData.connected);
    const isLoggedIn = !!(statusData.LoggedIn || statusData.loggedIn);

    console.log('[Wuzapi] Status response:', { isConnected, isLoggedIn, raw: statusData });

    return {
      connected: isConnected && isLoggedIn,
    };
  },

  checkUser: async (instanceToken: string, phone: string): Promise<string | boolean> => {
    const formattedPhone = formatWhatsAppNumber(phone);
    const headers = await getHeaders(instanceToken);
    
    try {
      const response = await fetch(`${PROXY_URL}/user/check`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ Phone: [formattedPhone] }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[Wuzapi] Error checking number /user/check: ${errorText}`);
        
        if (errorText.includes('no session')) {
          console.warn('[Wuzapi] Sessão inativa detectada no checkUser, tentando reconectar em background...');
          // Tenta reconectar a sessão que caiu por restart do servidor do WuzAPI
          whatsappApi.connectSession(instanceToken).catch(console.error);
        }

        // Se a API externa estiver dando erro 500, assumimos true para não travar o fluxo
        // Pior cenário: a mensagem falha ao enviar, o que já engatilha o PIN na tela fallback.
        if (response.status === 500) {
          console.log('[Wuzapi] Ignorando erro 500 do /user/check e autorizando o envio.');
          return true;
        }

        throw new Error('Erro ao verificar número no WhatsApp');
      }

      const result = await response.json();
      // O Wuzapi retorna a lista de usuários validados num array.
      const user = result.data?.Users?.[0];
      if (user?.IsInWhatsapp && user?.JID) {
        return user.JID; // Retorna o JID exato que o WhatsApp reconheceu (ex: sem o nono dígito)
      }
      return user?.IsInWhatsapp || false;
    } catch (err: any) {
      console.warn(`[Wuzapi] Exception during checkUser: ${err.message}`);
      // Permitir que tente enviar de qualquer forma para não bloquear vendas
      return true;
    }
  },

  sendText: async (instanceToken: string, number: string, text: string) => {
    const formattedPhone = formatWhatsAppNumber(number);
    const headers = await getHeaders(instanceToken);
    const response = await fetch(`${PROXY_URL}/chat/send/text`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        Phone: formattedPhone,
        Body: text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorObj;
      try {
        errorObj = JSON.parse(errorText);
      } catch (e) {
        errorObj = { error: errorText };
      }

      const errorMessage = errorObj.error || errorObj.message || errorText;

      // Auto reconnect se a sessão estiver offline e tenta enviar novamente
      if (typeof errorMessage === 'string' && errorMessage.includes('no session')) {
        console.warn('[Wuzapi] Sessão inativa detectada no sendText, reconectando e tentando novamente...');
        await whatsappApi.connectSession(instanceToken);
        
        // Aguarda 3 segundos para dar tempo do WuzAPI conectar o socket
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const retryResponse = await fetch(`${PROXY_URL}/chat/send/text`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            Phone: formattedPhone,
            Body: text,
          }),
        });

        if (!retryResponse.ok) {
          const retryError = await retryResponse.json().catch(() => ({}));
          throw new Error(retryError.error || retryError.message || 'Erro ao enviar mensagem na segunda tentativa');
        }
        return retryResponse.json();
      }

      throw new Error(errorMessage || 'Erro ao enviar mensagem');
    }

    return response.json();
  },
};
