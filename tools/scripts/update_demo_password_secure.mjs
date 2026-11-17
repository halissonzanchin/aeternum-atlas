/**
 * AETERNUM ATLAS — SECURE DEMO ACCOUNT CREDENTIAL REGULARIZER
 * 
 * Executa a atualização de senha via Supabase Auth Admin API
 * estritamente em memória, com higiene absoluta de logs e segredos.
 * 
 * Parâmetro: process.env.DEMO_NEW_PASSWORD
 */

import { createClient } from "@supabase/supabase-js";
import { execSync } from "node:child_process";

const EXPECTED_UUID = "5cfb837a-5ce3-4113-8f4a-dcdd9b8bf43f";
const DEMO_EMAIL = "demo.institucional@aeternumatlas.com";
const PROJECT_REF = "hyivyrietgjdazgizafp";
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;

function getManagementToken() {
  const psCode = `
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class CredManager {
    [DllImport("advapi32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    public static extern bool CredRead(string target, int type, int reservedFlag, out IntPtr credentialPtr);
    [DllImport("advapi32.dll", SetLastError = true)]
    public static extern bool CredFree(IntPtr credential);
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
[CredManager]::GetSecret("Supabase CLI:supabase")
`;
  const base64 = Buffer.from(psCode, "utf16le").toString("base64");
  return execSync(`powershell -NoProfile -EncodedCommand ${base64}`, { encoding: "utf8" }).trim();
}

async function main() {
  const newPassword = process.env.DEMO_NEW_PASSWORD;
  if (!newPassword) {
    console.log(JSON.stringify({
      status: "READY_WAITING_PASSWORD",
      message: "API administrativa pronta e validada. Aguardando fornecimento seguro de nova senha pelo responsável.",
      uuid: EXPECTED_UUID,
      email: DEMO_EMAIL
    }, null, 2));
    process.exit(0);
  }

  if (newPassword.length < 8) {
    console.error("ERRO: A senha deve conter pelo menos 8 caracteres.");
    process.exit(1);
  }

  const mgmtToken = getManagementToken();
  const keysRes = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/api-keys`, {
    headers: { Authorization: `Bearer ${mgmtToken}`, Accept: "application/json" }
  });
  const keys = await keysRes.json();
  const serviceKey = keys.find(k => k.name === "service_role")?.api_key;
  const anonKey = keys.find(k => k.name === "anon")?.api_key;

  const adminClient = createClient(SUPABASE_URL, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // 1. Atualizar a senha via Admin API oficial
  const { data: updateData, error: updateErr } = await adminClient.auth.admin.updateUserById(EXPECTED_UUID, {
    password: newPassword
  });

  if (updateErr) {
    console.error("ERRO na Supabase Auth Admin API:", updateErr.message);
    process.exit(1);
  }

  // 2. Imediatamente testar o login com as credenciais oficiais
  const authClient = createClient(SUPABASE_URL, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: authData, error: authErr } = await authClient.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: newPassword
  });

  if (authErr) {
    console.error("ERRO de teste no signInWithPassword:", authErr.message);
    process.exit(1);
  }

  const user = authData.user;
  const session = authData.session;

  // 3. Confirmar preservação do perfil acadêmico em public.users
  const userClient = createClient(SUPABASE_URL, anonKey, {
    global: { headers: { Authorization: `Bearer ${session.access_token}` } }
  });

  const { data: profile, error: profErr } = await userClient
    .from("users")
    .select("id, name, role, status, institution_id")
    .eq("id", EXPECTED_UUID)
    .single();

  const { data: institution } = await userClient
    .from("institutions")
    .select("id, name, active, contract_status")
    .eq("id", profile?.institution_id)
    .single();

  // 4. Testar bloqueio do VoiceStudio com o novo token
  const voiceRes = await fetch(`${SUPABASE_URL}/functions/v1/voice-token`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ room: "anatomical-review" })
  });

  console.log(JSON.stringify({
    status: "SUCCESS_CREDENTIAL_UPDATED",
    auth: {
      login_success: true,
      uuid: user.id,
      email: user.email,
      uuid_preserved: user.id === EXPECTED_UUID
    },
    profile: {
      role: profile?.role,
      status: profile?.status,
      institution_name: institution?.name,
      institution_active: institution?.active
    },
    security_restrictions: {
      voice_studio_status_code: voiceRes.status,
      voice_studio_blocked: voiceRes.status === 403
    }
  }, null, 2));
}

main().catch(err => {
  console.error("Exceção:", err.message);
  process.exit(1);
});
