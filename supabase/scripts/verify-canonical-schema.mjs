/**
 * Aeternum Atlas — Canonical Schema Structural Verifier
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const targetRef = process.argv[2];
const dbUrl = process.argv[3];

function query(sql) {
  const res = spawnSync('psql', [dbUrl, '-v', 'ON_ERROR_STOP=1', '-t', '-A', '-c', sql], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error('Query error: ' + res.stderr);
  }
  return res.stdout.trim();
}

console.log('--- Verifying Schema Structural Parity ---');

const tableCount = parseInt(query("SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';"), 10);
const funcCount = parseInt(query("SELECT count(*) FROM information_schema.routines WHERE routine_schema='public';"), 10);
const triggerCount = parseInt(query("SELECT count(*) FROM information_schema.triggers WHERE trigger_schema='public';"), 10);
const policyCount = parseInt(query("SELECT count(*) FROM pg_policies WHERE schemaname='public';"), 10);
const indexCount = parseInt(query("SELECT count(*) FROM pg_indexes WHERE schemaname='public';"), 10);

const fkMismatchQuery = `
  SELECT count(*)
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
  JOIN information_schema.columns c1
    ON c1.table_schema = tc.table_schema AND c1.table_name = tc.table_name AND c1.column_name = kcu.column_name
  JOIN information_schema.columns c2
    ON c2.table_schema = ccu.table_schema AND c2.table_name = ccu.table_name AND c2.column_name = ccu.column_name
  WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    AND c1.data_type != c2.data_type;
`;
const fkMismatches = parseInt(query(fkMismatchQuery), 10);

console.log('Tables:', tableCount, '(Expected: 46)');
console.log('Functions:', funcCount, '(Expected: 15)');
console.log('Triggers:', triggerCount, '(Expected: 8)');
console.log('Policies:', policyCount, '(Expected: 37)');
console.log('Indexes:', indexCount, '(Expected: 79)');
console.log('FK Type Mismatches:', fkMismatches, '(Expected: 0)');

const ok = tableCount === 46 && funcCount === 15 && triggerCount === 8 && policyCount === 37 && indexCount === 79 && fkMismatches === 0;

if (!ok) {
  console.error('CANONICAL_SCHEMA_COMPLETE=NO');
  process.exit(1);
}

console.log('CANONICAL_SCHEMA_COMPLETE=YES');
