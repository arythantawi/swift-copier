import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as encodeBase64 } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

async function getAccessToken(): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
      client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
      refresh_token: Deno.env.get('GOOGLE_REFRESH_TOKEN')!,
      grant_type: 'refresh_token',
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error('Failed to get access token');
  return data.access_token;
}

async function uploadToDrive(
  accessToken: string, fileContent: Uint8Array, fileName: string, mimeType: string
): Promise<{ id: string; webViewLink: string }> {
  const folderId = Deno.env.get('GOOGLE_DRIVE_FOLDER_ID');
  const metadata = { name: fileName, parents: folderId ? [folderId] : [] };
  const boundary = '-------314159265358979323846';
  const encoder = new TextEncoder();

  const metadataPart = encoder.encode(
    `\r\n--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`
  );
  const filePart = encoder.encode(
    `\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\nContent-Transfer-Encoding: base64\r\n\r\n`
  );
  const base64Part = encoder.encode(encodeBase64(Uint8Array.from(fileContent).buffer));
  const closePart = encoder.encode(`\r\n--${boundary}--`);

  const body = new Uint8Array(metadataPart.length + filePart.length + base64Part.length + closePart.length);
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
      body,
    }
  );
  const data = await response.json();
  if (!response.ok) throw new Error('Failed to upload to Drive');

  // Make publicly viewable
  await fetch(`https://www.googleapis.com/drive/v3/files/${data.id}/permissions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'reader', type: 'anyone' }),
  });

  return { id: data.id, webViewLink: `https://drive.google.com/file/d/${data.id}/view` };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    // Verify admin auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    
    // Verify user is admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await createClient(
      Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!
    ).auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
    const isAdmin = roles?.some(r => r.role === 'admin' || r.role === 'super_admin');
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const vehicleId = formData.get('vehicleId') as string;

    if (!file) {
      return new Response(JSON.stringify({ error: 'File diperlukan' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return new Response(JSON.stringify({ error: 'Gunakan format JPG, PNG, atau WebP' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (file.size > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ error: 'Ukuran file melebihi 5MB' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const fileContent = new Uint8Array(await file.arrayBuffer());
    const accessToken = await getAccessToken();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `fleet_${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const driveResult = await uploadToDrive(accessToken, fileContent, fileName, file.type);
    const imageUrl = `https://lh3.googleusercontent.com/d/${driveResult.id}`;

    // Update vehicle record if vehicleId provided
    if (vehicleId) {
      await supabase.from('fleet_vehicles').update({
        image_url: imageUrl,
        image_drive_id: driveResult.id,
      }).eq('id', vehicleId);
    }

    return new Response(
      JSON.stringify({ success: true, imageUrl, driveId: driveResult.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(
      JSON.stringify({ error: 'Gagal mengunggah gambar' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
