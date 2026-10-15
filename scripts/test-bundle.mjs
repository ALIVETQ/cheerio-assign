/**
 * Production bundle scan — never prints secret values.
 * Fails if dist/ contains key-like strings, the literal GEMINI_API_KEY,
 * or the actual key from .env.local.
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), '.env.local');
  const vars = {};
  if (!existsSync(envPath)) return vars;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) vars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
  }
  return vars;
}

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

execSync('npx vite build', { stdio: 'inherit' });

const dist = resolve(process.cwd(), 'dist');
if (!existsSync(dist)) {
  console.error('test:bundle failed: dist/ missing after build');
  process.exit(1);
}

const env = loadEnvLocal();
const actualKey = env.GEMINI_API_KEY ?? '';
const files = walk(dist);
const blob = files.map((f) => readFileSync(f, 'utf8')).join('\n');

const hits = [];
if (blob.includes('GEMINI_API_KEY')) hits.push('literal GEMINI_API_KEY');
if (/AIza[0-9A-Za-z_-]{20,}/.test(blob)) hits.push('AIza-like token');
if (/AQ[0-9A-Za-z_-]{20,}/.test(blob)) hits.push('AQ-like token');
if (actualKey.length >= 8 && blob.includes(actualKey)) hits.push('actual key value');

if (hits.length) {
  console.error(`test:bundle failed: ${hits.join(', ')}`);
  process.exit(1);
}

console.log('test:bundle passed');
