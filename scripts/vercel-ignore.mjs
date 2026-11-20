// Keep this tiny fail-closed guard while any historical Vercel Git integration can still reach the repository.
// Vercel Ignored Build Step: exit 0 = skip the deployment; exit 1 = deploy.
// Only the Cloudflare Worker inside-grey-room-last publishes Inside Grey Room.
console.log('Legacy Vercel deployment disabled: production is Cloudflare inside-grey-room-last.');
process.exit(0);
