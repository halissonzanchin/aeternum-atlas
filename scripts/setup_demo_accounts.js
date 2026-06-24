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

const DEFAULT_PASSWORD = "AeternumDemo2026!";

const DEMO_ACCOUNTS = [
  {
    name: "Admin Aeternum",
    email: "admin@aeternumatlas.com",
    role: "admin",
    userType: "Aeternum Team",
    status: "active"
  },
  {
    name: "Reitor UPE",
    email: "reitor@upe.edu.py",
    role: "institution",
    userType: "Reitor",
    status: "active"
  },
  {
    name: "Coordenador Medicina",
    email: "coordenador@upe.edu.py",
    role: "institution",
    userType: "Coordenador",
    status: "active"
  },
  {
    name: "Dr. Roberto Mendes",
    email: "professor@upe.edu.py",
    role: "teacher",
    userType: "Professor",
    status: "active"
  },
  {
    name: "Estudante Demo",
    email: "demo@upe.edu.py",
    role: "student",
    userType: "Estudante",
    status: "active"
  }
];

async function createAccounts() {
  console.log("Iniciando injeção de roles públicos...");

  // Para contornar o UUID fake, criaremos um válido ou passaremos null
  let fakeUuid = "00000000-0000-0000-0000-000000000000";

  for (const account of DEMO_ACCOUNTS) {
    try {
      console.log(`\nProcessando login secundário para pegar sessão: ${account.email}`);
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: account.email,
        password: DEFAULT_PASSWORD
      });

      let userId = null;

      if (signInError) {
        console.log(`   Não conseguiu logar. Talvez precise confirmar o e-mail: ${signInError.message}`);
        // Tenta pegar o user do res do signup
        const { data: signUpData } = await supabase.auth.signUp({
          email: account.email,
          password: DEFAULT_PASSWORD,
          options: { data: { role: account.role, name: account.name } }
        });
        if (signUpData?.user) userId = signUpData.user.id;
      } else {
        userId = signInData.user.id;
      }

      if (!userId) {
        console.log(`   Impossível resgatar ID. Abortando public.users para esta conta.`);
        continue;
      }

      const modernProfile = {
        id: userId,
        name: account.name,
        email: account.email,
        role: account.role, 
        status: account.status,
        institution_id: fakeUuid
      };
      
      const { error: modError } = await supabase.from('users').upsert(modernProfile);
      if (modError) {
        console.log(`   ERRO no upsert public.users (modern): ${modError.message}`);
        
        // Tenta sem institution_id
        delete modernProfile.institution_id;
        const { error: finalError } = await supabase.from('users').upsert(modernProfile);
        if (finalError) console.log(`   ERRO final: ${finalError.message}`);
        else console.log(`   SUCESSO (Sem institution_id)! Role ${account.role} aplicado.`);
      } else {
         console.log(`   SUCESSO! Role ${account.role} aplicado.`);
      }

    } catch (e) {
      console.log(`   EXCEÇÃO: ${e.message}`);
    }
  }
}

createAccounts();
