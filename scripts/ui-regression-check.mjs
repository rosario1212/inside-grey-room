import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const mustContain = (file, needles) => {
  const text = fs.readFileSync(file, 'utf8');
  for (const needle of needles) {
    if (!text.includes(needle)) throw new Error(`${file} missing required locale/Home/OMERTA marker: ${needle}`);
  }
};

mustContain('index.html', [
  'ui-polish-v12.css?v=v12.22-mobile-ui',
  'ui-polish-v12.js?v=v12.22-mobile-ui',
  'locale-runtime-v12-23.js?v=v12.23-locale-home',
  'omerta-v12.css?v=v12.24-omerta',
  'omerta-v12.js?v=v12.24-omerta',
  'omerta-polish-v12.css?v=v12.28-omerta',
  'omerta-polish-v12.js?v=v12.28-omerta',
  'role-tree-polish-v12-29.css?v=v12.29-role-tree',
  'role-tree-polish-v12-29.js?v=v12.29-role-tree',
  'omerta-v12-30.css?v=v12.30-omerta-identity',
  'omerta-v12-30.js?v=v12.30-omerta-identity'
]);
mustContain('ui-polish-v12.js', [
  "enqueteur:{label:'Enquêteur'",
  "enqueteur:{label:'Investigator'",
  "STATE.view='home';renderHome()",
  'igr-settings-modal'
]);
mustContain('locale-runtime-v12-23.js', [
  'stopRoomWatcher',
  'Resume my room',
  'Choose your role',
  'Assigned at launch',
  'PUBLIC PREVIEW · SPOILER-FREE',
  'Your case'
]);
mustContain('ui-polish-v12.css', [
  '.intro-gate:not(.done) ~ .igr-notify-bell',
  '.igr-settings-box',
  '.igr-locale-segment'
]);
mustContain('omerta-v12.js', [
  "'021'",
  'igr_omerta_create_room',
  'igr_omerta_join_room',
  'igr_omerta_choose_role',
  'igr_omerta_start_game',
  'igr_omerta_action',
  'TÉLÉPHONES POSÉS'
]);
mustContain('omerta-v12.css', ['.omerta-dlc-section','.omerta-decision-dock','.omerta-access-box']);
mustContain('omerta-polish-v12.js', [
  "'021':'assets/omerta-021-l-enveloppe.webp?v=12.27'",
  'igr-random-role-cta',
  'omerta-org-tree',
  'Arbre de la Famiglia'
]);
mustContain('omerta-polish-v12.css', [
  '.igr-random-role-cta',
  '.igr-legacy-random',
  '.omerta-org-tree',
  '.omerta-family-node'
]);
mustContain('role-tree-polish-v12-29.js', [
  'chooseRandomLobbyRole',
  'crypto.getRandomValues',
  'omerta-tree-responsive'
]);
mustContain('omerta-v12-30.js', [
  'igr_v4_choose_random_role',
  'character',
  'identityPairs',
  'omerta-021-l-enveloppe-hd.svg',
  'orientationchange'
]);
mustContain('omerta-v12-30.css', [
  '.igr-random-role-cta.is-base',
  '.igr-random-role-cta.is-omerta',
  '.omerta-tree-v1230 .omerta-org-scroll',
  'orientation:landscape'
]);
mustContain('scripts/build-mobile.mjs', ['omerta-v12-30.css','omerta-v12-30.js']);
mustContain('scripts/build-web.mjs', ['omerta-v12-30.css','omerta-v12-30.js']);
mustContain('service-worker.js', [
  "igr-v12-30-omerta-identity",
  '/locale-runtime-v12-23.js?v=v12.23-locale-home',
  '/omerta-v12-30.js?v=v12.30-omerta-identity',
  '/assets/omerta-025-il-don-hd.svg?v=12.30'
]);
for (const file of ['locale-runtime-v12-23.js','omerta-v12.js','omerta-polish-v12.js','role-tree-polish-v12-29.js','omerta-v12-30.js']) {
  execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
}
console.log('v12.30 locale/Home/OMERTA regression markers OK');
