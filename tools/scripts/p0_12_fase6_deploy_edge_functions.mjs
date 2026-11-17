import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { getMgmtToken, runSupabaseSql } from './supabase_admin_helper.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../');
const PROJECT_REF = 'hyivyrietgjdazgizafp';

console.log("================================================================================");
console.log(" AETERNUM ATLAS — P0.12: FASE 6 — IMPLANTAÇÃO OFICIAL DAS EDGE FUNCTIONS       ");
console.log("================================================================================\n");

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
  const token = getMgmtToken();
  const demoPassword = getCredential("AeternumAtlas:DemoAccount");

  // ---------------------------------------------------------------------------
  // 1. DEPLOY VOICE-TOKEN
  // ---------------------------------------------------------------------------
  console.log("1. Preparando deploy de 'voice-token'...");
  const voiceTokenPath = path.join(REPO_ROOT, 'supabase/functions/voice-token/index.ts');
  const voiceCode = fs.readFileSync(voiceTokenPath);

  const voiceForm = new FormData();
  voiceForm.append('metadata', JSON.stringify({
    entrypoint_path: 'index.ts',
    name: 'voice-token',
    verify_jwt: false
  }));
  voiceForm.append('file', new Blob([voiceCode], { type: 'application/typescript' }), 'index.ts');

  console.log("   Enviando deploy de 'voice-token' para o Supabase Management API...");
  const voiceRes = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/functions/deploy?slug=voice-token`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: voiceForm
  });

  if (!voiceRes.ok) {
    const errText = await voiceRes.text();
    throw new Error(`Falha no deploy de voice-token (HTTP ${voiceRes.status}): ${errText}`);
  }
  const voiceData = await voiceRes.json();
  console.log(`   [SUCESSO] 'voice-token' implantado com sucesso! Versão: ${voiceData.version}, Status: ${voiceData.status}`);

  // ---------------------------------------------------------------------------
  // 2. BUNDLE & DEPLOY AI-TUTOR
  // ---------------------------------------------------------------------------
  console.log("\n2. Compilando bundle canônico de 'ai-tutor' via esbuild...");
  const aiTutorEntry = path.join(REPO_ROOT, 'supabase/functions/ai-tutor/index.ts');
  const aiTutorDist = path.join(REPO_ROOT, 'supabase/functions/ai-tutor/dist.js');

  execSync(`npx esbuild "${aiTutorEntry}" --bundle --format=esm --platform=neutral --target=esnext "--external:npm:*" --outfile="${aiTutorDist}"`, {
    cwd: REPO_ROOT,
    encoding: 'utf8'
  });
  const distStat = fs.statSync(aiTutorDist);
  console.log(`   Bundle gerado: ${aiTutorDist} (${distStat.size} bytes)`);

  const aiCode = fs.readFileSync(aiTutorDist);
  const aiForm = new FormData();
  aiForm.append('metadata', JSON.stringify({
    entrypoint_path: 'index.ts',
    name: 'ai-tutor',
    verify_jwt: false
  }));
  aiForm.append('file', new Blob([aiCode], { type: 'application/javascript' }), 'index.ts');

  console.log("   Enviando deploy de 'ai-tutor' para o Supabase Management API...");
  const aiRes = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/functions/deploy?slug=ai-tutor`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: aiForm
  });

  if (!aiRes.ok) {
    const errText = await aiRes.text();
    throw new Error(`Falha no deploy de ai-tutor (HTTP ${aiRes.status}): ${errText}`);
  }
  const aiData = await aiRes.json();
  console.log(`   [SUCESSO] 'ai-tutor' implantado com sucesso! Versão: ${aiData.version}, Status: ${aiData.status}`);

  // ---------------------------------------------------------------------------
  // 3. SMOKE TEST DAS EDGE FUNCTIONS EM PRODUÇÃO
  // ---------------------------------------------------------------------------
  console.log("\n3. Executando Smoke Tests de ponta a ponta nas Edge Functions publicadas...");
  const functionsBaseUrl = `https://${PROJECT_REF}.supabase.co/functions/v1`;

  // Test 3.1: CORS Preflight em ai-tutor
  console.log("   3.1. Validando preflight OPTIONS em ai-tutor...");
  const optRes = await fetch(`${functionsBaseUrl}/ai-tutor`, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://www.aeternumatlas.com',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'authorization, content-type, apikey'
    }
  });
  console.log(`        Status OPTIONS: ${optRes.status}, Allow-Origin: ${optRes.headers.get('access-control-allow-origin')}`);
  if (optRes.status !== 200 && optRes.status !== 204) {
    throw new Error(`OPTIONS ai-tutor falhou com status ${optRes.status}`);
  }

  // Test 3.2: Rejeição de requisição não autenticada em ai-tutor (Fail-Closed)
  console.log("   3.2. Validando fail-closed sem autenticação em ai-tutor...");
  const anonRes = await fetch(`${functionsBaseUrl}/ai-tutor`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://www.aeternumatlas.com'
    },
    body: JSON.stringify({ query: 'teste' })
  });
  console.log(`        Status anônimo: ${anonRes.status}`);
  if (anonRes.status !== 401) {
    throw new Error(`ai-tutor não rejeitou chamada anônima com 401 (status: ${anonRes.status})`);
  }
  console.log("        [CORRETO] 401 Unauthorized retornado.");

  // Test 3.3: Rejeição de requisição não autenticada em voice-token
  console.log("   3.3. Validando fail-closed sem autenticação em voice-token...");
  const voiceAnonRes = await fetch(`${functionsBaseUrl}/voice-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://www.aeternumatlas.com'
    },
    body: JSON.stringify({ tutorId: 'eduardo' })
  });
  console.log(`        Status anônimo voice-token: ${voiceAnonRes.status}`);
  if (voiceAnonRes.status !== 401) {
    throw new Error(`voice-token não rejeitou chamada anônima com 401 (status: ${voiceAnonRes.status})`);
  }
  console.log("        [CORRETO] 401 Unauthorized retornado.");

  // Test 3.4: Autenticação real com Aluno Demo e chamada ao ai-tutor
  console.log("\n4. Obtendo token de Aluno Demo institucional para validação da inferência...");
  const kRes = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/api-keys`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const keys = await kRes.json();
  const anonKey = keys.find(k => k.name === "anon" || k.tags === "anon")?.api_key;

  const authRes = await fetch(`https://${PROJECT_REF}.supabase.co/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'apikey': anonKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'demo.institucional@aeternumatlas.com',
      password: demoPassword
    })
  });
  
  if (!authRes.ok) {
    const authErr = await authRes.text();
    throw new Error(`Falha no login do demo institucional: ${authErr}`);
  }
  const authData = await authRes.json();
  const studentJwt = authData.access_token;
  console.log("   [AUTENTICADO] Token de sessão obtido para o Aluno Demo.");

  // Extrair session_id do JWT e registrar a sessão ativa conforme Session Guard
  const jwtParts = studentJwt.split('.');
  const jwtPayload = JSON.parse(Buffer.from(jwtParts[1], 'base64').toString('utf8'));
  const sessionId = jwtPayload.session_id;
  console.log(`   [SESSION GUARD] Registrando sessão ativa no banco (session_id: ${sessionId})...`);

  const regRes = await fetch(`https://${PROJECT_REF}.supabase.co/rest/v1/rpc/register_or_transfer_session`, {
    method: 'POST',
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${studentJwt}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      p_session_id: sessionId,
      p_device_fingerprint: 'smoke-test-device-p0-12',
      p_ip: null,
      p_confirm_transfer: true,
      p_metadata: { client: 'smoke-test-p0-12' }
    })
  });

  const regData = await regRes.json();
  console.log("   [SESSION GUARD] Resposta do registro de sessão:", regData);

  console.log("   4.1. Testando chamada ao ai-tutor com pergunta anatômica real...");
  const tutorReqStart = Date.now();
  const tutorRes = await fetch(`${functionsBaseUrl}/ai-tutor`, {
    method: 'POST',
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${studentJwt}`,
      'Content-Type': 'application/json',
      'Origin': 'https://www.aeternumatlas.com'
    },
    body: JSON.stringify({
      messages: [{ sender: "user", text: "Descreva a origem, relações anatômicas e ramos da artéria aorta ascendente." }],
      context: {
        task: "research",
        topic: "Artéria aorta ascendente",
        language: "pt",
        userRole: "student"
      },
      language: "pt",
      stream: false
    })
  });

  const tutorLatency = Date.now() - tutorReqStart;
  console.log(`        Status ai-tutor autenticado: ${tutorRes.status} (${tutorLatency}ms)`);
  const tutorData = await tutorRes.json();
  console.log("        Resposta do Tutor Soberano:", {
    status: tutorRes.status,
    provider: tutorData.provider || tutorData.source || 'aeternum-gateway',
    model: tutorData.model || 'aeternum-llm',
    hasText: Boolean(tutorData.text || tutorData.content || tutorData.message),
    textSnippet: String(tutorData.text || tutorData.content || tutorData.message || '').slice(0, 160) + '...'
  });

  if (tutorRes.status !== 200) {
    throw new Error(`Falha na resposta do ai-tutor autenticado: HTTP ${tutorRes.status} - ${JSON.stringify(tutorData)}`);
  }

  // Test 4.2: Testando voice-token com aluno demo (deve barrar por política de licença demo)
  console.log("\n   4.2. Testando contenção de VoiceStudio para conta demo (fail-closed)...");
  const voiceAuthRes = await fetch(`${functionsBaseUrl}/voice-token`, {
    method: 'POST',
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${studentJwt}`,
      'Content-Type': 'application/json',
      'Origin': 'https://www.aeternumatlas.com'
    },
    body: JSON.stringify({ tutorId: 'eduardo' })
  });
  console.log(`        Status voice-token conta demo: ${voiceAuthRes.status}`);
  const voiceDataRes = await voiceAuthRes.json();
  console.log("        Resposta da política de voz:", voiceDataRes);
  if (voiceAuthRes.status !== 403 && voiceAuthRes.status !== 400) {
    throw new Error(`Conta demo não foi bloqueada no VoiceStudio! Status: ${voiceAuthRes.status}`);
  }
  console.log("        [CONTEÚDO PROTEGIDO] Aluno demo corretamente bloqueado no VoiceStudio conforme especificação P0.9/P0.11.");

  console.log("\n================================================================================");
  console.log(" FASE 6 CONCLUÍDA COM SUCESSO ABSOLUTO: GATE EDGE FUNCTIONS APROVADO (GO)!      ");
  console.log("================================================================================");
}

main().catch(err => {
  console.error("ERRO FATAL na implantação das Edge Functions:", err);
  process.exit(1);
});
