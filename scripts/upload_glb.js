import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const filePath = path.join(process.cwd(), 'assets-pipeline/first-real-model/optimized/pch-ii-atlas-native-optimized.glb');
  const fileBuffer = fs.readFileSync(filePath);
  const fileName = 'corte-sagital-cranio-humano-superficial.glb';
  const storagePath = `models/native/${fileName}`;

  console.log(`Uploading ${fileName} (${fileBuffer.length} bytes) to ${storagePath}...`);

  const { data, error } = await supabase.storage
    .from('atlas-model-assets')
    .upload(storagePath, fileBuffer, {
      contentType: 'model/gltf-binary',
      upsert: true
    });

  if (error) {
    console.error('Upload Error:', error);
    return;
  }

  console.log('Upload successful!', data);

  const { data: urlData } = supabase.storage
    .from('atlas-model-assets')
    .getPublicUrl(storagePath);

  console.log('Public URL:', urlData.publicUrl);
}

run();
