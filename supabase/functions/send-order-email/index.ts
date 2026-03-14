import { serve } from "https://deno.land/std/http/server.ts";
import nodemailer from "npm:nodemailer";
import { google } from "npm:googleapis";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      customerName,
      email,
      phone,
      address,
      orderNumber,
      total,
      paymentMethod,
      paymentStatus,
      products,
    } = await req.json();

    // -------- SEND EMAIL --------
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: Deno.env.get("GMAIL_USER"),
        pass: Deno.env.get("GMAIL_PASS"),
      },
    });

    await transporter.sendMail({
      from: `"Hair Store" <${Deno.env.get("GMAIL_USER")}>`,
      to: email,
      subject: `Order Confirmation - ${orderNumber}`,
      text: `Hi ${customerName}, your order has been received.`,
    });

    // -------- GOOGLE SHEETS --------
    const serviceAccount = JSON.parse(Deno.env.get("GOOGLE_SERVICE_ACCOUNT")!);

    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const productList = products
      .map((p: any) => `${p.name} x${p.qty}`)
      .join("\n");

    // await sheets.spreadsheets.values.append({
    //   spreadsheetId: "1qNoXCT-I0-hXBbSJJn7JslX_TiG3nlaRHlJ4asnifQo",
    //   range: "Sheet1!A1",
    //   valueInputOption: "RAW",
    //   requestBody: {
    //     values: [
    //       [
    //         orderNumber,
    //         customerName,
    //         email,
    //         phone,
    //         address,
    //         productList,
    //         total,
    //         paymentMethod,
    //         paymentStatus,
    //         new Date().toISOString(),
    //       ],
    //     ],
    //   },
    // });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({
        error: err.message || "Failed"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
