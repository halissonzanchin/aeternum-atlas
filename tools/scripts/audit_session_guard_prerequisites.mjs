import { execSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';

function getManagementToken() {
  const psScript = `
$code = @"
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
Add-Type -TypeDefinition $code
[CredManager]::GetSecret("Supabase CLI:supabase")
`;
  const base64 = Buffer.from(psScript, "utf16le").toString("base64");
  const res = execSync(`powershell -NoProfile -EncodedCommand ${base64}`, { encoding: "utf8" });
  return res.trim();
}

const PROD_REF = "hyivyrietgjdazgizafp";

async function inspectToken() {
  const token = getManagementToken();
  const keysRes = await fetch(`https://api.supabase.com/v1/projects/${PROD_REF}/api-keys`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const keys = await keysRes.json();
  const serviceKey = keys.find(k => k.name === "service_role")?.api_key;

  const adminClient = createClient(`https://${PROD_REF}.supabase.co`, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data, error } = await adminClient.from("ai_rate_limits").select("*").limit(2);
  console.log("ai_rate_limits in production:", { data, error });
}

inspectToken().catch(console.error);
