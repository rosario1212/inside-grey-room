import {createStorage,edgeHandler} from './edge.mjs';
// Only the Edge runtime reads privileged keys. Never put them in wrangler vars,
// a frontend asset, a logged request or a client-visible exception.
const storage=createStorage({url:Deno.env.get('SUPABASE_URL'),key:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')});
Deno.serve(edgeHandler(storage));
