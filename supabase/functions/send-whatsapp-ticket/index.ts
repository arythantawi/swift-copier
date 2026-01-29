import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface BookingData {
  order_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  route_from: string;
  route_to: string;
  route_via?: string | null;
  travel_date: string;
  pickup_time: string;
  pickup_address: string;
  dropoff_address?: string | null;
  passengers: number;
  total_price: number;
  notes?: string | null;
}

interface RequestBody {
  booking: BookingData;
  ticketBase64: string;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatPhoneForWhatsApp = (phone: string): string => {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1);
  }
  if (!cleaned.startsWith("62")) {
    cleaned = "62" + cleaned;
  }
  return cleaned;
};

const generateWhatsAppMessage = (booking: BookingData): string => {
  const formattedPrice = formatCurrency(booking.total_price);
  const formattedDate = formatDate(booking.travel_date);
  const route = booking.route_via
    ? `${booking.route_from} → ${booking.route_via} → ${booking.route_to}`
    : `${booking.route_from} → ${booking.route_to}`;

  let message = `Halo ${booking.customer_name},

Terima kasih telah memesan travel di *Obie Travel*.

*🎫 TIKET PERJALANAN ANDA*
━━━━━━━━━━━━━━━
📋 Order ID: ${booking.order_id}
🛤️ Rute: ${route}
📅 Tanggal: ${formattedDate}
⏰ Jam Jemput: ${booking.pickup_time}
📍 Alamat Jemput: ${booking.pickup_address}`;

  if (booking.dropoff_address) {
    message += `
🎯 Alamat Antar: ${booking.dropoff_address}`;
  }

  message += `
👥 Jumlah Penumpang: ${booking.passengers}
💰 Total: ${formattedPrice}
━━━━━━━━━━━━━━━
✅ Status: *LUNAS*

📎 *Tiket PDF terlampir.*
Mohon simpan tiket ini dan tunjukkan saat penjemputan.
Terima kasih! 🙏`;

  return message;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const FLOWKIRIM_API_KEY = Deno.env.get("FLOWKIRIM_API_KEY");
    const FLOWKIRIM_DEVICE_ID = Deno.env.get("FLOWKIRIM_DEVICE_ID");

    if (!FLOWKIRIM_API_KEY) {
      console.error("FLOWKIRIM_API_KEY is not configured");
      return new Response(
        JSON.stringify({ success: false, error: "FLOWKIRIM_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!FLOWKIRIM_DEVICE_ID) {
      console.error("FLOWKIRIM_DEVICE_ID is not configured");
      return new Response(
        JSON.stringify({ success: false, error: "FLOWKIRIM_DEVICE_ID is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { booking, ticketBase64 }: RequestBody = await req.json();

    if (!booking || !ticketBase64) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing booking or ticketBase64" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const phone = formatPhoneForWhatsApp(booking.customer_phone);
    const message = generateWhatsAppMessage(booking);

    console.log(`Sending WhatsApp ticket to ${phone} for order ${booking.order_id}`);

    // Step 1: Send the text message first
    const textMessagePayload = {
      api_key: FLOWKIRIM_API_KEY,
      device_id: FLOWKIRIM_DEVICE_ID,
      phone: phone,
      message: message,
    };

    console.log("Sending text message via FlowKirim...");
    
    const textResponse = await fetch("https://panel.flowkirim.com/api/send-message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(textMessagePayload),
    });

    const textResult = await textResponse.json();
    console.log("FlowKirim text response:", JSON.stringify(textResult));

    if (!textResponse.ok) {
      console.error("FlowKirim text API error:", textResult);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to send text message", 
          details: textResult 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Send the PDF document
    const documentPayload = {
      api_key: FLOWKIRIM_API_KEY,
      device_id: FLOWKIRIM_DEVICE_ID,
      phone: phone,
      document: ticketBase64,
      filename: `Tiket-${booking.order_id}.pdf`,
      caption: `📎 E-Ticket ${booking.order_id}`,
    };

    console.log("Sending PDF document via FlowKirim...");
    
    const docResponse = await fetch("https://panel.flowkirim.com/api/send-document", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(documentPayload),
    });

    const docResult = await docResponse.json();
    console.log("FlowKirim document response:", JSON.stringify(docResult));

    if (!docResponse.ok) {
      console.error("FlowKirim document API error:", docResult);
      return new Response(
        JSON.stringify({ 
          success: true, 
          textSent: true,
          documentSent: false,
          error: "Text sent but document failed",
          details: docResult 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully sent WhatsApp ticket to ${phone} for order ${booking.order_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        textSent: true,
        documentSent: true,
        message: `WhatsApp ticket sent to ${phone}` 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in send-whatsapp-ticket:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
