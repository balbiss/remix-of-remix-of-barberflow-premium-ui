import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("Cakto Webhook Payload:", JSON.stringify(payload));
    
    // Status do evento vindo da Cakto. Normalmente é 'approved' ou 'paid'
    const status = payload?.status || payload?.event || payload?.order_status || "";
    
    // E-mail do cliente (comprador)
    const email = payload?.customer?.email || payload?.client?.email || payload?.email;

    if (!email) {
      console.error("No email found in Cakto payload.");
      return new Response(JSON.stringify({ error: "No email provided in payload." }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      });
    }

    // Só processa se o pagamento foi aprovado (podem ocorrer outros eventos como refund, chargeback, etc)
    const isApproved = ['approved', 'paid', 'completed', 'approved_payment'].includes(status.toLowerCase());

    if (!isApproved) {
      console.log(`Payment status is ${status}. Ignoring webhook for activation.`);
      return new Response(JSON.stringify({ message: `Status '${status}' ignored.` }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      });
    }

    // Inicializa o cliente Supabase com a Service Role Key para ignorar RLS e poder atualizar
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Achar o usuário com o email da compra
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('id, barbershop_id')
      .eq('email', email)
      .single();

    if (userError || !userData) {
      console.error(`User with email ${email} not found in database.`);
      return new Response(JSON.stringify({ error: "User not found." }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404 
      });
    }

    const barbershopId = userData.barbershop_id;

    if (!barbershopId) {
      console.error(`User ${email} does not have a linked barbershop_id.`);
      return new Response(JSON.stringify({ error: "No barbershop linked to user." }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      });
    }

    // 2. Atualizar o status da barbearia para 'active'
    const { error: updateError } = await supabaseClient
      .from('barbershops')
      .update({ subscription_status: 'active' })
      .eq('id', barbershopId);

    if (updateError) {
      console.error(`Failed to update subscription status for barbershop ${barbershopId}. Error: ${updateError.message}`);
      return new Response(JSON.stringify({ error: "Failed to update barbershop." }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      });
    }

    console.log(`Successfully activated subscription for barbershop ${barbershopId} (User: ${email}).`);
    
    return new Response(JSON.stringify({ success: true, message: "Subscription activated." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
    
  } catch (error) {
    console.error("Error processing Cakto webhook:", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred." }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500 
    });
  }
});
