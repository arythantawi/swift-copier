import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_URL = "https://scan.flowkirim.com";

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
  // Add WhatsApp suffix
  return `${cleaned}@s.whatsapp.net`;
};

const generateWhatsAppMessage = (booking: BookingData): string => {
  const formattedPrice = formatCurrency(booking.total_price);
  const formattedDate = formatDate(booking.travel_date);
  const route = booking.route_via
    ? `${booking.route_from} → ${booking.route_via} → ${booking.route_to}`
    : `${booking.route_from} → ${booking.route_to}`;

  let message = `Halo ${booking.customer_name},

Terima kasih telah memesan travel di *44 Trans Jawa Bali*.

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

📎 *Tiket PDF akan dikirim setelah pesan ini.*
Mohon simpan tiket ini dan tunjukkan saat penjemputan.
Terima kasih! 🙏`;

  return message;
};

// Get active session from FlowKirim
async function getActiveSession(apiKey: string, deviceId: string): Promise<string> {
  console.log(`Getting active session for device: ${deviceId}`);
  
  const response = await fetch(`${BASE_URL}/api/whatsapp/sessions/${deviceId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  const result = await response.json();
  console.log("Session response:", JSON.stringify(result));

  if (!response.ok || !result.success) {
    throw new Error(`Failed to get session: ${JSON.stringify(result)}`);
  }

  return result.data.session_id;
}

// Send text message via FlowKirim
async function sendTextMessage(
  apiKey: string,
  sessionId: string,
  phone: string,
  message: string
): Promise<{ success: boolean; messageId?: string }> {
  console.log(`Sending text message to ${phone}`);

  const response = await fetch(`${BASE_URL}/api/whatsapp/messages/text`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session_id: sessionId,
      message: message,
      to: phone,
    }),
  });

  const result = await response.json();
  console.log("Text message response:", JSON.stringify(result));

  if (!response.ok || !result.success) {
    throw new Error(`Failed to send text message: ${JSON.stringify(result)}`);
  }

  return { success: true, messageId: result.data?.message_id };
}

// Send document via FlowKirim - try multiple endpoints
async function sendDocument(
  apiKey: string,
  sessionId: string,
  phone: string,
  base64Document: string,
  filename: string,
  caption: string
): Promise<{ success: boolean; messageId?: string }> {
  console.log(`Sending document to ${phone}: ${filename}`);

  // Try different possible endpoints for document sending
  const endpoints = [
    "/api/whatsapp/messages/media",
    "/api/whatsapp/messages/file",
    "/api/whatsapp/send-document",
    "/api/whatsapp/messages/document",
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Trying endpoint: ${endpoint}`);
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          to: phone,
          document: base64Document,
          media: base64Document,
          file: base64Document,
          filename: filename,
          caption: caption,
          mimetype: "application/pdf",
        }),
      });

      const text = await response.text();
      console.log(`Response from ${endpoint}:`, text.substring(0, 200));
      
      // Check if it's valid JSON
      if (text.startsWith("{")) {
        const result = JSON.parse(text);
        if (result.success) {
          console.log("Document sent successfully via:", endpoint);
          return { success: true, messageId: result.data?.message_id };
        }
      }
    } catch (err) {
      console.log(`Endpoint ${endpoint} failed:`, err);
    }
  }

  console.log("All document endpoints failed, document not sent");
  return { success: false };
}

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

    // Step 1: Get active session
    const sessionId = await getActiveSession(FLOWKIRIM_API_KEY, FLOWKIRIM_DEVICE_ID);
    console.log(`Got session ID: ${sessionId}`);

    // Step 2: Send text message
    const textResult = await sendTextMessage(FLOWKIRIM_API_KEY, sessionId, phone, message);
    console.log(`Text message sent: ${textResult.success}`);

    // Step 3: Send PDF document
    const docResult = await sendDocument(
      FLOWKIRIM_API_KEY,
      sessionId,
      phone,
      ticketBase64,
      `Tiket-${booking.order_id}.pdf`,
      `📎 E-Ticket ${booking.order_id}`
    );
    console.log(`Document sent: ${docResult.success}`);

    console.log(`Successfully sent WhatsApp ticket to ${phone} for order ${booking.order_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        textSent: textResult.success,
        documentSent: docResult.success,
        message: `WhatsApp ticket sent to ${phone}`,
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
