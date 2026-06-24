import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@aeternumatlas.com',
    password: 'AeternumDemo2026!'
  });
  
  if (error) {
    console.error('Login error:', error);
    return;
  }
  
  console.log('Logged in:', data.user.id);
  
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', data.user.id)
    .single();
    
  console.log('Profile:', profile);
  console.log('Profile Error:', profileError);
}

testAuth();
