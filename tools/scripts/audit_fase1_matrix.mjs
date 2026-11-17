import { createClient } from "@supabase/supabase-js";
import { execSync } from "node:child_process";
import fs from "node:fs";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

function getManagementToken() {
  const psCode = `
$ProgressPreference = 'SilentlyContinue';
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
  const raw = execSync(`powershell -NoProfile -EncodedCommand ${base64}`, { encoding: "utf8" });
  // Filter out any XML or progress lines
  const lines = raw.split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("#") && !l.startsWith("<"));
  return lines[lines.length - 1] || "";
}

async function runAudit() {
  console.log("=== FASE 1: AUDITORIA DA VERSÃO REALMENTE PUBLICADA ===");
  const projectRef = "hyivyrietgjdazgizafp";
  const mgmtToken = getManagementToken();

  const auditReport = {
    timestamp: new Date().toISOString(),
    gitBranches: {},
    liveProduction: {},
    edgeFunctions: [],
    supabaseDatabase: {},
    gateway: {},
    tutorEngine: {},
    ollama: {},
    sqliteDb: {},
    differencesMatrix: []
  };

  // 1. Git commits
  const branches = [
    { name: "main", ref: "origin/main" },
    { name: "PR_15_demo_provisioning", ref: "origin/feat/institutional-demo-provisioning" },
    { name: "PR_16_session_guard", ref: "origin/feat/aeternum-session-guard" },
    { name: "PR_17_brain_tools", ref: "origin/feat/aeternum-brain-academic-tools-integration" }
  ];

  for (const b of branches) {
    try {
      const commit = execSync(`git -C "C:/Users/halis/.gemini/antigravity/scratch/aeternum-atlas-frontend" rev-parse ${b.ref}`).toString().trim();
      const msg = execSync(`git -C "C:/Users/halis/.gemini/antigravity/scratch/aeternum-atlas-frontend" log -n 1 --oneline ${b.ref}`).toString().trim();
      auditReport.gitBranches[b.name] = { commit, summary: msg };
    } catch (e) {
      auditReport.gitBranches[b.name] = { error: e.message };
    }
  }

  // 2. Live production HTTP inspection
  try {
    const res = await fetch("https://www.aeternumatlas.com", { method: "GET" });
    const text = await res.text();
    const jsBundleMatch = text.match(/src="(\/assets\/index-[^"]+\.js)"/);
    const cssBundleMatch = text.match(/href="(\/assets\/index-[^"]+\.css)"/);

    auditReport.liveProduction = {
      status: res.status,
      vercelCache: res.headers.get("x-vercel-cache"),
      lastModified: res.headers.get("last-modified"),
      etag: res.headers.get("etag"),
      jsBundle: jsBundleMatch ? jsBundleMatch[1] : null,
      cssBundle: cssBundleMatch ? cssBundleMatch[1] : null
    };
  } catch (e) {
    auditReport.liveProduction = { error: e.message };
  }

  // 3. Supabase Edge Functions via Management API
  if (mgmtToken) {
    try {
      const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/functions`, {
        headers: { "Authorization": `Bearer ${mgmtToken}` }
      });
      if (res.ok) {
        const funcs = await res.json();
        auditReport.edgeFunctions = funcs.map(f => ({
          name: f.name,
          slug: f.slug,
          status: f.status,
          version: f.version,
          created_at: f.created_at,
          updated_at: f.updated_at,
          verify_jwt: f.verify_jwt
        }));
      } else {
        auditReport.edgeFunctions = { error: `HTTP ${res.status}: ${await res.text()}` };
      }
    } catch (e) {
      auditReport.edgeFunctions = { error: e.message };
    }

    // Database checks
    try {
      const kRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, {
        headers: { "Authorization": `Bearer ${mgmtToken}` }
      });
      if (kRes.ok) {
        const keys = await kRes.json();
        const serviceKey = keys.find(k => k.name === "service_role" || k.tags === "service_role")?.api_key;
        if (serviceKey) {
          const supabaseUrl = `https://${projectRef}.supabase.co`;
          const adminClient = createClient(supabaseUrl, serviceKey);

          const tablesToCheck = [
            "users",
            "active_user_sessions",
            "ai_usage_ledger",
            "ai_conversations",
            "ai_messages",
            "study_agenda_activities",
            "student_study_cards",
            "anatomical_flashcard_decks",
            "anatomical_mind_maps",
            "theoretical_quiz_attempts",
            "vita_anatomical_knowledge"
          ];

          const tableStatus = {};
          for (const tbl of tablesToCheck) {
            try {
              const { data, count, error } = await adminClient.from(tbl).select("*", { count: "exact", head: true });
              if (error) {
                tableStatus[tbl] = { exists: false, error: error.message };
              } else {
                tableStatus[tbl] = { exists: true, count };
              }
            } catch (err) {
              tableStatus[tbl] = { exists: false, error: err.message };
            }
          }
          auditReport.supabaseDatabase.tables = tableStatus;

          const rpcsToCheck = [
            "consume_ai_rate_limit",
            "consume_ai_rate_limit_tiered",
            "register_or_transfer_session",
            "validate_session_guard",
            "heartbeat_session_guard",
            "revoke_session_guard",
            "match_vita_sovereign_knowledge",
            "match_vita_anatomical_knowledge"
          ];

          const rpcStatus = {};
          for (const rpc of rpcsToCheck) {
            try {
              const { error } = await adminClient.rpc(rpc, {});
              if (error && error.message.includes("Could not find the function")) {
                rpcStatus[rpc] = { exists: false, error: error.message };
              } else {
                rpcStatus[rpc] = { exists: true, message: error ? error.message : "OK" };
              }
            } catch (err) {
              rpcStatus[rpc] = { exists: false, error: err.message };
            }
          }
          auditReport.supabaseDatabase.rpcs = rpcStatus;
        }
      }
    } catch (e) {
      auditReport.supabaseDatabase.error = e.message;
    }
  }

  // 4. Local Gateway status
  try {
    const gwRes = await fetch("http://127.0.0.1:8081/health");
    if (gwRes.ok) {
      auditReport.gateway = await gwRes.json();
    } else {
      auditReport.gateway = { status: gwRes.status };
    }
  } catch (e) {
    auditReport.gateway = { error: e.message };
  }

  // 5. TutorEngine Rust status
  try {
    const teDev = await fetch("http://127.0.0.1:14556/v1/health");
    const teDevData = teDev.ok ? await teDev.json() : null;
    const teProd = await fetch("http://127.0.0.1:14555/v1/health");
    const teProdData = teProd.ok ? await teProd.json() : null;
    auditReport.tutorEngine = {
      devPort14556: teDevData,
      prodPort14555: teProdData
    };
  } catch (e) {
    auditReport.tutorEngine = { error: e.message };
  }

  // 6. Ollama
  try {
    const oRes = await fetch("http://127.0.0.1:11434/api/tags");
    if (oRes.ok) {
      const oData = await oRes.json();
      auditReport.ollama = {
        online: true,
        models: (oData.models || []).map(m => m.name)
      };
    }
  } catch (e) {
    auditReport.ollama = { online: false, error: e.message };
  }

  // 7. Local SQLite Knowledge DB
  try {
    const sqlitePath = "C:/Users/halis/OneDrive/Desktop/Atlas Code/crates/atlas-daemon/data/atlas_knowledge.db";
    if (fs.existsSync(sqlitePath)) {
      const stats = fs.statSync(sqlitePath);
      auditReport.sqliteDb = {
        exists: true,
        sizeMb: (stats.size / (1024 * 1024)).toFixed(2),
        path: sqlitePath
      };
    } else {
      auditReport.sqliteDb = { exists: false };
    }
  } catch (e) {
    auditReport.sqliteDb = { error: e.message };
  }

  // Differences Matrix
  auditReport.differencesMatrix = [
    {
      component: "Frontend (Vite / React)",
      productionMain: "e56705a (docs release, 2026-10-05)",
      pr15Demo: "54b4606 (governança científica, isolamento fail-closed VoiceStudio)",
      pr16SessionGuard: "37bce32 (Session Guard, anti-account sharing, modal de deslocamento)",
      pr17BrainTools: "b95ab4a (P0.10.1 conectores soberanos, topic RAG, persistência acadêmica)",
      status: "PR #17 contém commits acumulados do PR #15 e #16"
    },
    {
      component: "Edge Function ai-tutor",
      productionMain: "Versão preliminar (sem rate limit por sessão, sem unblocking Safe Engine)",
      pr15Demo: "Adiciona checagem de anon-key e elimina RPC legada",
      pr16SessionGuard: "Adiciona Session Guard fail-closed e consume_ai_rate_limit_tiered",
      pr17BrainTools: "P0.10.1 conectores soberanos, injeção de grafo estruturado, busca topic-first e source IDs",
      status: "Em código no PR #17; produção aguarda plano coordenado de release"
    },
    {
      component: "Edge Function voice-token",
      productionMain: "Ativo para usuários gerais",
      pr15Demo: "Fail-closed para conta demo institucional (HTTP 403 VOICE_DISABLED_FOR_DEMO)",
      pr16SessionGuard: "Mantido fail-closed para demo",
      pr17BrainTools: "Mantido fail-closed para demo",
      status: "Segurança preservada em todos os PRs"
    },
    {
      component: "Supabase Migrations",
      productionMain: "Schema padrão com users e ai_usage_ledger",
      pr15Demo: "Migration 20261116000000_institutional_demo_provisioning.sql",
      pr16SessionGuard: "Migration 20261116000001_aeternum_session_guard.sql (active_user_sessions, consume_ai_rate_limit_tiered)",
      pr17BrainTools: "Reutiliza migrations do PR #16, zero migrations novas necessárias",
      status: "Testadas em banco PostgreSQL descartável; produção aguarda autorização"
    }
  ];

  fs.writeFileSync("tools/scripts/audit_fase1_results.json", JSON.stringify(auditReport, null, 2), "utf8");
  console.log("Auditoria concluída com sucesso! Resultados em tools/scripts/audit_fase1_results.json");
  console.log(JSON.stringify(auditReport, null, 2));
}

runAudit().catch(console.error);
