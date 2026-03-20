import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, token',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Expose-Headers': 'X-Proxy-Config, X-Target-URL, X-Error-Body',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const WUZAPI_URL = (Deno.env.get('WUZAPI_URL') || 'https://weeb.inoovaweb.com.br').trim();
    const WUZAPI_ADMIN_TOKEN = Deno.env.get('WUZAPI_ADMIN_TOKEN')?.trim();

    console.log(`[Proxy] Config: URL="${WUZAPI_URL.substring(0, 15)}..."`);
    console.log(`[Proxy] Token: "${WUZAPI_ADMIN_TOKEN ? WUZAPI_ADMIN_TOKEN.substring(0, 4) : 'NULL'}..."`);

    if (!WUZAPI_ADMIN_TOKEN) {
      throw new Error('WUZAPI_ADMIN_TOKEN not configured');
    }

    const url = new URL(req.url);
    const path = url.pathname.replace('/whatsapp-api', '');
    const searchParams = url.searchParams;
    const tokenToSearch = searchParams.get('token');

    let targetUrl = `${WUZAPI_URL}${path}`;
    
    // Fallback: If it's a DELETE to /admin/users/.../full but we want to search by token
    if (req.method === 'DELETE' && path.includes('/full') && tokenToSearch) {
      console.log(`[Proxy] Searching for instance by token: ${tokenToSearch}`);
      
      const listResponse = await fetch(`${WUZAPI_URL}/admin/users`, {
        method: 'GET',
        headers: { 'Authorization': WUZAPI_ADMIN_TOKEN },
      });

      if (listResponse.ok) {
        const { data } = await listResponse.json();
        const user = data.find((u: any) => u.token === tokenToSearch);
        
        if (user) {
          console.log(`[Proxy] Found instance ID: ${user.id} for token: ${tokenToSearch}`);
          targetUrl = `${WUZAPI_URL}/admin/users/${user.id}/full`;
        } else {
          console.warn(`[Proxy] Instance NOT found for token: ${tokenToSearch}`);
          // If not found on Wuzapi, we consider it already deleted there
          return new Response(JSON.stringify({ 
            success: true, 
            details: "Instance not found on Wuzapi, assuming already deleted." 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }
      }
    }

    console.log(`[Proxy] Request: ${req.method} ${targetUrl}`);

    const body = ['POST', 'PUT', 'PATCH'].includes(req.method) 
      ? await req.text() 
      : undefined;

    // Helper to call Wuzapi
    const callWuzapi = async (authHeader: string) => {
      const headers: any = {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      };
      const tokenHeader = req.headers.get('token');
      if (tokenHeader) headers['token'] = tokenHeader;

      return await fetch(targetUrl, {
        method: req.method,
        headers,
        body,
      });
    };

    // Attempt 1: As configured
    let response = await callWuzapi(WUZAPI_ADMIN_TOKEN);
    let responseData = await response.text();

    // Attempt 2: Fallback to Bearer if 401 and not already using Bearer
    if (response.status === 401 && !WUZAPI_ADMIN_TOKEN.startsWith('Bearer ')) {
      console.log(`[Proxy] 401 Error. Retrying with Bearer...`);
      const retryResponse = await callWuzapi(`Bearer ${WUZAPI_ADMIN_TOKEN}`);
      const retryData = await retryResponse.text();
      
      if (retryResponse.ok || retryResponse.status !== 401) {
        response = retryResponse;
        responseData = retryData;
      }
    }

    console.log(`[Proxy] Final Response: ${response.status}`);
    
    if (!response.ok) {
      console.warn(`[Proxy] Error from target: ${responseData}`);
      return new Response(JSON.stringify({ 
        error: `Wuzapi Error ${response.status}: ${responseData.substring(0, 150)}`,
        diagnostic: {
          url: targetUrl,
          token_preview: `${WUZAPI_ADMIN_TOKEN.substring(0, 4)}...`,
          has_bearer: WUZAPI_ADMIN_TOKEN.startsWith('Bearer ')
        }
      }), {
        status: response.status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }

    return new Response(responseData, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error(`[Proxy] Error: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
