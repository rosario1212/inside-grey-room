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

function requireNoMatch(rel, regex, message) {
  const text = read(rel);
  if (!text) return;
  if (regex.test(text)) failures.push(`${rel}: ${message}`);
  else ok.push(`${rel}: ${message}`);
}

function requireFile(rel, message = 'present') {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) failures.push(`Missing required file: ${rel}`);
  else ok.push(`${rel}: ${message}`);
}

function requireAbsent(rel, message) {
  const p = path.join(root, rel);
  if (fs.existsSync(p)) failures.push(`${rel}: ${message}`);
  else ok.push(`${rel}: ${message}`);
}

const pkg = JSON.parse(read('package.json') || '{}');
const version = pkg.version || '';
if (!/^\d+\.\d+\.\d+$/.test(version)) failures.push('package.json: version must be semver x.y.z');
else ok.push(`Internal app version: ${version}`);

if (pkg.scripts?.['store:check'] !== 'npm run mobile:build && node scripts/store-readiness-check.mjs') {
  failures.push('package.json: store:check must build and validate the actual native web bundle');
}

// Permanent app identity — changing it after first store upload creates a different app.
requireMatch('capacitor.config.json', /"appId"\s*:\s*"com\.insidegreyroom\.game"/, 'must keep mobile application ID com.insidegreyroom.game');
requireMatch('scripts/prepare-ios.mjs', /com\.insidegreyroom\.game/, 'must keep the iOS fallback bundle ID aligned with Capacitor');
requireMatch('scripts/prepare-ios.mjs', /IOS_MARKETING_VERSION/, 'must allow the public App Store version to be set independently from the internal game version');

// 2026 mobile baselines.
requireMatch('scripts/prepare-android.mjs', /compileSdkVersion\s*=\s*36/, 'must compile against Android API 36');
requireMatch('scripts/prepare-android.mjs', /targetSdkVersion\s*=\s*36/, 'must target Android API 36');
requireMatch('scripts/prepare-android.mjs', /minSdkVersion\s*=\s*24/, 'must retain Android minSdk 24 unless intentionally changed');
requireMatch('scripts/prepare-android.mjs', /usesCleartextTraffic=\"false\"/, 'must disable cleartext Android traffic');
requireMatch('scripts/prepare-android.mjs', /allowBackup=\"false\"/, 'must disable Android application backup for private game/session data');
requireMatch('scripts/prepare-ios.mjs', /15\.0/, 'must retain iOS deployment target 15.0 unless intentionally changed');
requireMatch('APP-STORE-RELEASE.md', /Xcode 26\+\s*\/\s*iOS 26 SDK\+/, 'must document the current Apple submission toolchain');
requireMatch('PLAY_STORE_RELEASE.md', /compile\/target SDK 36/, 'must document Android API 36');

// Store/legal surfaces expected by reviewers and users.
for (const rel of ['privacy.html', 'terms.html', 'support.html', 'delete-account.html']) requireFile(rel);
requireMatch('privacy.html', /aucun SDK publicitaire/, 'must disclose the current no-ad-SDK state');
requireMatch('privacy.html', /n’enregistre pas le flux/, 'must disclose live-only WebRTC behavior');
requireMatch('delete-account.html', /delete_recovery/, 'must expose a working self-service deletion path');
requireMatch('support.html', /support_request/, 'must expose a support request path');
requireMatch('terms.html', /blocage[^<]*signalement/i, 'must disclose blocking/reporting moderation');

// Native privacy/icon resources.
requireFile('PrivacyInfo.xcprivacy', 'Apple privacy manifest source present');
requireFile('assets/icon-512-v9.png', 'Google Play / app icon source present');
if (!fs.existsSync(path.join(root, 'assets', 'icon-1024.png')) && !fs.existsSync(path.join(root, 'assets', 'icon-1024-v9.png'))) {
  warnings.push('No true 1024x1024 master icon is committed; iOS currently derives its 1024 App Store icon from the 512 source. Replace with a native 1024 master before final commercial submission.');
}

// The web/PWA beta can use owner-issued tester codes. A native store build cannot
// expose them as an alternative way to unlock paid digital content.
requireFile('native-store-boundary-v14.js', 'native commerce boundary present');
requireMatch('scripts/build-mobile.mjs', /legacyStoreExcluded/, 'must explicitly separate private beta unlock tooling from native store bundles');
requireMatch('scripts/build-mobile.mjs', /native-store-boundary-v14\.js/, 'must load the native commerce boundary');
for (const page of ['www/index.html', 'www/en.html']) {
  requireNoMatch(page, /dlc-invites-v12-45\.(?:js|css)/i, 'native bundle must not reference legacy DLC invite/code unlock UI');
  requireMatch(page, /native-store-boundary-v14\.js/, 'must include native store commerce boundary');
}
requireAbsent('www/dlc-invites-v12-45.js', 'legacy code unlock JavaScript must not ship in the native bundle');
requireAbsent('www/dlc-invites-v12-45.css', 'legacy code unlock stylesheet must not ship in the native bundle');

// Prevent accidental privileged backend credentials from being shipped in client/runtime code.
const forbidden = [/SUPABASE_SERVICE_ROLE/i, /service_role\s*[:=]/i, /sb_secret_[A-Za-z0-9_-]+/];
const scanFiles = fs.readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isFile() && /\.(?:js|mjs|html)$/i.test(entry.name))
  .map((entry) => entry.name);
for (const rel of scanFiles) {
  const text = fs.readFileSync(path.join(root, rel), 'utf8');
  if (forbidden.some((rx) => rx.test(text))) failures.push(`${rel}: privileged backend credential marker found in client/runtime source`);
}

// Documentation version drift is a release-risk signal, not merely cosmetic.
const appStoreDoc = read('APP-STORE-RELEASE.md');
if (appStoreDoc && version && !appStoreDoc.includes(`v${version}`)) {
  warnings.push(`APP-STORE-RELEASE.md does not mention current internal package version v${version}`);
}

// Account-bound blocker: intentionally a warning during the playtest phase.
// It becomes a hard release blocker before the first paid commercial submission.
warnings.push('Commercial billing is intentionally not wired yet. Before store submission, connect StoreKit 2 and Google Play Billing to IGR_STORE_COMMERCE_ADAPTER, validate receipts server-side, grant premium entitlements from verified purchases, and provide Restore Purchases.');

console.log('\nInside Grey Room — Store readiness gate');
console.log('========================================');
for (const item of ok) console.log(`✓ ${item}`);
for (const item of warnings) console.warn(`! ${item}`);
for (const item of failures) console.error(`✗ ${item}`);
console.log(`\n${ok.length} checks passed, ${warnings.length} warning(s), ${failures.length} failure(s).`);

if (failures.length) process.exit(1);
