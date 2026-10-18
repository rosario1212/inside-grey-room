// Vercel's Ignored Build Step: exit 0 = skip deployment, exit 1 = continue.
// Hosting is now the private Cloudflare Worker, for every branch and project.
// Cancel legacy automatic builds before they can publish a parallel preview.
console.log('Skipping legacy hosting build: private Cloudflare deployment only.');
process.exit(0);
