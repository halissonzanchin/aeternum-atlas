import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'admin@aeternumatlas.com',
    password: 'AeternumDemo2026!'
  });
  if (signInError) return console.error('Sign in error:', signInError);
  
  const authUser = signInData.user;
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, institution_id, name, email, role, status')
    .eq('id', authUser.id)
    .maybeSingle();
    
  console.log('Profile:', profile);
  console.log('Error:', profileError);
}
test();
