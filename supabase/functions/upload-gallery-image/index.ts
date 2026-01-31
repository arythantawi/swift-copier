import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];
// Reduced max file size for memory safety
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

async function getAccessToken(): Promise<string> {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
  const refreshToken = Deno.env.get('GOOGLE_REFRESH_TOKEN');

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Google Drive credentials not configured');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
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
    throw new Error('Failed to refresh Google token');
  }

  return data.access_token;
}

// Use resumable upload for better memory efficiency
async function uploadToDriveResumable(
  accessToken: string,
  fileContent: Uint8Array,
  fileName: string,
  mimeType: string
): Promise<{ id: string; webViewLink: string; thumbnailLink: string }> {
  const folderId = Deno.env.get('GOOGLE_DRIVE_FOLDER_ID');

  const metadata = {
    name: fileName,
    parents: folderId ? [folderId] : [],
  };

  // Step 1: Initiate resumable upload session
  const initResponse = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': mimeType,
        'X-Upload-Content-Length': fileContent.length.toString(),
      },
      body: JSON.stringify(metadata),
    }
  );

  if (!initResponse.ok) {
    const errorData = await initResponse.text();
    console.error('Resumable init error:', errorData);
    throw new Error('Failed to initiate upload');
  }

  const uploadUri = initResponse.headers.get('Location');
  if (!uploadUri) {
    throw new Error('No upload URI received');
  }

  // Step 2: Upload file content using ReadableStream
  const uploadResponse = await fetch(uploadUri, {
    method: 'PUT',
    headers: {
      'Content-Length': fileContent.length.toString(),
      'Content-Type': mimeType,
    },
    body: new ReadableStream({
      start(controller) {
        controller.enqueue(fileContent);
        controller.close();
      }
    }),
  });

  if (!uploadResponse.ok) {
    const errorData = await uploadResponse.text();
    console.error('Upload error:', errorData);
    throw new Error('Failed to upload file');
  }

  const data = await uploadResponse.json();

  // Step 3: Make file publicly viewable
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

  // Generate direct image URL for embedding
  const directImageUrl = `https://drive.google.com/uc?export=view&id=${data.id}`;

  return {
    id: data.id,
    webViewLink: data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`,
    thumbnailLink: directImageUrl,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin auth
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user is admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roleData || !['admin', 'super_admin'].includes(roleData.role)) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'File diperlukan' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // File type validation
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: 'Tipe file tidak diizinkan. Gunakan JPG, PNG, WebP, atau GIF.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // File size validation - reduced to 5MB for edge function memory safety
    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ error: 'Ukuran file melebihi batas 5MB. Silakan kompres gambar terlebih dahulu.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing gallery upload: ${file.name}, size: ${file.size}`);

    // Read file content
    const arrayBuffer = await file.arrayBuffer();
    const fileContent = new Uint8Array(arrayBuffer);

    // Get access token
    const accessToken = await getAccessToken();

    // Generate unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `gallery_${timestamp}_${sanitizedFileName}`;

    // Upload to Google Drive using resumable upload (more memory efficient)
    const driveResult = await uploadToDriveResumable(accessToken, fileContent, fileName, file.type);

    console.log(`Gallery image uploaded to Drive: ${driveResult.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        driveId: driveResult.id,
        imageUrl: driveResult.thumbnailLink,
        webViewLink: driveResult.webViewLink,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat mengunggah file';
    console.error('Gallery upload error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
