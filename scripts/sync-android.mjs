import { rm, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const reset = process.argv.includes('--reset');
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

async function exists(file) {
  try { await stat(file); return true; } catch { return false; }
}

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(process.execPath, ['scripts/build-mobile.mjs']);

const androidDir = path.join(root, 'android');
const projectReady =
  await exists(path.join(androidDir, 'gradlew')) &&
  await exists(path.join(androidDir, 'app', 'build.gradle'));

if (reset || !projectReady) {
  if (await exists(androidDir)) {
    console.log('Android shell incomplete or stale: rebuilding it.');
    await rm(androidDir, { recursive: true, force: true });
  }
  run(npx, ['cap', 'add', 'android']);
}

run(npx, ['cap', 'sync', 'android']);
run(process.execPath, ['scripts/prepare-android.mjs']);

console.log('Android project ready. Run npm run android:open or open android/ in Android Studio.');
