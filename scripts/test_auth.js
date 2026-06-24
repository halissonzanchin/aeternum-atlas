import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env manually
const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length > 0) {
    env[key.trim()] = values.join('=').trim();
  }
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAccess() {
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'admin@aeternumatlas.com',
    password: 'AeternumDemo2026!'
  });

  if (signInError) {
    console.error("Login falhou:", signInError.message);
    return;
  }

  console.log("Login bem-sucedido via Auth API!");

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', signInData.user.id)
    .single();

  if (profileError) {
    console.error("Erro ao buscar public.users:", profileError.message);
  } else {
    console.log("Perfil público carregado com sucesso!");
    console.log(`Role atual no BD: ${profile.role}`);
  }
}

testAccess();
