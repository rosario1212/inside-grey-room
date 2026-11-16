// Verify live HTML and PWA point to the same immutable app build.
// A different cache name is valid only when the precached app matches HTML.
import assert from 'node:assert/strict';
export function assertPwaRevision(html,sw){
 const asset=html.match(/<script\s+src="(app-v11\.js\?v=[^"]+)"/)?.[1];
 const cache=sw.match(/^const CACHE='(igr-[^']+)'/m)?.[1];
 assert(asset,'Missing versioned app-v11.js in HTML');
 assert(cache,'Missing versioned PWA cache');
 assert(sw.includes("'/" + asset + "'"),'Service Worker precache differs from the HTML application');
 return {asset,cache};
}
