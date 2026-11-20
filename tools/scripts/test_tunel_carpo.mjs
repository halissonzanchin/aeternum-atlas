import { getMgmtToken } from "./supabase_admin_helper.mjs";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function testCarpo() {
  const token = await getMgmtToken();
  const sql = `
    SELECT id, book_title, page_number, substring(content from 1 for 250) as snippet
    FROM public.vita_anatomical_knowledge
    WHERE to_tsvector('public.pt_unaccent', coalesce(book_title, '') || ' ' || coalesce(content, '')) @@ websearch_to_tsquery('public.pt_unaccent', 'tunel do carpo')
    LIMIT 4;
  `;
  const res = await (await fetch("https://api.supabase.com/v1/projects/hyivyrietgjdazgizafp/database/query", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql })
  })).json();

  console.log("=== RESULTS FOR 'tunel do carpo' ===");
  console.log("Total found:", res.length);
  res.forEach(r => {
    console.log(`- ${r.book_title} (p. ${r.page_number})`);
    console.log(`  Snippet: ${r.snippet}...\n`);
  });
}

testCarpo();
