/**
 * Aeternum Atlas — Environment Bootstrap Runner
 * Fail-Closed Production-Protected Fresh Install Tool
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const FORBIDDEN_PRODUCTION_REF = 'hyivyrietgjdazgizafp';
const ALLOWED_TARGETS = {
  'hutohshswppahipgcwio': 'STAGING',
  'local': 'DEV_LOCAL'
};

const targetRef = process.env.SUPABASE_PROJECT_REF || process.argv[2];
const dbUrl = process.env.SUPABASE_DB_URL || process.argv[3];

console.log('=== AETERNUM ATLAS: ENVIRONMENT BOOTSTRAP ===');
console.log('Target Ref:', targetRef);

// GUARD 1: HARD BLOCK ON PRODUCTION
if (targetRef === FORBIDDEN_PRODUCTION_REF || (dbUrl && dbUrl.includes(FORBIDDEN_PRODUCTION_REF))) {
  console.error('\n[FATAL] TARGET IS PRODUCTION (hyivyrietgjdazgizafp)!');
  console.error('BASELINE_APPLICATION=BLOCKED');
  console.error('REASON=PRODUCTION_TARGET_FORBIDDEN');
  process.exit(1);
}

// GUARD 2: ALLOWLIST ONLY
if (!targetRef || !ALLOWED_TARGETS[targetRef]) {
  console.error('\n[FATAL] UNKNOWN TARGET REF:', targetRef);
  console.error('Only explicitly allowlisted environments may be bootstrapped.');
  console.error('Allowed:', Object.keys(ALLOWED_TARGETS).join(', '));
  process.exit(1);
}

console.log('Target Environment Validated:', ALLOWED_TARGETS[targetRef]);

if (!dbUrl) {
  console.error('[FATAL] Missing SUPABASE_DB_URL.');
  process.exit(1);
}

const baselinePath = path.resolve(__dirname, '../00000000000000_aeternum_canonical_baseline.sql');
if (!fs.existsSync(baselinePath)) {
  console.error('[FATAL] Baseline SQL not found at:', baselinePath);
  process.exit(1);
}

console.log('\n[1/3] Applying Canonical Baseline Snapshot in Single Transaction (ON_ERROR_STOP=1)...');
const applyRes = spawnSync('psql', [dbUrl, '-v', 'ON_ERROR_STOP=1', '-1', '-f', baselinePath], { encoding: 'utf8' });
if (applyRes.status !== 0) {
  console.error('[FAIL] Baseline apply failed:', applyRes.stderr);
  process.exit(1);
}
console.log('Baseline snapshot successfully applied.');

console.log('\n[2/3] Registering Cutover Version Marker in supabase_migrations.schema_migrations...');
const registerSql = "INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('20260918000000', 'aeternum_canonical_baseline_cutover') ON CONFLICT (version) DO NOTHING;";
const regRes = spawnSync('psql', [dbUrl, '-v', 'ON_ERROR_STOP=1', '-c', registerSql], { encoding: 'utf8' });
if (regRes.status !== 0) {
  console.error('[FAIL] Failed to register ledger cutover marker:', regRes.stderr);
  process.exit(1);
}
console.log('Ledger cutover marker registered: 20260918000000');

console.log('\n[3/3] Running Structural Verification...');
const verifyPath = path.resolve(__dirname, 'verify-canonical-schema.mjs');
const verifyRes = spawnSync('node', [verifyPath, targetRef, dbUrl], { stdio: 'inherit' });
if (verifyRes.status !== 0) {
  console.error('[FAIL] Schema verification failed.');
  process.exit(1);
}

console.log('\nBOOTSTRAP COMPLETE: Environment ' + ALLOWED_TARGETS[targetRef] + ' successfully provisioned.');
