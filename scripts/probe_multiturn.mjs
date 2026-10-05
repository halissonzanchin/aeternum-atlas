import { createClient } from "@supabase/supabase-js";

const STAGING_URL = "https://hutohshswppahipgcwio.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1dG9oc2hzd3BwYWhpcGdjd2lvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2Nzk0OTgsImV4cCI6MjEwNTI1NTQ5OH0.X7BWRYnF7BbWc8KqVezYzA6rvPxr0hw0Do6QnrLW5pQ";
const AI_TUTOR_URL = `${STAGING_URL}/functions/v1/ai-tutor`;
const ALLOWED_ORIGIN = "https://aeternum-atlas.vercel.app";

async function main() {
  const sb = createClient(STAGING_URL, ANON_KEY);
  const { data, error } = await sb.auth.signInWithPassword({
    email: "atlas-e2e-ai-tutor@staging.invalid",
    password: process.env.AETERNUM_STAGING_QA_PASSWORD
  });
  if (error) {
    console.error("Auth error:", error);
    process.exit(1);
  }
  const token = data.session.access_token;
  console.log("Logged in.");

  const payload = {
    prompt: "Quais bordas ela possui?",
    messages: [
      { role: "user", text: "O que é a escápula?", content: "O que é a escápula?" },
      { role: "assistant", text: "A escápula é um osso plano e triangular localizado na face posterolateral do tórax.", content: "A escápula é um osso plano e triangular localizado na face posterolateral do tórax." },
      { role: "user", text: "Quais bordas ela possui?", content: "Quais bordas ela possui?" }
    ]
  };

  const res = await fetch(AI_TUTOR_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": ANON_KEY,
      "Origin": ALLOWED_ORIGIN,
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  console.log("Status:", res.status);
  const json = await res.json();
  console.log("Response:", JSON.stringify(json, null, 2));
}

main().catch(console.error);
