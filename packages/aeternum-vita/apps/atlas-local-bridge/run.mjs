// Local Atlas Bridge entrypoint with dynamic credential loader and on-the-fly TypeScript support
import { registerHooks } from 'node:module';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import ts from 'typescript';

const sourceRoot = new URL('../../', import.meta.url).href;
registerHooks({
  load(url, context, nextLoad) {
    if (url.startsWith(sourceRoot) && url.endsWith('.ts')) {
      const result = ts.transpileModule(readFileSync(new URL(url), 'utf8'), {
        fileName: new URL(url).pathname,
        compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, verbatimModuleSyntax: false }
      });
      return { format: 'module', source: result.outputText, shortCircuit: true };
    }
    return nextLoad(url, context);
  }
});

const STAGING_REF = process.env.SUPABASE_PROJECT_REF || 'hutohshswppahipgcwio';
const supabaseUrl = process.env.SUPABASE_URL || `https://${STAGING_REF}.supabase.co`;

function getManagementToken() {
  if (process.env.SUPABASE_STAGING_ACCESS_TOKEN) return process.env.SUPABASE_STAGING_ACCESS_TOKEN;
  try {
    const regOut = execSync('reg query HKCU\\Environment /v SUPABASE_STAGING_ACCESS_TOKEN', { encoding: 'utf8' });
    for (const line of regOut.split(/\r?\n/)) {
      if (line.includes('SUPABASE_STAGING_ACCESS_TOKEN')) {
        const idx = line.indexOf('REG_SZ');
        if (idx !== -1) return line.slice(idx + 'REG_SZ'.length).trim();
      }
    }
  } catch {}
  return '';
}

let supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
let supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseAnonKey || !supabaseServiceRoleKey) {
  const pat = getManagementToken();
  if (pat) {
    try {
      const res = await fetch(`https://api.supabase.com/v1/projects/${STAGING_REF}/api-keys`, {
        headers: { Authorization: `Bearer ${pat}`, Accept: 'application/json' }
      });
      if (res.ok) {
        const keys = await res.json();
        const anon = keys.find(k => k.name === 'anon' || k.type === 'publishable');
        const service = keys.find(k => k.name === 'service_role' || k.type === 'secret');
        if (anon?.api_key) supabaseAnonKey = anon.api_key;
        if (service?.api_key) supabaseServiceRoleKey = service.api_key;
      }
    } catch (e) {
      console.warn('Failed to fetch api keys via management token:', e.message);
    }
  }
}

if (!supabaseAnonKey || !supabaseServiceRoleKey) {
  console.error('ERRO: Chaves anon/service_role do Supabase Staging não puderam ser carregadas.');
  process.exit(1);
}

const { LocalAtlasBridge } = await import('./src/index.ts');

const port = Number(process.env.LOCAL_BRIDGE_PORT) || 8082;
const host = process.env.LOCAL_BRIDGE_HOST || '127.0.0.1';
const gatewayUrl = process.env.LOCAL_GATEWAY_URL || 'http://127.0.0.1:8081';

const bridge = new LocalAtlasBridge({
  port,
  host,
  supabaseUrl,
  supabaseAnonKey,
  supabaseServiceRoleKey,
  gatewayUrl
});

await bridge.start();
