import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const mustContain = (file, needles) => {
  const text = fs.readFileSync(file, 'utf8');
  for (const needle of needles) {
    if (!text.includes(needle)) throw new Error(`${file} missing required locale/Home marker: ${needle}`);
  }
};

mustContain('index.html', [
  'ui-polish-v12.css?v=v12.22-mobile-ui',
  'ui-polish-v12.js?v=v12.22-mobile-ui',
  'locale-runtime-v12-23.js?v=v12.23-locale-home'
]);
mustContain('ui-polish-v12.js', [
  "enqueteur:{label:'Enquêteur'",
  "enqueteur:{label:'Investigator'",
  "STATE.view='home';renderHome()",
  'igr-settings-modal'
]);
mustContain('locale-runtime-v12-23.js', [
  "stopRoomWatcher",
  "Resume my room",
  "Choose your role",
  "Assigned at launch",
  "PUBLIC PREVIEW · SPOILER-FREE",
  "Your case"
]);
mustContain('ui-polish-v12.css', [
  '.intro-gate:not(.done) ~ .igr-notify-bell',
  '.igr-settings-box',
  '.igr-locale-segment'
]);
mustContain('scripts/build-mobile.mjs', ['ui-polish-v12.css','ui-polish-v12.js','locale-runtime-v12-23.js']);
mustContain('scripts/build-web.mjs', ['ui-polish-v12.css','ui-polish-v12.js','locale-runtime-v12-23.js']);
mustContain('service-worker.js', ["igr-v12-23-locale-home",'/locale-runtime-v12-23.js?v=v12.23-locale-home']);
execFileSync(process.execPath,['--check','locale-runtime-v12-23.js'],{stdio:'inherit'});

console.log('v12.23 locale/Home regression markers OK');
