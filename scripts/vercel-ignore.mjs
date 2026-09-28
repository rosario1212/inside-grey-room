// Vercel's Ignored Build Step: exit 0 = skip deployment, exit 1 = continue.
// The legacy duplicate project `inside-grey-room-v2` is still connected to this repo.
// Keep it from generating a second deployment for every commit/PR.
const LEGACY_DUPLICATE_PROJECT_ID = 'prj_NBtPyEf0nbb1bd43Xt3OJKkZ5s5o';

if (process.env.VERCEL_PROJECT_ID === LEGACY_DUPLICATE_PROJECT_ID) {
  console.log('Skipping obsolete duplicate Vercel project inside-grey-room-v2.');
  process.exit(0);
}

process.exit(1);
