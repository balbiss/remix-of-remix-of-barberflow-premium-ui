import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, token',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const WUZAPI_URL = Deno.env.get('WUZAPI_URL') || 'https://weeb.inoovaweb.com.br';
    const WUZAPI_ADMIN_TOKEN = Deno.env.get('WUZAPI_ADMIN_TOKEN');

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

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': WUZAPI_ADMIN_TOKEN,
        'token': req.headers.get('token') || '',
      },
      body,
    });

    const responseData = await response.text();
    console.log(`[Proxy] Response: ${response.status}`);

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
