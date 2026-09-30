import { access } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';

const platform = process.argv[2];
if (!['android', 'ios'].includes(platform)) {
  throw new Error('Usage: node scripts/ensure-capacitor-platform.mjs <android|ios>');
}

const root = process.cwd();
const nativeDir = path.join(root, platform);
try {
  await access(nativeDir);
  console.log(`Capacitor ${platform} platform already exists.`);
} catch {
  console.log(`Creating Capacitor ${platform} platform…`);
  await new Promise((resolve, reject) => {
    const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const child = spawn(command, ['cap', 'add', platform], { cwd: root, stdio: 'inherit', shell: false });
    child.once('error', reject);
    child.once('exit', code => code === 0 ? resolve() : reject(new Error(`cap add ${platform} exited with code ${code}`)));
  });
}
