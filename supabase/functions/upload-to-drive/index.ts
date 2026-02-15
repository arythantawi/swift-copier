import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as encodeBase64 } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory rate limiting (resets on function cold start)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5; // max 5 uploads per minute per IP

// Allowed file types and max size
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Order ID format validation:
// - New: TRV-YYYYMMDD-XXXX
// - Legacy: TRV-<13 digit timestamp>
const ORDER_ID_REGEX = /^TRV-(?:\d{8}-[A-Z0-9]{4,12}|\d{13})$/;

function checkRateLimit(clientIP: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(clientIP);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  record.count++;
  return true;
}

function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         req.headers.get('cf-connecting-ip') || 
         'unknown';
}

// Magic bytes validation for common image types
function validateFileContent(content: Uint8Array, mimeType: string): boolean {
  if (content.length < 4) return false;
  
  // Check magic bytes for images
  const magicBytes = content.slice(0, 8);
  
  // JPEG: FF D8 FF
  if (mimeType === 'image/jpeg') {
    return magicBytes[0] === 0xFF && magicBytes[1] === 0xD8 && magicBytes[2] === 0xFF;
  }
  
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (mimeType === 'image/png') {
    return magicBytes[0] === 0x89 && magicBytes[1] === 0x50 && 
           magicBytes[2] === 0x4E && magicBytes[3] === 0x47;
  }
  
  // GIF: 47 49 46 38
  if (mimeType === 'image/gif') {
    return magicBytes[0] === 0x47 && magicBytes[1] === 0x49 && 
           magicBytes[2] === 0x46 && magicBytes[3] === 0x38;
  }
  
  // WebP: 52 49 46 46 ... 57 45 42 50
  if (mimeType === 'image/webp') {
    return magicBytes[0] === 0x52 && magicBytes[1] === 0x49 && 
           magicBytes[2] === 0x46 && magicBytes[3] === 0x46;
  }
  
  // PDF: 25 50 44 46 (%PDF)
  if (mimeType === 'application/pdf') {
    return magicBytes[0] === 0x25 && magicBytes[1] === 0x50 && 
           magicBytes[2] === 0x44 && magicBytes[3] === 0x46;
  }
  
  return false;
}

async function getAccessToken(): Promise<string> {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
  const refreshToken = Deno.env.get('GOOGLE_REFRESH_TOKEN');

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      refresh_token: refreshToken!,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Token refresh error:', data);
    throw new Error('Gagal memproses permintaan');
  }

  return data.access_token;
}

async function uploadToDrive(
  accessToken: string,
  fileContent: Uint8Array,
  fileName: string,
  mimeType: string
): Promise<{ id: string; webViewLink: string }> {
  const folderId = Deno.env.get('GOOGLE_DRIVE_FOLDER_ID');

  const metadata = {
    name: fileName,
    parents: folderId ? [folderId] : [],
  };

  const boundary = '-------314159265358979323846';
  const delimiter = "\r\n--" + boundary + "\r\n";
  const closeDelim = "\r\n--" + boundary + "--";

  const metadataString = JSON.stringify(metadata);

  // Build multipart body
  const encoder = new TextEncoder();
  const metadataPart = encoder.encode(
    delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      metadataString
  );

  const filePart = encoder.encode(
    delimiter +
      'Content-Type: ' +
      mimeType +
      '\r\n' +
      'Content-Transfer-Encoding: base64\r\n\r\n'
  );

  // Convert file content to base64 safely
  const base64Content = encodeBase64(Uint8Array.from(fileContent).buffer);
  const base64Part = encoder.encode(base64Content);

  const closePart = encoder.encode(closeDelim);

  // Combine all parts
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
    throw new Error('Gagal mengunggah file');
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

  return {
    id: data.id,
    webViewLink: data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = getClientIP(req);
  const requestId = crypto.randomUUID().slice(0, 8);

  try {
    // 1. Rate limiting check
    if (!checkRateLimit(clientIP)) {
      console.warn(`[${requestId}] Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: 'Terlalu banyak permintaan. Coba lagi dalam 1 menit.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const orderId = formData.get('orderId') as string;

    // 2. Basic input validation
    if (!file || !orderId) {
      return new Response(
        JSON.stringify({ error: 'File dan Order ID diperlukan' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Order ID format validation
    if (!ORDER_ID_REGEX.test(orderId)) {
      console.warn(`[${requestId}] Invalid order ID format: ${orderId} from IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: 'Format Order ID tidak valid' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. File type validation
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      console.warn(`[${requestId}] Invalid file type: ${file.type} from IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: 'Tipe file tidak diizinkan. Gunakan JPG, PNG, WebP, GIF, atau PDF.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. File size validation
    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ error: 'Ukuran file melebihi batas 10MB' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 6. Verify booking exists and is in valid status for payment upload
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('order_id, payment_status, created_at')
      .eq('order_id', orderId)
      .single();

    if (bookingError || !booking) {
      console.warn(`[${requestId}] Booking not found: ${orderId} from IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: 'Booking tidak ditemukan' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 7. Check if booking is in valid status for payment upload
    const validStatuses = ['pending', 'waiting_verification'];
    if (!validStatuses.includes(booking.payment_status || 'pending')) {
      console.warn(`[${requestId}] Invalid booking status for upload: ${booking.payment_status} from IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: 'Status booking tidak memungkinkan untuk upload bukti pembayaran' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Read file content
    const arrayBuffer = await file.arrayBuffer();
    const fileContent = new Uint8Array(arrayBuffer);

    // 8. Validate file content (magic bytes check)
    if (!validateFileContent(fileContent, file.type)) {
      console.warn(`[${requestId}] File content mismatch for type: ${file.type} from IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: 'Konten file tidak valid atau tidak sesuai dengan tipe file' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${requestId}] Processing upload for order: ${orderId}, file: ${file.name}, IP: ${clientIP}`);

    // Get access token
    const accessToken = await getAccessToken();

    // Generate unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `payment-proof_${orderId}_${timestamp}_${sanitizedFileName}`;

    // Upload to Google Drive
    const driveResult = await uploadToDrive(accessToken, fileContent, fileName, file.type);

    console.log(`[${requestId}] File uploaded to Drive: ${driveResult.id} for order: ${orderId}`);

    // Update booking in database
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        payment_proof_url: driveResult.webViewLink,
        payment_proof_drive_id: driveResult.id,
        payment_status: 'waiting_verification',
      })
      .eq('order_id', orderId);

    if (updateError) {
      console.error(`[${requestId}] Database update error for order ${orderId}:`, updateError);
      throw new Error('Gagal memperbarui data booking');
    }

    return new Response(
      JSON.stringify({
        success: true,
        driveUrl: driveResult.webViewLink,
        driveId: driveResult.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[${requestId}] Upload error from IP ${clientIP}:`, error);
    return new Response(
      JSON.stringify({ error: 'Terjadi kesalahan saat mengunggah file' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
