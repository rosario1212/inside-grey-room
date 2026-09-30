import fs from 'node:fs';

const mustContain = (file, needles) => {
  const text = fs.readFileSync(file, 'utf8');
  for (const needle of needles) {
    if (!text.includes(needle)) throw new Error(`${file} missing required v12.22 marker: ${needle}`);
  }
};

mustContain('index.html', [
  'ui-polish-v12.css?v=v12.22-mobile-ui',
  'ui-polish-v12.js?v=v12.22-mobile-ui'
]);
mustContain('ui-polish-v12.js', [
  "enqueteur:{label:'Enquêteur'",
  "enqueteur:{label:'Investigator'",
  "STATE.view='home';renderHome()",
  'igr-settings-modal'
]);
mustContain('ui-polish-v12.css', [
  '.intro-gate:not(.done) ~ .igr-notify-bell',
  '.igr-settings-box',
  '.igr-locale-segment'
]);
mustContain('scripts/build-mobile.mjs', ['ui-polish-v12.css','ui-polish-v12.js']);
mustContain('scripts/build-web.mjs', ['ui-polish-v12.css','ui-polish-v12.js']);
mustContain('service-worker.js', ["igr-v12-22-mobile-ui",'/ui-polish-v12.js?v=v12.22-mobile-ui']);

console.log('v12.22 UI regression markers OK');
