import { serve } from "https://deno.land/std/http/server.ts";
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_ANON_KEY")!
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    const { transactionId, customReference, amount, currency, createdAt } = payload;

    if (!transactionId || !customReference || !amount || !currency) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Update order in Supabase
    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        payment_status: "Paid",
        payment_transaction_id: transactionId,
      })
      .eq("order_number", customReference);

    if (updateError) {
      console.error("Failed to update order:", updateError);
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    console.log("Payment recorded for order:", customReference);

    return new Response(JSON.stringify({ status: "ok" }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: err.message || "Failed to process webhook" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});