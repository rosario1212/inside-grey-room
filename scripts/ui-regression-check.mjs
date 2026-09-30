import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const mustContain = (file, needles) => {
  const text = fs.readFileSync(file, 'utf8');
  for (const needle of needles) {
    if (!text.includes(needle)) throw new Error(`${file} missing required runtime marker: ${needle}`);
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
  'omerta-v12-30.css?v=v12.32-omerta-final',
  'omerta-v12-30.js?v=v12.32-omerta-final',
  'terror-v12.css?v=v12.33-terror',
  'terror-v12.js?v=v12.33-terror'
]);

mustContain('ui-polish-v12.js', [
  "enqueteur:{label:'Enquêteur'",
  "enqueteur:{label:'Investigator'",
  "STATE.view='home';renderHome()",
  'igr-settings-modal'
]);
mustContain('locale-runtime-v12-23.js', [
  'stopRoomWatcher','Resume my room','Choose your role','Assigned at launch','PUBLIC PREVIEW · SPOILER-FREE','Your case'
]);
mustContain('ui-polish-v12.css', ['.intro-gate:not(.done) ~ .igr-notify-bell','.igr-settings-box','.igr-locale-segment']);

mustContain('omerta-v12.js', ["'021'",'igr_omerta_create_room','igr_omerta_join_room','igr_omerta_choose_role','igr_omerta_start_game','igr_omerta_action','TÉLÉPHONES POSÉS']);
mustContain('omerta-v12.css', ['.omerta-dlc-section','.omerta-decision-dock','.omerta-access-box']);
mustContain('omerta-polish-v12.js', ['igr-random-role-cta','omerta-org-tree','Arbre de la Famiglia']);
mustContain('omerta-polish-v12.css', ['.igr-random-role-cta','.igr-legacy-random','.omerta-org-tree','.omerta-family-node']);
mustContain('role-tree-polish-v12-29.js', ['chooseRandomLobbyRole','crypto.getRandomValues','omerta-tree-responsive']);
// v12.32 owns the current random-role runtime. Validate the implementation that
// actually ships instead of removed legacy markers.
mustContain('omerta-v12-30.js', [
  'chooseRandomLobbyRole',
  'crypto.getRandomValues',
  'igr_v4_choose_role',
  'igr_omerta_choose_role',
  'character',
  'omerta-tree-v1232',
  'overflowX'
]);
mustContain('omerta-v12-30.css', ['.igr-random-role-cta.is-base','.igr-random-role-cta.is-omerta','.omerta-tree-v1230 .omerta-org-scroll','orientation:landscape']);

mustContain('terror-v12.js', [
  "'026'","'027'","'028'",
  'LA VILLE TOMBE','LA ZONE ROUGE','DERNIER PÉRIMÈTRE',
  'Officier de liaison','Agent de renseignement',
  'igr_terror_military_decision','terror-perimeter-hud'
]);
mustContain('terror-v12.css', ['.terror-dlc-section','.terror-perimeter-hud','.terror-decision-grid']);
mustContain('scripts/build-mobile.mjs', ['omerta-v12-30.css','omerta-v12-30.js','terror-v12.css','terror-v12.js']);
mustContain('scripts/build-web.mjs', ['omerta-v12-30.css','omerta-v12-30.js','terror-v12.css','terror-v12.js']);
mustContain('service-worker.js', [
  "igr-v12-33-terror",
  '/locale-runtime-v12-23.js?v=v12.23-locale-home',
  '/omerta-v12-30.js?v=v12.32-omerta-final',
  '/terror-v12.js?v=v12.33-terror',
  '/terror-v12.css?v=v12.33-terror'
]);

for (const file of [
  'locale-runtime-v12-23.js','omerta-v12.js','omerta-polish-v12.js','role-tree-polish-v12-29.js','omerta-v12-30.js','terror-v12.js'
]) {
  execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
}
console.log('v12.33 locale/Home/OMERTA/TERREUR regression markers OK');
