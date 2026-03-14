import { serve } from "https://deno.land/std/http/server.ts";
import jwt from "npm:jsonwebtoken";

const FYGARO_SECRET = Deno.env.get("FYGARO_SECRET")!;
const FYGARO_KID = Deno.env.get("FYGARO_KID")!;
const MERCHANT_ID = Deno.env.get("FYGARO_MERCHANT_ID")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { amount, orderNumber, customerName, products } = await req.json();

    if (!amount || Number(amount) <= 0) {
      return new Response(JSON.stringify({ error: "Amount must be positive" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    if (!FYGARO_SECRET || !FYGARO_KID || !MERCHANT_ID) {
      return new Response(JSON.stringify({ error: "Missing environment variables" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    // Construct payload
    const payload = {
      amount: amount.toString(),
      currency: "BSD",
      custom_reference: orderNumber || "",
      customerName: customerName || "",
      products: products || [], // array of { name, qty }
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 10 * 60, // expires in 10 mins
    };

    // Construct header
    const header = {
      alg: "HS256",
      typ: "JWT",
      kid: FYGARO_KID,
    };

    const token = jwt.sign(payload, FYGARO_SECRET, { algorithm: "HS256", header });

    const checkoutUrl = `https://www.fygaro.com/en/pb/${MERCHANT_ID}/?jwt=${token}`;

    return new Response(JSON.stringify({ url: checkoutUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: err.message || "Failed to create payment" }),
      { status: 500, headers: corsHeaders }
    );
  }
});