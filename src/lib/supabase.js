import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://hyivyrietgjdazgizafp.supabase.co";
const DEFAULT_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.dummyKeyForClientInit";

const supabaseUrl = (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_ANON_KEY) || process.env.VITE_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;


let _isRecoveryEventFired = false;
let _recoveryUserId = null;

if (supabase) {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY") {
      _isRecoveryEventFired = true;
      _recoveryUserId = session?.user?.id || null;
    } else if (event === "SIGNED_OUT") {
      _isRecoveryEventFired = false;
      _recoveryUserId = null;
    }
  });
}

export function isPasswordRecoveryContextValid() {
  return _isRecoveryEventFired && Boolean(_recoveryUserId);
}

export function getRecoveryContextUserId() {
  return _recoveryUserId;
}

export function markRecoveryContextConsumed() {
  _isRecoveryEventFired = false;
  _recoveryUserId = null;
}
