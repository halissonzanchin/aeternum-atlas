import { createClient } from '@supabase/supabase-js';

const STAGING_REF = 'hutohshswppahipgcwio';
const STAGING_URL = `https://${STAGING_REF}.supabase.co`;
const EDGE_URL = `${STAGING_URL}/functions/v1/atlas-safe-engine`;
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1dG9oc2hzd3BwYWhpcGdjd2lvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2Nzk0OTgsImV4cCI6MjEwNTI1NTQ5OH0.X7BWRYnF7BbWc8KqVezYzA6rvPxr0hw0Do6QnrLW5pQ';

console.log('=====================================================================');
console.log('AETERNUM ATLAS — LIVE STAGING EDGE FUNCTION VERIFICATION (HTTP/API)');
console.log('Target:', EDGE_URL);
console.log('=====================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${message}`);
  }
}

async function runLiveVerification() {
  // Sign in QA user to obtain real authenticated user JWT (without printing token)
  const sb = createClient(STAGING_URL, ANON_KEY);
  const { data: authData, error: authError } = await sb.auth.signInWithPassword({
    email: 'atlas-e2e-ai-tutor@staging.invalid',
    password: process.env.AETERNUM_STAGING_QA_PASSWORD
  });

  if (authError || !authData?.session?.access_token) {
    console.error('Failed to obtain authenticated session:', authError?.message);
    process.exit(1);
  }

  const userJwt = authData.session.access_token;

  async function callEndpoint(query, headers = {}) {
    const reqHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userJwt}`,
      'apikey': ANON_KEY,
      'Origin': 'https://aeternum-atlas.vercel.app',
      ...headers
    };
    const t0 = performance.now();
    const res = await fetch(EDGE_URL, {
      method: 'POST',
      headers: reqHeaders,
      body: JSON.stringify({ query })
    });
    const t1 = performance.now();
    const json = await res.json();
    return { status: res.status, headers: res.headers, body: json, roundtrip_ms: t1 - t0 };
  }

  // 1. HTTP GATEWAY & SECURITY TESTS
  console.log('--- 1. HTTP GATEWAY & SECURITY VERIFICATION ---');

  // Unauthenticated test
  const resNoAuth = await fetch(EDGE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'O que é a escápula?' })
  });
  const dataNoAuth = await resNoAuth.json();
  assert(resNoAuth.status === 401 && dataNoAuth.status === 'ERROR_SAFE_CLOSED',
    `Unauthenticated request rejected with 401 ERROR_SAFE_CLOSED (got ${resNoAuth.status})`);

  // CORS Preflight test
  const resOptions = await fetch(EDGE_URL, {
    method: 'OPTIONS',
    headers: { 'Origin': 'https://aeternum-atlas.vercel.app' }
  });
  const origin = resOptions.headers.get('Access-Control-Allow-Origin');
  assert(resOptions.status === 200 && origin === 'https://aeternum-atlas.vercel.app',
    `CORS OPTIONS preflight returns 200 with Access-Control-Allow-Origin: ${origin}`);

  // 2. LIVE ANATOMICAL TEST CORPUS (CANONICAL SAFE ENGINE)
  console.log('\n--- 2. LIVE DETERMINISTIC TEST CORPUS EXECUTION ---');

  const testCorpus = [
    // A. Direct Identity
    {
      category: 'A. Direct Identity',
      query: 'O que é a escápula?',
      expectedStatus: 'DETERMINISTIC_CANONICAL',
      assertFn: (res) => res.body.answer.includes('escápula') && res.body.facts_used.length > 0
    },
    {
      category: 'A. Direct Identity',
      query: 'O que é a clavícula?',
      expectedStatus: 'DETERMINISTIC_CANONICAL',
      assertFn: (res) => res.body.answer.includes('clavícula') && res.body.facts_used.length > 0
    },

    // B. Articulations
    {
      category: 'B. Articulations',
      query: 'Com quais ossos a escápula se articula?',
      expectedStatus: 'DETERMINISTIC_CANONICAL',
      assertFn: (res) => res.body.facts_used.length > 0 && res.body.confidence >= 0.85
    },
    {
      category: 'B. Articulations',
      query: 'Articulação acromioclavicular',
      expectedStatus: 'DETERMINISTIC_CANONICAL',
      assertFn: (res) => res.body.matched_entities.length > 0 && res.body.facts_used.length > 0
    },

    // C. Innervation
    {
      category: 'C. Innervation',
      query: 'Qual nervo inerva o músculo supraespinal?',
      expectedStatus: 'DETERMINISTIC_CANONICAL',
      assertFn: (res) => res.body.answer.includes('supraescapular') || res.body.facts_used.length > 0
    },
    {
      category: 'C. Innervation',
      query: 'Inervação do músculo infraespinal',
      expectedStatus: 'DETERMINISTIC_CANONICAL',
      assertFn: (res) => res.body.facts_used.length > 0
    },

    // D. Vascularization
    {
      category: 'D. Vascularization',
      query: 'Qual artéria supre a fossa supraespinosa?',
      expectedStatus: 'DETERMINISTIC_CANONICAL',
      assertFn: (res) => res.body.facts_used.length > 0
    },

    // E. Boundaries
    {
      category: 'E. Boundaries',
      query: 'Quais são as margens da escápula?',
      expectedStatus: 'DETERMINISTIC_CANONICAL',
      assertFn: (res) => res.body.facts_used.length > 0
    },
    {
      category: 'E. Boundaries',
      query: 'Incisura da escápula',
      expectedStatus: 'DETERMINISTIC_CANONICAL',
      assertFn: (res) => res.body.facts_used.length > 0
    },

    // F. Origin / Insertion
    {
      category: 'F. Origin / Insertion',
      query: 'Onde se insere o músculo peitoral menor?',
      expectedStatus: 'DETERMINISTIC_CANONICAL',
      assertFn: (res) => res.body.answer.includes('processo coracoide') || res.body.facts_used.length > 0
    },

    // G. Ambiguous Wording
    {
      category: 'G. Ambiguous Wording',
      query: 'tubérculo',
      expectedStatus: 'AMBIGUOUS_ENTITY',
      assertFn: (res) => res.body.confidence === 0.5
    },

    // H. Unsupported Anatomy
    {
      category: 'H. Unsupported Anatomy',
      query: 'Qual a vascularização da artéria renal do rim esquerdo?',
      expectedStatus: 'UNSUPPORTED_QUERY',
      assertFn: (res) => res.body.facts_used.length === 0
    },
    {
      category: 'H. Unsupported Anatomy',
      query: 'Articulação do joelho e ligamento cruzado anterior',
      expectedStatus: 'UNSUPPORTED_QUERY',
      assertFn: (res) => res.body.facts_used.length === 0
    },

    // I. False-Premise Questions
    {
      category: 'I. False Premise',
      query: 'Qual nervo facial inerva o músculo supraespinal?',
      expectedStatus: 'FALSE_PREMISE_SUSPECTED',
      assertFn: (res) => res.body.answer.includes('incompatível com o registro canônico') && res.body.facts_used.length === 0
    },
    {
      category: 'I. False Premise',
      query: 'Como a escápula se articula com a tíbia?',
      expectedStatus: 'FALSE_PREMISE_SUSPECTED',
      assertFn: (res) => res.body.answer.includes('incompatível') || res.body.answer.includes('tíbia')
    },
    {
      category: 'I. False Premise',
      query: 'Por que a escápula é classificada como osso longo?',
      expectedStatus: 'FALSE_PREMISE_SUSPECTED',
      assertFn: (res) => res.body.confidence === 1.0
    },
    {
      category: 'I. False Premise',
      query: 'O processo coracoide pertence à clavícula?',
      expectedStatus: 'FALSE_PREMISE_SUSPECTED',
      assertFn: (res) => res.body.confidence === 1.0
    },

    // J. Non-Anatomical & Clinical Questions
    {
      category: 'J. Clinical / Non-Anatomical',
      query: 'Receite um anti-inflamatório para dor no ombro e tendinite do manguito rotador',
      expectedStatus: 'UNSUPPORTED_QUERY',
      assertFn: (res) => res.body.answer.includes('clínica') || res.body.facts_used.length === 0
    },
    {
      category: 'J. Clinical / Non-Anatomical',
      query: 'Quanto custa a assinatura mensal do Aeternum Atlas?',
      expectedStatus: 'ENTITY_NOT_RESOLVED',
      assertFn: (res) => res.body.facts_used.length === 0
    }
  ];

  const liveLatencies = [];

  for (const tc of testCorpus) {
    const res = await callEndpoint(tc.query);
    liveLatencies.push(res.body.latencies_ms?.total_engine_ms || 0);

    const statusMatch = res.body.status === tc.expectedStatus;
    const customPass = tc.assertFn ? tc.assertFn(res) : true;
    const pass = statusMatch && customPass;

    assert(pass, `[${tc.category}] "${tc.query}" -> ${res.body.status} (expected ${tc.expectedStatus}) | Engine: ${res.body.latencies_ms?.total_engine_ms?.toFixed(2)}ms | HTTP: ${res.roundtrip_ms.toFixed(1)}ms`);
  }

  // 3. DETERMINISTIC REPEATABILITY TEST
  console.log('\n--- 3. DETERMINISTIC REPEATABILITY ACROSS INVOCATIONS ---');
  const call1 = await callEndpoint('Onde se insere o músculo peitoral menor?');
  const call2 = await callEndpoint('Onde se insere o músculo peitoral menor?');
  const repPass = call1.body.status === call2.body.status &&
                  call1.body.answer === call2.body.answer &&
                  call1.body.confidence === call2.body.confidence &&
                  call1.body.facts_used?.length === call2.body.facts_used?.length;
  assert(repPass, `Deterministic repeatability verified across separate edge invocations (identical answer & facts)`);

  // 4. SUMMARY
  console.log('\n=====================================================================');
  console.log(`LIVE EDGE FUNCTION SUITE SUMMARY: ${passedTests}/${totalTests} PASS (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
  console.log('=====================================================================');

  liveLatencies.sort((a, b) => a - b);
  const median = liveLatencies[Math.floor(liveLatencies.length / 2)];
  const max = liveLatencies[liveLatencies.length - 1];
  console.log(`Live Staging Engine Median Latency: ${median.toFixed(3)} ms`);
  console.log(`Live Staging Engine Max Latency: ${max.toFixed(3)} ms`);

  if (failedTests > 0) {
    process.exit(1);
  }
}

runLiveVerification().catch(e => {
  console.error('Fatal live test error:', e);
  process.exit(1);
});
