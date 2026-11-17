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

async function queryRpc() {
  const token = getManagementToken();
  const res = await fetch("https://api.supabase.com/v1/projects/hyivyrietgjdazgizafp/database/query", {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "SELECT id, book_title, source_file, page_number, substring(content from 1 for 220) as snippet, metadata FROM public.vita_anatomical_knowledge WHERE content ILIKE '%aorta ascendente%' LIMIT 10;"
    })
  });
  const data = await res.json();
  console.log("Hits for aorta ascendente in Supabase vita_anatomical_knowledge:", data?.length);
  console.log(JSON.stringify(data, null, 2));
}

queryRpc().catch(console.error);
