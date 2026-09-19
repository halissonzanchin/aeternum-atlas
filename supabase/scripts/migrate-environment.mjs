/**
 * Aeternum Atlas — Safe Forward Migration Runner
 */
import { spawnSync } from 'child_process';
import path from 'path';

const FORBIDDEN_PRODUCTION_REF = 'hyivyrietgjdazgizafp';
const targetRef = process.env.SUPABASE_PROJECT_REF || process.argv[2];
const dbUrl = process.env.SUPABASE_DB_URL || process.argv[3];

console.log('=== AETERNUM ATLAS: FORWARD MIGRATION RUNNER ===');

// Guard against untracked operations
if (!targetRef) {
  console.error('[FATAL] Target project_ref required.');
  process.exit(1);
}

if (!dbUrl) {
  console.error('[FATAL] Target database URL required.');
  process.exit(1);
}

console.log('Target:', targetRef);

// Execute forward db push with strict dry-run check
console.log('Running dry-run validation...');
const dryRes = spawnSync('npx', ['supabase', 'db', 'push', '--dry-run', '--db-url', dbUrl], { stdio: 'inherit', shell: true });
if (dryRes.status !== 0) {
  console.error('[FATAL] Migration dry-run failed. Aborting.');
  process.exit(1);
}

console.log('Dry-run passed. Executing forward migrations...');
const pushRes = spawnSync('npx', ['supabase', 'db', 'push', '--db-url', dbUrl], { stdio: 'inherit', shell: true });
if (pushRes.status !== 0) {
  console.error('[FATAL] Migration execution failed.');
  process.exit(1);
}

console.log('Forward migrations completed successfully.');
