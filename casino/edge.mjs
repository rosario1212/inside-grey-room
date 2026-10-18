import {casinoService,sha256} from './service.mjs';
// Same high entropy invitation gate as Cloudflare; the passcode itself is never
// stored in the repository, logs, URL, JSON response or browser JavaScript.
const ACCESS_VERIFIER='2fff1181a22a47ce8a64091e7cbb8b10db6fd23a2e5cef451d69364dc8b33d3d';
const PRIVATE_ORIGIN='https://inside-grey-room-last.alial-khafaji2002.workers.dev';
const errorStatus=code=>code==='revision_conflict'||code==='idempotency_key_conflict'?409:
  /not_authorized|access_required|forbidden|unauthorized|host_required/.test(code)?403:
  /release_required/.test(code)?503:400;
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
const equal=(a,b)=>{if(a.length!==b.length)return false;let v=0;for(let i=0;i<a.length;i++)v|=a.charCodeAt(i)^b.charCodeAt(i);return v===0};
export function createStorage({url,key,fetcher=fetch}){
  async function rpc(name,args={}){
    const response=await fetcher(url+'/rest/v1/rpc/'+name,{method:'POST',headers:{'Content-Type':'application/json',apikey:key,Authorization:'Bearer '+key},body:JSON.stringify(args)});
    const value=await response.json();
    if(!response.ok){
      const code=String(value?.message||'storage_unavailable');
      // Never forward SQL, response details or internal rows to an API client.
      if(/^(revision_conflict|idempotency_key_conflict|room_not_found|premium_access_required|campaign_action_limit|invalid_snapshot)$/.test(code))throw Error(code);
      throw Error('storage_unavailable');
    }
    return value;
  }
  return {
    read:(id,invite=null)=>rpc('igr_casino_storage_read',{p_id:id,p_invite:invite}),
    create:a=>rpc('igr_casino_storage_create',{p_id:a.id,p_invite:a.inviteCode,p_profile_id:a.profileId,p_profile_token:a.profileToken,p_state:a.state}),
    commit:a=>rpc('igr_casino_storage_commit',{p_id:a.id,p_expected_revision:a.expectedRevision,p_request_id:a.requestId,p_actor:a.actor,p_fingerprint:a.fingerprint,p_command:a.command,p_state:a.state}),
    receipt:(id,requestId)=>rpc('igr_casino_storage_receipt',{p_id:id,p_request_id:requestId}),
    releases:()=>rpc('igr_casino_approved_releases')
  };
}
export function edgeHandler(storage,{verifier=ACCESS_VERIFIER,...options}={}){
  const service=casinoService(storage,options);
  return async req=>{
    const origin=req.headers.get('Origin');
    if(origin&&origin!==PRIVATE_ORIGIN)return reply({error:'origin_forbidden'},403);
    if(req.method!=='POST')return reply({error:'method_not_allowed'},405);
    const code=req.headers.get('X-IGR-Private-Code')||'';
    if(code.length<28||code.length>120||!equal(await sha256(code),verifier))return reply({error:'private_access_required'},401);
    if(!(req.headers.get('Content-Type')||'').startsWith('application/json'))return reply({error:'json_required'},415);
    if(+(req.headers.get('Content-Length')||0)>16384)return reply({error:'request_too_large'},413);
    let raw='';
    try{
      const reader=req.body?.getReader();if(!reader)return reply({error:'invalid_request'},400);
      const decoder=new TextDecoder();let bytes=0;
      while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>16384){await reader.cancel();return reply({error:'request_too_large'},413)}raw+=decoder.decode(value,{stream:true})}
      raw+=decoder.decode();const result=await service.process(JSON.parse(raw));return reply(result);
    }catch(e){
      const code=String(e?.message||'invalid_request');
      // Only application error identifiers may cross this boundary.
      const safe=/^[a-z][a-z0-9_]{1,100}$/.test(code)?code:'invalid_request';
      return reply({error:safe},safe==='storage_unavailable'?503:errorStatus(safe));
    }
  };
}
if(typeof Deno!=='undefined'&&import.meta.main){
  const storage=createStorage({url:Deno.env.get('SUPABASE_URL'),key:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')});
  Deno.serve(edgeHandler(storage));
}
