import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { encode as encodeBase64 } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FLOWKIRIM_BASE_URL = "https://scan.flowkirim.com";

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
  return `${cleaned}@s.whatsapp.net`;
};

const generateWhatsAppMessage = (booking: BookingData, pdfLink: string): string => {
  const formattedPrice = formatCurrency(booking.total_price);
  const formattedDate = formatDate(booking.travel_date);
  const route = booking.route_via
    ? `${booking.route_from} → ${booking.route_via} → ${booking.route_to}`
    : `${booking.route_from} → ${booking.route_to}`;

  let message = `Halo ${booking.customer_name},

Terima kasih telah memilih *44 Trans Jawa Bali* sebagai partner perjalanan Anda.

Pemesanan perjalanan Anda telah berhasil kami konfirmasi dengan detail sebagai berikut:

━━━━━━━━━━━━━━━━━━
🎫 *TIKET PERJALANAN*
📋 Order ID  : ${booking.order_id}
🛤️ Rute   : ${route}
📅 Tanggal  : ${formattedDate}
⏰ Penjemputan : ${booking.pickup_time} WIB
📍 Alamat Jemput : ${booking.pickup_address}`;

  if (booking.dropoff_address) {
    message += `
🎯 Alamat Antar : ${booking.dropoff_address}`;
  }

  message += `
👤 Penumpang : ${booking.passengers} Orang
💳 Total   : ${formattedPrice}
━━━━━━━━━━━━━━━━━━
✅ Status Pembayaran: *LUNAS*

📎 *Tiket Resmi (PDF)*
Silakan unduh tiket perjalanan Anda melalui tautan berikut:
🔗 ${pdfLink}

Mohon simpan tiket tersebut dan tunjukkan kepada kru kami saat penjemputan.

━━━━━━━━━━━━━━━━━━
📝 *Catatan Penting*
Demi keamanan dan kenyamanan bersama, kami mengimbau agar seluruh pemesanan dilakukan melalui kantor resmi, website resmi, atau nomor resmi 44 Trans Jawa Bali.
Langkah ini bertujuan untuk menghindari potensi penipuan serta memastikan Anda selalu mendapatkan layanan resmi dan berkelanjutan.

━━━━━━━━━━━━━━━━━━
⭐ *Ulasan Pelanggan*
Setelah perjalanan selesai, kami sangat menghargai kesediaan Anda untuk memberikan ulasan pengalaman perjalanan melalui profil akun Anda di website resmi 44 Trans Jawa Bali.
Ulasan Anda sangat berarti bagi peningkatan kualitas layanan kami dan menjadi referensi bagi pelanggan lainnya.

━━━━━━━━━━━━━━━━━━

Terima kasih atas kepercayaan Anda.
Kami berkomitmen memberikan perjalanan yang aman, nyaman, dan berkelas, serta menantikan perjalanan Anda bersama kami kembali.

*44 Trans Jawa Bali*
_Perjalanan Premium • Layanan Terpercaya_`;

  return message;
};

// Get Google Drive access token
async function getGoogleAccessToken(): Promise<string> {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
  const refreshToken = Deno.env.get('GOOGLE_REFRESH_TOKEN');

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Google Drive credentials not configured');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error('Token refresh error:', data);
    throw new Error('Failed to get Google access token');
  }

  return data.access_token;
}

// Upload PDF to Google Drive
async function uploadPdfToGoogleDrive(
  accessToken: string,
  base64Content: string,
  fileName: string
): Promise<string> {
  const folderId = Deno.env.get('GOOGLE_DRIVE_FOLDER_ID');

  const metadata = {
    name: fileName,
    parents: folderId ? [folderId] : [],
  };

  const boundary = '-------314159265358979323846';
  const delimiter = "\r\n--" + boundary + "\r\n";
  const closeDelim = "\r\n--" + boundary + "--";

  const metadataString = JSON.stringify(metadata);
  const encoder = new TextEncoder();

  const metadataPart = encoder.encode(
    delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      metadataString
  );

  const filePart = encoder.encode(
    delimiter +
      'Content-Type: application/pdf\r\n' +
      'Content-Transfer-Encoding: base64\r\n\r\n'
  );

  const base64Part = encoder.encode(base64Content);
  const closePart = encoder.encode(closeDelim);

  const body = new Uint8Array(
    metadataPart.length + filePart.length + base64Part.length + closePart.length
  );
  body.set(metadataPart, 0);
  body.set(filePart, metadataPart.length);
  body.set(base64Part, metadataPart.length + filePart.length);
  body.set(closePart, metadataPart.length + filePart.length + base64Part.length);

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: body,
    }
  );

  const data = await response.json();
  if (!response.ok) {
    console.error('Drive upload error:', data);
    throw new Error('Failed to upload PDF to Google Drive');
  }

  // Make file publicly viewable
  await fetch(`https://www.googleapis.com/drive/v3/files/${data.id}/permissions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      role: 'reader',
      type: 'anyone',
    }),
  });

  console.log(`PDF uploaded to Drive: ${data.id}`);
  return data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`;
}

// Get active session from FlowKirim
async function getActiveSession(apiKey: string, deviceId: string): Promise<string> {
  console.log(`Getting active session for device: ${deviceId}`);
  
  const response = await fetch(`${FLOWKIRIM_BASE_URL}/api/whatsapp/sessions/${deviceId}`, {
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

  const response = await fetch(`${FLOWKIRIM_BASE_URL}/api/whatsapp/messages/text`, {
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

serve(async (req) => {
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
    console.log(`Processing WhatsApp ticket for ${phone}, order ${booking.order_id}`);

    // Step 1: Upload PDF to Google Drive
    console.log("Uploading PDF to Google Drive...");
    const accessToken = await getGoogleAccessToken();
    const pdfLink = await uploadPdfToGoogleDrive(
      accessToken,
      ticketBase64,
      `Tiket-${booking.order_id}.pdf`
    );
    console.log(`PDF uploaded, link: ${pdfLink}`);

    // Step 2: Generate message with PDF link
    const message = generateWhatsAppMessage(booking, pdfLink);

    // Step 3: Get active WhatsApp session
    const sessionId = await getActiveSession(FLOWKIRIM_API_KEY, FLOWKIRIM_DEVICE_ID);
    console.log(`Got session ID: ${sessionId}`);

    // Step 4: Send text message with PDF link
    const textResult = await sendTextMessage(FLOWKIRIM_API_KEY, sessionId, phone, message);
    console.log(`Message sent: ${textResult.success}`);

    console.log(`Successfully sent WhatsApp ticket to ${phone} for order ${booking.order_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        messageSent: textResult.success,
        pdfLink: pdfLink,
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
