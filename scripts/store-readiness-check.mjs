import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const warnings = [];
const ok = [];

function read(rel) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) {
    failures.push(`Missing required file: ${rel}`);
    return '';
  }
  return fs.readFileSync(p, 'utf8');
}

function requireMatch(rel, regex, message) {
  const text = read(rel);
  if (!text) return;
  if (!regex.test(text)) failures.push(`${rel}: ${message}`);
  else ok.push(`${rel}: ${message.replace(/^must /, '')}`);
}

function requireFile(rel, message = 'present') {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) failures.push(`Missing required file: ${rel}`);
  else ok.push(`${rel}: ${message}`);
}

const pkg = JSON.parse(read('package.json') || '{}');
const version = pkg.version || '';
if (!/^\d+\.\d+\.\d+$/.test(version)) failures.push('package.json: version must be semver x.y.z');
else ok.push(`App version: ${version}`);

if (pkg.scripts?.['store:check'] !== 'node scripts/store-readiness-check.mjs') {
  failures.push('package.json: missing canonical store:check script');
}

// Permanent app identities — changing these after first store upload creates a different app.
requireMatch('scripts/prepare-android.mjs', /com\.insidegreyroom\.game/, 'must keep Android application ID com.insidegreyroom.game');
requireMatch('scripts/prepare-ios.mjs', /com\.insidegreyroom\.game/, 'must keep iOS bundle ID com.insidegreyroom.game');

// 2026 mobile baselines.
requireMatch('scripts/prepare-android.mjs', /compileSdk[^\n]*36|compileSdk\s*=\s*36|compileSdkVersion\s+36/, 'must compile against Android API 36');
requireMatch('scripts/prepare-android.mjs', /targetSdk[^\n]*36|targetSdkVersion\s+36/, 'must target Android API 36');
requireMatch('scripts/prepare-android.mjs', /minSdk[^\n]*24|minSdkVersion\s+24/, 'must retain Android minSdk 24 unless intentionally changed');
requireMatch('scripts/prepare-ios.mjs', /15\.0/, 'must retain iOS deployment target 15.0 unless intentionally changed');
requireMatch('APP-STORE-RELEASE.md', /Xcode 26\+\s*\/\s*iOS 26 SDK\+/, 'must document the current Apple submission toolchain');
requireMatch('PLAY_STORE_RELEASE.md', /compile\/target SDK 36/, 'must document Android API 36');

// Store/legal surfaces expected by both reviewers and users.
for (const rel of ['privacy.html', 'terms.html', 'support.html', 'delete-account.html']) {
  requireFile(rel);
}
requireMatch('privacy.html', /Inside Grey Room n’intègre actuellement aucun SDK publicitaire/, 'must disclose the current no-ad-SDK state');
requireMatch('privacy.html', /Inside Grey Room n’enregistre pas le flux/, 'must disclose live-only WebRTC behavior');
requireMatch('delete-account.html', /delete_recovery/, 'must expose a working self-service deletion path');
requireMatch('support.html', /support_request/, 'must expose a support request path');
requireMatch('terms.html', /blocage et signalement/i, 'must disclose blocking/reporting moderation');

// Native privacy/icon resources.
requireFile('PrivacyInfo.xcprivacy', 'Apple privacy manifest source present');
requireFile('assets/icon-512-v9.png', 'base store/app icon source present');

// Prevent accidental privileged backend credentials from being shipped in runtime source.
const runtimeRoots = ['index.html', 'app.js', 'app-mobile.js', 'support.html', 'delete-account.html', 'privacy.html', 'terms.html'];
const forbidden = [/SUPABASE_SERVICE_ROLE/i, /service_role\s*[:=]/i, /sb_secret_[A-Za-z0-9_-]+/];
for (const rel of runtimeRoots) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) continue;
  const text = fs.readFileSync(p, 'utf8');
  if (forbidden.some((rx) => rx.test(text))) failures.push(`${rel}: privileged backend credential marker found in client/runtime source`);
}

// Documentation version drift is a release-risk signal, not merely cosmetic.
const appStoreDoc = read('APP-STORE-RELEASE.md');
if (appStoreDoc && version && !appStoreDoc.includes(`v${version}`)) {
  warnings.push(`APP-STORE-RELEASE.md does not mention current package version v${version}`);
}

console.log('\nInside Grey Room — Store readiness gate');
console.log('========================================');
for (const item of ok) console.log(`✓ ${item}`);
for (const item of warnings) console.warn(`! ${item}`);
for (const item of failures) console.error(`✗ ${item}`);
console.log(`\n${ok.length} checks passed, ${warnings.length} warning(s), ${failures.length} failure(s).`);

if (failures.length) process.exit(1);
