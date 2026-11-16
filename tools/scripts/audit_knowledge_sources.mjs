import { execSync } from "node:child_process";

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

async function runQuery(query) {
  const token = getManagementToken();
  const res = await fetch("https://api.supabase.com/v1/projects/hyivyrietgjdazgizafp/database/query", {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify({ query })
  });
  return await res.json();
}

async function main() {
  console.log("=== 1. ALL TABLES IN PUBLIC SCHEMA ===");
  const tables = await runQuery("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;");
  console.table(tables);

  console.log("\n=== 2. SEARCH FOR KNOWLEDGE / SOURCE / EMBEDDING TABLES ===");
  const knowledgeTables = tables.filter(t => /knowledge|source|embedding|passage|doc/i.test(t.table_name));
  console.log("Found:", knowledgeTables);

  for (const t of knowledgeTables) {
    const tName = t.table_name;
    console.log(`\n--- Inspecting ${tName} ---`);
    const count = await runQuery(`SELECT count(*) FROM public.${tName};`);
    console.log(`Row count:`, count);
    const sample = await runQuery(`SELECT * FROM public.${tName} LIMIT 3;`);
    console.log(`Sample:`, JSON.stringify(sample, null, 2));
  }

  console.log("\n=== 3. SEARCHING FOR 'MOORE' ACROSS ALL TEXT COLUMNS IN KNOWLEDGE TABLES ===");
  for (const t of knowledgeTables) {
    const tName = t.table_name;
    try {
      const mooreRows = await runQuery(`SELECT * FROM public.${tName} WHERE CAST(${tName} AS TEXT) ILIKE '%moore%' LIMIT 5;`);
      console.log(`Hits for 'moore' in ${tName}:`, mooreRows?.length);
      if (mooreRows?.length > 0) {
        console.log(JSON.stringify(mooreRows, null, 2));
      }
    } catch (err) {
      console.log(`Could not search in ${tName}:`, err.message);
    }
  }

  console.log("\n=== 4. INSPECTING AI_CONVERSATIONS AND AI_MESSAGES ===");
  const convCount = await runQuery("SELECT count(*) FROM public.ai_conversations;");
  const msgCount = await runQuery("SELECT count(*) FROM public.ai_messages;");
  console.log("ai_conversations count:", convCount);
  console.log("ai_messages count:", msgCount);
  const sampleConv = await runQuery("SELECT * FROM public.ai_conversations ORDER BY created_at DESC LIMIT 3;");
  console.log("Latest conversations:", JSON.stringify(sampleConv, null, 2));

  console.log("\n=== 5. RLS POLICIES FOR AI_CONVERSATIONS AND AI_MESSAGES ===");
  const policies = await runQuery("SELECT tablename, policyname, permissive, roles, cmd, qual, with_check FROM pg_policies WHERE tablename IN ('ai_conversations', 'ai_messages');");
  console.table(policies);
}

main().catch(console.error);
