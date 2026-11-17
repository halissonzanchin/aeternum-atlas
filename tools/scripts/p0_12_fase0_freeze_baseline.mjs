import fs from 'fs';
import { execSync } from 'child_process';
import { createClient } from '@supabase/supabase-js';

function getCredential(target) {
  const psCode = `
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class CredManager {
    [DllImport("Advapi32.dll", EntryPoint = "CredReadW", CharSet = CharSet.Unicode, SetLastError = true)]
    public static extern bool CredRead(string target, int type, int reservedFlag, out IntPtr credentialPtr);
    [DllImport("Advapi32.dll", EntryPoint = "CredFree", SetLastError = true)]
    public static extern void CredFree(IntPtr credentialPtr);
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct CREDENTIAL {
        public int Flags;
        public int Type;
        public string TargetName;
        public string Comment;
        public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
        public int CredentialBlobSize;
        public IntPtr CredentialBlob;
        public int Persist;
        public int AttributeCount;
        public IntPtr Attributes;
        public string TargetAlias;
        public string UserName;
    }
    public static string GetSecret(string target) {
        IntPtr credPtr;
        if (CredRead(target, 1, 0, out credPtr)) {
            try {
                CREDENTIAL cred = (CREDENTIAL)Marshal.PtrToStructure(credPtr, typeof(CREDENTIAL));
                if (cred.CredentialBlobSize > 0) {
                    byte[] blob = new byte[cred.CredentialBlobSize];
                    Marshal.Copy(cred.CredentialBlob, blob, 0, cred.CredentialBlobSize);
                    if (cred.CredentialBlobSize >= 2 && blob[1] == 0) return Encoding.Unicode.GetString(blob);
                    return Encoding.UTF8.GetString(blob);
                }
            } finally {
                CredFree(credPtr);
            }
        }
        return null;
    }
}
"@
[CredManager]::GetSecret("${target}")
`;
  const base64 = Buffer.from(psCode, "utf16le").toString("base64");
  const raw = execSync(`powershell -NoProfile -EncodedCommand ${base64}`, { encoding: "utf8" });
  const lines = raw.split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("#") && !l.startsWith("<"));
  return lines[lines.length - 1] || "";
}

async function main() {
  const projectRef = "hyivyrietgjdazgizafp";
  const supabaseUrl = `https://${projectRef}.supabase.co`;
  const mgmtToken = getCredential("Supabase CLI:supabase");

  console.log("1. Obtendo chaves administrativas do Supabase...");
  const kRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, {
    headers: { Authorization: `Bearer ${mgmtToken}` }
  });
  const keys = await kRes.json();
  const serviceKey = keys.find(k => k.name === "service_role" || k.tags === "service_role")?.api_key;
  const anonKey = keys.find(k => k.name === "anon" || k.tags === "anon")?.api_key;

  const sbAdmin = createClient(supabaseUrl, serviceKey);

  console.log("2. Capturando inventário de registros do Projeto Prometheus...");
  const tables = [
    'participants',
    'prosthesis_changes',
    'prosthesis_manufacturing_specs',
    'weekly_submissions',
    'submission_domain_scores'
  ];

  const inventory = {};
  for (const t of tables) {
    const { count, error } = await sbAdmin.from(t).select('*', { count: 'exact', head: true });
    inventory[t] = error ? `Erro: ${error.message}` : count;
    console.log(`   - public.${t}: ${inventory[t]} registros`);
  }

  console.log("\n3. Verificando versões publicadas das Edge Functions...");
  const fnRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/functions`, {
    headers: { Authorization: `Bearer ${mgmtToken}` }
  });
  const functions = await fnRes.json();
  const fnMap = {};
  if (Array.isArray(functions)) {
    functions.forEach(f => {
      fnMap[f.slug] = {
        id: f.id,
        version: f.version,
        status: f.status,
        updated_at: f.updated_at
      };
      console.log(`   - Function '${f.slug}': Versão ${f.version} (Status: ${f.status})`);
    });
  }

  console.log("\n4. Verificando estado atual das colunas em public.users...");
  const { data: demoUser, error: demoErr } = await sbAdmin
    .from('users')
    .select('*')
    .eq('email', 'demo.institucional@aeternumatlas.com')
    .maybeSingle();

  const baselineState = {
    timestamp: new Date().toISOString(),
    projectRef,
    git_main_head: execSync('git rev-parse origin/main', { encoding: 'utf8' }).trim(),
    git_candidate_head: execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(),
    prometheus_inventory: inventory,
    edge_functions: fnMap,
    demo_user_columns: demoUser ? Object.keys(demoUser) : [],
    demo_user_license_tier: demoUser?.license_tier || null,
    demo_user_session_guard_enabled: demoUser?.session_guard_enabled || null
  };

  fs.writeFileSync("tools/scripts/p0_12_baseline_freeze.json", JSON.stringify(baselineState, null, 2));
  console.log("\n[SUCESSO] Estado inicial de produção congelado em tools/scripts/p0_12_baseline_freeze.json");
}

main().catch(console.error);
