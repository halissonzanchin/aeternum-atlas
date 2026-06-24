import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const modelId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

  const modelPayload = {
    id: modelId,
    slug: 'corte-sagital-cranio-humano-superficial',
    title: 'Corte Sagital do Crânio Humano — Modelo Superficial 3D',
    description: 'Modelo anatômico em corte sagital da cabeça humana, útil para observar relações entre encéfalo, cavidades cranianas, vias aéreas superiores e planos medianos.',
    viewer_type: 'atlas-native',
    status: 'published',
    sketchfab_url: 'https://sketchfab.com/models/placeholder', // backup
  };

  const { data: modelData, error: modelError } = await supabase
    .from('atlas_models')
    .upsert(modelPayload, { onConflict: 'id' })
    .select()
    .single();

  if (modelError) {
    console.error('Error inserting model:', modelError);
    return;
  }
  
  console.log('Model successfully inserted in Supabase DB:', modelData.id);

  const assetPayload = {
    model_id: modelId,
    file_name: 'corte-sagital-cranio-humano-superficial.glb',
    file_path: '/models/native/corte-sagital-cranio-humano-superficial.glb',
    file_format: 'glb',
    file_size: 15718752,
    asset_url: '/models/native/corte-sagital-cranio-humano-superficial.glb',
    status: 'ready'
  };

  const { error: assetError } = await supabase
    .from('atlas_model_assets')
    .upsert(assetPayload, { onConflict: 'id' });

  if (assetError && assetError.code !== '42703' && assetError.code !== '23505') {
      // ignoring some unique constrait or column not found if 'id' isn't explicitly defined as conflict
      // let's do delete and insert
      await supabase.from('atlas_model_assets').delete().eq('model_id', modelId);
      const { error: insertError } = await supabase.from('atlas_model_assets').insert(assetPayload);
      if (insertError) {
          console.error('Error inserting asset:', insertError);
      } else {
          console.log('Asset successfully inserted in Supabase DB');
      }
  } else if (!assetError) {
      console.log('Asset successfully inserted in Supabase DB');
  } else {
      await supabase.from('atlas_model_assets').delete().eq('model_id', modelId);
      await supabase.from('atlas_model_assets').insert(assetPayload);
      console.log('Asset successfully inserted in Supabase DB');
  }

}

run();
