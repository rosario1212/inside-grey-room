import { spawnSync } from 'node:child_process';

const token = process.env.CLOUDFLARE_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const isCi = process.env.GITHUB_ACTIONS === 'true';

if (!isCi || !token || !accountId) {
  process.exit(0);
}

function runWrangler(args, input = undefined) {
  return spawnSync('npx', ['--yes', 'wrangler@4.102.0', ...args], {
    cwd: process.cwd(),
    env: process.env,
    input,
    encoding: 'utf8',
    stdio: input === undefined ? ['ignore', 'pipe', 'pipe'] : ['pipe', 'pipe', 'pipe'],
  });
}

const listed = runWrangler(['secret', 'list', '--config', 'wrangler.jsonc']);
const current = `${listed.stdout || ''}\n${listed.stderr || ''}`;
if (current.includes('CF_TURN_KEY_ID') && current.includes('CF_TURN_KEY_TOKEN')) {
  console.log('Managed TURN secrets already configured.');
  process.exit(0);
}

const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/calls/turn_keys`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ name: 'inside-grey-room-production' }),
});

let body;
try {
  body = await response.json();
} catch {
  console.warn(`Managed TURN provisioning returned non-JSON HTTP ${response.status}.`);
  process.exit(0);
}

if (!response.ok) {
  const messages = Array.isArray(body?.errors) ? body.errors.map((e) => e?.message).filter(Boolean) : [];
  console.warn(`Managed TURN provisioning failed HTTP ${response.status}${messages.length ? `: ${messages.join('; ')}` : ''}.`);
  process.exit(0);
}

function collectObjects(value, out = []) {
  if (!value || typeof value !== 'object') return out;
  if (!Array.isArray(value)) out.push(value);
  for (const child of Array.isArray(value) ? value : Object.values(value)) {
    if (child && typeof child === 'object') collectObjects(child, out);
  }
  return out;
}

const objects = collectObjects(body);
const idNames = ['uid', 'id', 'key_id', 'keyId', 'token_id', 'tokenId'];
const secretNames = ['key', 'token', 'api_token', 'apiToken', 'secret', 'bearer'];
let turnId = null;
let turnSecret = null;

for (const object of objects) {
  if (!turnId) {
    for (const name of idNames) {
      const value = object?.[name];
      if (typeof value === 'string' && value.length >= 24) {
        turnId = value;
        break;
      }
    }
  }
  if (!turnSecret) {
    for (const name of secretNames) {
      const value = object?.[name];
      if (typeof value === 'string' && value.length >= 32 && value !== turnId) {
        turnSecret = value;
        break;
      }
    }
  }
  if (turnId && turnSecret) break;
}

if (!turnId || !turnSecret) {
  const topKeys = body && typeof body === 'object' ? Object.keys(body) : [];
  const resultKeys = body?.result && typeof body.result === 'object' ? Object.keys(body.result) : [];
  console.warn(`Managed TURN response did not expose credentials (HTTP ${response.status}; top=${topKeys.join(',')}; result=${resultKeys.join(',')}).`);
  process.exit(0);
}

console.log(`::add-mask::${turnId}`);
console.log(`::add-mask::${turnSecret}`);

const putId = runWrangler(['secret', 'put', 'CF_TURN_KEY_ID', '--config', 'wrangler.jsonc'], turnId);
if (putId.status !== 0) {
  console.warn('Could not persist CF_TURN_KEY_ID.');
  process.exit(0);
}
const putToken = runWrangler(['secret', 'put', 'CF_TURN_KEY_TOKEN', '--config', 'wrangler.jsonc'], turnSecret);
if (putToken.status !== 0) {
  console.warn('Could not persist CF_TURN_KEY_TOKEN.');
  process.exit(0);
}

console.log('Managed Cloudflare TURN configured.');
