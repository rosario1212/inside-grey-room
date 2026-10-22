-- CARTEL 031: author delegated final completion on 2026-10-22.
-- The complete canon stays in igr_private; this migration contains mechanics only.
create table if not exists igr_private.igr_v171_031_matches(
 room_code text primary key references public.igr_v4_rooms(code) on delete cascade,
 match_no integer not null, manuscript jsonb not null, event_floor_id bigint not null,
 ballots jsonb not null default '{}', offers jsonb not null default '{}',
 plan jsonb not null default '{"mode":"wait"}', decisions_locked boolean not null default false,
 nominee uuid references public.igr_v4_players(id) on delete set null,
 crisis_started_at timestamptz, witness_signed boolean not null default false
);
alter table igr_private.igr_v171_031_matches enable row level security;
revoke all on table igr_private.igr_v171_031_matches from public,anon,authenticated;

do $authorize$
declare m jsonb;
begin
 select manuscript into m from igr_private.igr_v99_variant_manuscripts where scenario_id='031' and variant_id='A';
 if m->>'version' is distinct from 'v171-cartel031-la-dette'
 or jsonb_array_length(m->'suspects')<>3 or jsonb_array_length(m->'revelations')<>13
 or m#>>'{roles,maitre,anchors}' not like '%Tu n’as pas de proche dans le groupe%'
 or m#>>'{canonical_truth,levels}'<>'[2, 2, 2]' then raise exception '031 canon incomplete'; end if;
 if (select count(*) from igr_private.igr_v99_variant_manuscripts where scenario_id='031' and manuscript->>'version'='v171-cartel031-la-dette' and manuscript->>'author_release_approved'='true')<>3 then raise exception '031 requires three authored variants'; end if;
 update igr_private.igr_v99_variant_manuscripts set editorial_status='ready',
 approved_by='Author: delegated final completion and integration 2026-10-22',approved_at=now(),updated_at=now()
 where scenario_id='031' and variant_id in ('A','B','C');
 update public.igr_v4_scenario_packs set pack=pack||jsonb_build_object(
 'context',m->>'public_context','trames',jsonb_build_array(jsonb_build_object('title','LE DOSSIER','text','Recoupez les déclarations des trois chefs avec les pièces reçues par le bureau.','min_cycle',1,'kind','balanced')),'news','[]'::jsonb,'relations','{}'::jsonb,
 'witnesses','[]'::jsonb,'truth',jsonb_build_object('levels',jsonb_build_array(2,2,2),'summary','La révélation du dossier intervient à la fin de la partie.')),
 updated_at=now() where scenario_id='031';
end $authorize$;

create or replace function igr_private.igr_v171_031_start()
returns trigger language plpgsql security definer set search_path='' as $start$
declare m jsonb; p record; card jsonb; floor_id bigint; n integer;
begin
 if not(old.status='lobby' and new.status='playing') then return new; end if;
 if new.scenario_id<>'031' then delete from igr_private.igr_v171_031_matches where room_code=new.code; return new; end if;
 select count(*) into n from public.igr_v4_players where room_code=new.code;
 if n not between 6 and 8 then raise exception '031 requires 6-8 players'; end if;
 select manuscript into m from igr_private.igr_v99_variant_manuscripts
 where scenario_id='031' and editorial_status='ready' and manuscript->>'author_release_approved'='true'
 order by gen_random_uuid() limit 1;
 if m->>'version' is distinct from 'v171-cartel031-la-dette' then raise exception '031 release unavailable'; end if;
 select coalesce(max(id),0) into floor_id from public.igr_v4_events where room_code=new.code;
 insert into igr_private.igr_v171_031_matches(room_code,match_no,manuscript,event_floor_id)
 values(new.code,greatest(1,coalesce((new.state->>'match_no')::int,1)),m,floor_id)
 on conflict(room_code) do update set match_no=excluded.match_no,manuscript=excluded.manuscript,
 event_floor_id=excluded.event_floor_id,ballots='{}',offers='{}',plan='{"mode":"wait"}',
 decisions_locked=false,nominee=null,crisis_started_at=null,witness_signed=false;
 delete from public.igr_v4_actions where room_code=new.code;
 delete from public.igr_v47_prosecutor_cooperations where room_code=new.code;
 for p in select * from public.igr_v4_players where room_code=new.code loop
  if p.public_role='suspect' then card:=m->'suspects'->(p.internal_slot-1);
  else card:=m->'roles'->p.public_role; end if;
  if card is null then raise exception '031 private role missing: %',p.public_role; end if;
  if card ? 'identity' then card:=card||jsonb_build_object('place',(card->>'identity')||E'\n\n'||(card->>'place')); end if;
  card:=card||jsonb_build_object('scenario_version','v171-cartel031-la-dette');
  update public.igr_v4_players set private_state=card where id=p.id;
 end loop;
 update public.igr_v4_rooms set state=state||jsonb_build_object('cartel031_ready',true) where code=new.code;
 return new;
end $start$;
revoke all on function igr_private.igr_v171_031_start() from public,anon,authenticated;
drop trigger if exists igr_v171_031_start on public.igr_v4_rooms;
create trigger igr_v171_031_start after update of status on public.igr_v4_rooms
for each row when(old.status='lobby' and new.status='playing') execute function igr_private.igr_v171_031_start();

create or replace function igr_private.igr_v171_031_cycle()
returns trigger language plpgsql security definer set search_path='' as $cycle$
declare x igr_private.igr_v171_031_matches%rowtype; piece jsonb; p record; proof jsonb;
begin
 if new.scenario_id<>'031' or new.status<>'playing' or new.cycle<=old.cycle or new.cycle not between 1 and 3 then return new; end if;
 select * into x from igr_private.igr_v171_031_matches where room_code=new.code for update;
 if not found then return new; end if;
 for piece in select value from jsonb_array_elements(x.manuscript->'revelations') loop
  if (piece->>'min_cycle')::int<=new.cycle and not exists(
   select 1 from public.igr_v4_events where room_code=new.code and id>x.event_floor_id
   and event_type='trame' and payload->>'evidence_id'=piece->>'id'
  ) then
   insert into public.igr_v4_events(room_code,event_type,visibility,audience_roles,payload,cycle)
   values(new.code,'trame','roles',array['enqueteur','analyste','procureur'],
   jsonb_build_object('title',piece->>'title','text',piece->>'text','evidence_id',piece->>'id','source','CARTEL 031 — Enquête','match_no',x.match_no),new.cycle);
  end if;
 end loop;
 if new.cycle>=2 and x.crisis_started_at is null then
  update igr_private.igr_v171_031_matches set crisis_started_at=now() where room_code=new.code;
  for p in select * from public.igr_v4_players where room_code=new.code and public_role in ('enqueteur','analyste','procureur') loop
   proof:=x.manuscript->'family_proofs'->p.public_role;
   if proof is null then raise exception '031 private proof missing'; end if;
   update public.igr_v4_players set private_state=private_state||jsonb_build_object('family_proof',proof) where id=p.id;
   insert into public.igr_v4_events(room_code,event_type,visibility,target_player_id,payload,cycle)
   values(new.code,'cartel031_private_proof','private',p.id,proof||jsonb_build_object('match_no',x.match_no),2);
  end loop;
  insert into public.igr_v4_events(room_code,event_type,visibility,audience_roles,payload,cycle)
  values(new.code,'cartel031_demand','roles',array['enqueteur','analyste','procureur'],
  jsonb_build_object('title','LA DEMANDE','text',x.manuscript->>'demand','match_no',x.match_no),2);
 end if;
 return new;
end $cycle$;
revoke all on function igr_private.igr_v171_031_cycle() from public,anon,authenticated;
drop trigger if exists igr_v171_031_cycle on public.igr_v4_rooms;
create trigger igr_v171_031_cycle after update of cycle on public.igr_v4_rooms
for each row when(new.scenario_id='031' and new.status='playing' and new.cycle>old.cycle) execute function igr_private.igr_v171_031_cycle();

create or replace function igr_private.igr_v171_031_freeze(p_room text)
returns void language plpgsql set search_path='' as $freeze$
declare x igr_private.igr_v171_031_matches%rowtype; required integer; chosen uuid;
begin
 select * into x from igr_private.igr_v171_031_matches where room_code=p_room for update;
 if not found or x.decisions_locked then return; end if;
 select floor(count(*)/2.0)::int+1 into required from public.igr_v4_players
 where room_code=p_room and public_role in ('enqueteur','analyste','procureur');
 select nominee.id into chosen
 from public.igr_v4_players nominee
 join public.igr_v4_players voter on voter.room_code=nominee.room_code
   and voter.public_role in ('enqueteur','analyste','procureur')
 where nominee.room_code=p_room and nominee.public_role in ('enqueteur','analyste','procureur')
 and x.ballots->>voter.id::text=nominee.id::text
 group by nominee.id having count(*)>=required limit 1;
 update igr_private.igr_v171_031_matches set nominee=chosen,decisions_locked=true where room_code=p_room;
end $freeze$;
revoke all on function igr_private.igr_v171_031_freeze(text) from public,anon,authenticated;

create or replace function igr_private.igr_v171_031_close()
returns trigger language plpgsql security definer set search_path='' as $close$
begin
 if new.scenario_id='031' and old.status='playing' and new.phase is distinct from old.phase
 and new.phase in ('closed','final_audience','final_suspect_defenses','locking','reveal')
 and exists(select 1 from igr_private.igr_v171_031_matches where room_code=new.code) then
  if new.cycle<>3 then raise exception '031: poursuivez les trois cycles avant de clore'; end if;
  perform igr_private.igr_v171_031_freeze(new.code);
 end if;
 return new;
end $close$;
revoke all on function igr_private.igr_v171_031_close() from public,anon,authenticated;
drop trigger if exists igr_v171_031_close on public.igr_v4_rooms;
create trigger igr_v171_031_close before update of phase on public.igr_v4_rooms
for each row execute function igr_private.igr_v171_031_close();

create or replace function public.igr_v171_031_state(p_code text,p_player_token uuid)
returns jsonb language plpgsql security definer set search_path='' as $state$
declare me public.igr_v4_players%rowtype; r public.igr_v4_rooms%rowtype;
 x igr_private.igr_v171_031_matches%rowtype; out_state jsonb; crew jsonb; offer jsonb; client uuid;
 bureau boolean; votes integer; n integer;
begin
 select * into me from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token;
 if not found then raise exception 'unauthorized'; end if;
 select * into r from public.igr_v4_rooms where code=me.room_code;
 if r.scenario_id<>'031' then return jsonb_build_object('enabled',false); end if;
 select * into x from igr_private.igr_v171_031_matches where room_code=r.code;
 if not found or r.status not in ('playing','finished') then return jsonb_build_object('enabled',false); end if;
 bureau:=me.public_role in ('enqueteur','analyste','procureur');
 out_state:=jsonb_build_object('enabled',true,'version','v171-cartel031-la-dette',
 'role',me.public_role,'cycle',r.cycle,'crisis',x.crisis_started_at is not null,'locked',x.decisions_locked,
 'open',r.status='playing' and not x.decisions_locked,'witness_signed',x.witness_signed);
 if bureau and x.crisis_started_at is not null then
  select count(*),coalesce(jsonb_agg(jsonb_build_object('id',p.id,'pseudo',p.pseudo,'role',p.public_role) order by p.seat_index),'[]')
  into n,crew from public.igr_v4_players p where room_code=r.code and public_role in ('enqueteur','analyste','procureur');
  select count(*) into votes from public.igr_v4_players p where room_code=r.code
   and public_role in ('enqueteur','analyste','procureur') and x.ballots ? p.id::text;
  out_state:=out_state||jsonb_build_object('crew',crew,'votes_received',votes,'majority',floor(n/2.0)::int+1,
  'own_ballot',x.ballots->>me.id::text,'nominee',case when x.decisions_locked then
   (select jsonb_build_object('id',id,'pseudo',pseudo) from public.igr_v4_players where id=x.nominee) else null end,
  'proof',me.private_state->'family_proof','demand',x.manuscript->>'demand',
  'locations',x.manuscript->'locations','approaches',x.manuscript->'approaches','assault_options',x.manuscript->'assault_options','plan',x.plan);
  out_state:=out_state||jsonb_build_object('suspects',(select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'pseudo',p.pseudo,
  'offer',x.offers->p.id::text) order by p.internal_slot),'[]') from public.igr_v4_players p where p.room_code=r.code and p.public_role='suspect'));
 elsif me.public_role='suspect' and x.crisis_started_at is not null then
  out_state:=out_state||jsonb_build_object('offer',x.offers->me.id::text);
 elsif me.public_role='maitre' then
  select client_id into client from public.igr_v43_lawyer_representations where room_code=r.code and lawyer_id=me.id;
  offer:=x.offers->client::text;
  out_state:=out_state||jsonb_build_object('cartel_forfeit',coalesce((me.private_state->>'lawyer_cartel_forfeit')::boolean,false),
   'client_id',client,'offer',offer-'deposition');
 end if;
 return out_state;
end $state$;
revoke all on function public.igr_v171_031_state(text,uuid) from public,anon,authenticated;
grant execute on function public.igr_v171_031_state(text,uuid) to anon,service_role;

create or replace function public.igr_v171_031_act(p_code text,p_player_token uuid,p_action text,p_payload jsonb default '{}')
returns jsonb language plpgsql security definer set search_path='' as $act$
declare me public.igr_v4_players%rowtype; r public.igr_v4_rooms%rowtype;
 x igr_private.igr_v171_031_matches%rowtype; s public.igr_v4_players%rowtype;
 key_id text; choice text; offer jsonb; revision integer; accepted boolean; info text; piece jsonb;
begin
 select * into me from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token;
 if not found then raise exception 'unauthorized'; end if;
 select * into r from public.igr_v4_rooms where code=me.room_code for update;
 if r.scenario_id<>'031' or r.status<>'playing' then raise exception '031 unavailable'; end if;
 select * into x from igr_private.igr_v171_031_matches where room_code=r.code for update;
 if not found or x.decisions_locked then raise exception 'decisions closed'; end if;
 if p_action='testify' then
  if me.public_role<>'temoin' or r.cycle not between 1 and 3 then raise exception 'forbidden'; end if;
  if not x.witness_signed then
   update igr_private.igr_v171_031_matches set witness_signed=true where room_code=r.code;
   insert into public.igr_v4_events(room_code,event_type,visibility,audience_roles,payload,cycle)
   values(r.code,'trame','roles',array['enqueteur','analyste','procureur'],
   jsonb_build_object('title','TÉMOIGNAGE SIGNÉ','text',me.private_state->>'chronology','evidence_id','W01','match_no',x.match_no),r.cycle);
  end if;
  return jsonb_build_object('ok',true);
 end if;
 if r.cycle not between 2 and 3 or x.crisis_started_at is null then raise exception 'crisis not started'; end if;
 if p_action='vote' then
  if me.public_role not in ('enqueteur','analyste','procureur') then raise exception 'forbidden'; end if;
  choice:=p_payload->>'choice';
  if choice is null or (choice<>'refuse' and not exists(
   select 1 from public.igr_v4_players where room_code=r.code and id::text=choice and public_role in ('enqueteur','analyste','procureur')
  )) then raise exception 'invalid nominee'; end if;
  update igr_private.igr_v171_031_matches set ballots=jsonb_set(ballots,array[me.id::text],to_jsonb(choice),true) where room_code=r.code;
 elsif p_action='plan' then
  if me.public_role<>'enqueteur' then raise exception 'forbidden'; end if;
  if p_payload->>'assault_author' is null or not exists(select 1 from jsonb_array_elements(x.manuscript->'assault_options') a where a->>'id'=p_payload->>'assault_author') then raise exception 'identify the assault order'; end if;
  if p_payload->>'mode' not in ('wait','intervene') or p_payload->>'mode' is null then raise exception 'invalid plan'; end if;
  if p_payload->>'mode'='intervene' then
   if p_payload->>'location' is null or p_payload->>'approach' is null
   or not exists(select 1 from jsonb_array_elements(x.manuscript->'locations') a where a->>'id'=p_payload->>'location')
   or not exists(select 1 from jsonb_array_elements(x.manuscript->'approaches') a where a->>'id'=p_payload->>'approach')
   then raise exception 'invalid intervention'; end if;
   if p_payload->>'acknowledge_risk' is distinct from 'true' then raise exception 'confirm risk to hostages'; end if;
  end if;
  update igr_private.igr_v171_031_matches set plan=jsonb_build_object('mode',p_payload->>'mode',
   'location',p_payload->>'location','approach',p_payload->>'approach','assault_author',p_payload->>'assault_author') where room_code=r.code;
 elsif p_action='offer' then
  if me.public_role not in ('enqueteur','procureur') then raise exception 'forbidden'; end if;
  select * into s from public.igr_v4_players where room_code=r.code and id::text=p_payload->>'suspect_id' and public_role='suspect';
  if not found or p_payload->>'terms' is null or p_payload->>'terms' not in ('prison','release','protected_release') then raise exception 'invalid agreement'; end if;
  key_id:=s.id::text; offer:=x.offers->key_id;
  if offer->>'status'='accepted' then raise exception 'accepted agreement is binding'; end if;
  revision:=coalesce((offer->>'revision')::int,0)+1;
  offer:=jsonb_build_object('revision',revision,'terms',p_payload->>'terms','status','pending','offered_by',me.id::text);
  update igr_private.igr_v171_031_matches set offers=jsonb_set(offers,array[key_id],offer,true) where room_code=r.code;
 elsif p_action='respond' then
  if me.public_role<>'suspect' then raise exception 'forbidden'; end if;
  key_id:=me.id::text; offer:=x.offers->key_id;
  if offer->>'status' is distinct from 'pending' or offer->>'revision' is distinct from p_payload->>'revision' then raise exception 'agreement changed; refresh'; end if;
  if p_payload->>'accept' not in ('true','false') or p_payload->>'accept' is null then raise exception 'decision required'; end if;
  accepted:=(p_payload->>'accept')::boolean;
  if accepted and offer->>'terms'='release' and p_payload->>'acknowledge_risk' is distinct from 'true' then raise exception 'confirm unprotected release risk'; end if;
  offer:=offer||jsonb_build_object('status',case when accepted then 'accepted' else 'refused' end);
  update igr_private.igr_v171_031_matches set offers=jsonb_set(offers,array[key_id],offer,true) where room_code=r.code;
  if accepted then
   info:=x.manuscript->'suspects'->(me.internal_slot-1)->>'information';
   if length(info)<40 then raise exception 'deposition missing'; end if;
   insert into public.igr_v4_events(room_code,event_type,visibility,audience_roles,payload,cycle)
   values(r.code,'trame','roles',array['enqueteur','analyste','procureur'],
   jsonb_build_object('title','DÉPOSITION SIGNÉE — '||me.pseudo,'text',info,
   'evidence_id','S'||me.internal_slot,'match_no',x.match_no),r.cycle);
  end if;
 else raise exception 'invalid action'; end if;
 return jsonb_build_object('ok',true);
end $act$;
revoke all on function public.igr_v171_031_act(text,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.igr_v171_031_act(text,uuid,text,jsonb) to anon,service_role;

create or replace function igr_private.igr_v171_031_make_reveal(p_room text)
returns jsonb language plpgsql set search_path='' as $reveal$
declare r public.igr_v4_rooms%rowtype; x igr_private.igr_v171_031_matches%rowtype;
 p record; s record; it jsonb; out_results jsonb:='[]'; winners jsonb:='[]'; resp jsonb:='[]';
 enq uuid; levels jsonb; own_levels jsonb; own_exact integer; exact integer:=0; truth integer; guess integer;
 outcome text; fate text; ok boolean; result_text text; offer jsonb; nominee jsonb;
 client uuid; client_result jsonb; absent jsonb;
begin
 select * into r from public.igr_v4_rooms where code=p_room for update;
 select * into x from igr_private.igr_v171_031_matches where room_code=p_room;
 if not found then raise exception '031 snapshot missing'; end if;
 if not x.decisions_locked then raise exception '031 decisions not closed'; end if;
 if x.nominee is not null then outcome:=x.manuscript#>>'{resolution,handover}';
 elsif x.plan->>'mode'='intervene' and x.plan->>'location'=x.manuscript#>>'{canonical_truth,hostage_location}' then
  outcome:=case when x.plan->>'approach'=x.manuscript#>>'{canonical_truth,safe_approach}' then x.manuscript#>>'{resolution,located_safe}' else x.manuscript#>>'{resolution,located_unsafe}' end;
 else outcome:=x.manuscript#>>'{resolution,unreached}'; end if;
 select id into enq from public.igr_v4_players where room_code=p_room and public_role='enqueteur';
 select payload->'levels' into levels from public.igr_v4_actions where room_code=p_room and player_id=enq and action_type='final_lock' order by id desc limit 1;
 absent:=coalesce(r.state->'v59_absent','[]'::jsonb);
 for s in select * from public.igr_v4_players where room_code=p_room and public_role='suspect' order by internal_slot loop
  truth:=(x.manuscript#>>array['canonical_truth','levels',(s.internal_slot-1)::text])::int;
  guess:=coalesce((levels->>s.id::text)::int,-1);
  if truth=guess then exact:=exact+1; end if;
  resp:=resp||jsonb_build_array(jsonb_build_object('player_id',s.id,'pseudo',s.pseudo,'truth_level',truth,'enqueteur_level',guess));
  offer:=x.offers->s.id::text;
  if offer->>'status'='accepted' then
   fate:=case offer->>'terms' when 'protected_release' then 'released_protected' when 'release' then 'killed_after_release' else 'prison' end;
  else fate:=case when guess between 0 and 1 then 'released' else 'prison' end; end if;
  ok:=fate in ('released','released_protected') and not(absent ? s.id::text);
  result_text:=case fate
   when 'released_protected' then 'Ta déposition prévue a été livrée. Le bureau tient l’accord : tu sors vivant, sous protection, sans prison. La coopération n’efface pas les meurtres.'
   when 'killed_after_release' then 'Tu sors sans protection après une déposition signée. Identifié dans le dossier final, tu es rattrapé et tué par le cartel. Le risque était annoncé avant ton acceptation.'
   when 'released' then 'La décision officielle ne retient pas ta responsabilité principale. Sans déposition signée contre le cartel, tu quittes la Grey Room vivant et sans prison.'
   else 'Tu es envoyé en prison. Ton silence n’ajoute pas une preuve de meurtre, mais aucun accord de sortie rempli ne te protège de la décision.' end;
  out_results:=out_results||jsonb_build_array(jsonb_build_object('player_id',s.id,'pseudo',s.pseudo,'role','suspect','success',ok,
   'personal_objective_success',ok,'fate',fate,'text',result_text,'achievements','[]'::jsonb));
  if ok then winners:=winners||jsonb_build_array(s.id); end if;
 end loop;
 for p in select * from public.igr_v4_players where room_code=p_room and public_role<>'suspect' order by seat_index loop
  fate:='alive'; ok:=false; it:='{}';
  if p.public_role in ('enqueteur','analyste','procureur') then
   select payload->'levels' into own_levels from public.igr_v4_actions where room_code=p_room and player_id=p.id and action_type='final_lock' order by id desc limit 1;
   own_exact:=0;
   for s in select * from public.igr_v4_players where room_code=p_room and public_role='suspect' loop
    if coalesce((own_levels->>s.id::text)::int,-1)=(x.manuscript#>>array['canonical_truth','levels',(s.internal_slot-1)::text])::int then own_exact:=own_exact+1; end if;
   end loop;
   ok:=outcome='rescued' and own_exact=3 and x.plan->>'assault_author'=x.manuscript#>>'{canonical_truth,assault_author}';
   if p.id=x.nominee then fate:=coalesce(x.manuscript#>>array['resolution','delegate_fates',outcome],'alive'); end if;
   result_text:=own_exact||'/3 responsabilités exactes. Ordre de l’assaut : '||case when x.plan->>'assault_author'=x.manuscript#>>'{canonical_truth,assault_author}' then 'identifié. ' else 'non identifié. ' end||coalesce(x.manuscript#>>array['resolution','family_copy',outcome],'')
    ||case when p.id=x.nominee then coalesce(x.manuscript#>>array['resolution','delegate_copy',outcome],'') else '' end;
  elsif p.public_role='maitre' then
   select client_id into client from public.igr_v43_lawyer_representations where room_code=p_room and lawyer_id=p.id;
   select value into client_result from jsonb_array_elements(out_results) where value->>'player_id'=client::text;
   ok:=coalesce((client_result->>'success')::boolean,false);
   result_text:=case when client is null then 'Tu termines sans client officiel. Un renvoi décidé par le client ne déclenche pas la sanction contre ta famille.'
    when ok then 'Ton client quitte la Grey Room vivant et sans prison ; ton mandat est rempli.'
    else 'Ton client ne quitte pas la Grey Room vivant et sans prison : ton objectif échoue.' end;
   if coalesce((p.private_state->>'lawyer_cartel_forfeit')::boolean,false) then
    ok:=false; it:=jsonb_build_object('forfeited',true,'family_fate','killed');
    result_text:='Tu as volontairement abandonné le mandat du cartel. Ta défaite personnelle est définitive et le cartel a fait tuer ta famille. Reprendre le mandat ne supprime pas cette sanction.';
   end if;
  elsif p.public_role='temoin' then
   ok:=x.witness_signed;
   result_text:=case when ok then 'Tu as signé tes observations exactes. Elles ont pu être recoupées sans te donner connaissance du plan entier.'
    else 'Ton témoignage officiel n’a pas été transmis avant la clôture.' end;
  else result_text:='Rôle non prévu pour ce dossier.'; end if;
  if absent ? p.id::text then ok:=false; result_text:=result_text||' Joueur déclaré absent : objectif personnel non validé.'; end if;
  it:=it||jsonb_build_object('player_id',p.id,'pseudo',p.pseudo,'role',p.public_role,'success',ok,
   'personal_objective_success',ok,'fate',fate,'text',result_text,'achievements','[]'::jsonb);
  out_results:=out_results||jsonb_build_array(it);
  if ok then winners:=winners||jsonb_build_array(p.id); end if;
 end loop;
 select jsonb_build_object('id',id,'pseudo',pseudo) into nominee from public.igr_v4_players where id=x.nominee;
 return jsonb_build_object('variant_id',x.manuscript->>'variant','summary',(x.manuscript->>'final_reveal')||E'\n\n'||(x.manuscript->'endings'->>outcome),
 'responsibilities',resp,'results',out_results,'winners',winners,'winner_count',jsonb_array_length(winners),
 'accuracy',jsonb_build_object('exact',exact,'total',3),
 'camp_investigation',jsonb_build_object('exact',exact,'total',3,'success',exact=3 and outcome='rescued' and x.plan->>'assault_author'=x.manuscript#>>'{canonical_truth,assault_author}'),
 'crisis',jsonb_build_object('outcome',outcome,'hostages_fate',x.manuscript#>>array['resolution','family_fates',outcome],
 'nominee',nominee,'bureau_dissolved',coalesce((x.manuscript#>>array['resolution','dissolved',outcome])::boolean,false)));
end $reveal$;
revoke all on function igr_private.igr_v171_031_make_reveal(text) from public,anon,authenticated;

do $hooks$
declare d text; a text; b text;
begin
 foreach a in array array['public.igr_v4_make_reveal(text)','public.igr_v52_make_reveal(text)'] loop
  d:=pg_get_functiondef(a::regprocedure);
  if position('v171 031 ending' in d)=0 then
   b:=E'begin\n';
   if position(b in d)=0 then raise exception '031 reveal hook missing'; end if;
   execute replace(d,b,b||E'  -- v171 031 ending\n  if exists(select 1 from igr_private.igr_v171_031_matches where room_code=p_room) then\n    return igr_private.igr_v171_031_make_reveal(p_room);\n  end if;\n');
  end if;
 end loop;
 d:=pg_get_functiondef('public.igr_v4_emit_trame(text)'::regprocedure);
 a:='  if not found then return; end if;';
 if position('v171 031 scheduled evidence' in d)=0 then
  if position(a in d)=0 then raise exception '031 evidence hook missing'; end if;
  execute replace(d,a,a||E'\n  -- v171 031 scheduled evidence\n  if v_room.scenario_id=''031'' and exists(select 1 from igr_private.igr_v171_031_matches where room_code=p_room) then return; end if;');
 end if;
 d:=pg_get_functiondef('public.igr_v4_visible_events(text,public.igr_v4_players)'::regprocedure);
 a:='where e.room_code=p_room';
 if position('v171 031 match isolation' in d)=0 then
  if position(a in d)=0 then raise exception '031 visibility hook missing'; end if;
  execute replace(d,a,a||E'\n   -- v171 031 match isolation\n   and e.id>coalesce((select event_floor_id from igr_private.igr_v171_031_matches x where x.room_code=p_room),-1)');
 end if;
 d:=pg_get_functiondef('public.igr_v4_advance_phase(text,uuid)'::regprocedure);
 a:='elsif r.phase=''locking'' and r.scenario_id=''029'' and coalesce((r.state->>''cartel029_ready'')::boolean,false) then';
 if position('v171 final locks' in d)=0 then
  if position(a in d)=0 then raise exception '031 host finish hook missing'; end if;
  execute replace(d,a,E'-- v171 final locks\n  elsif r.phase=''locking'' and ((r.scenario_id=''029'' and coalesce((r.state->>''cartel029_ready'')::boolean,false)) or (r.scenario_id=''031'' and exists(select 1 from igr_private.igr_v171_031_matches where room_code=r.code))) then');
 end if;
 d:=pg_get_functiondef('public.igr_local_scenario_pack(text,uuid,text)'::regprocedure);
 a:='  return jsonb_build_object(''scenario_id'',p_scenario_id';
 if position('v171 entitled local canon' in d)=0 then
  if position(a in d)=0 then raise exception '031 local pack hook missing'; end if;
  b:=E'  -- v171 entitled local canon: reached only after profile and licence checks.\n  if p_scenario_id=''031'' then\n    select v_pack||jsonb_build_object(''context'',m.manuscript->>''public_context'',''suspects'',m.manuscript->''suspects'',\n    ''role_notes'',m.manuscript->''roles'',''witnesses'',jsonb_build_array(m.manuscript#>''{roles,temoin}''),''trames'',m.manuscript->''revelations'',\n    ''truth'',jsonb_build_object(''levels'',m.manuscript#>''{canonical_truth,levels}'',''summary'',m.manuscript->>''final_reveal''),''cartel031_canon'',m.manuscript)\n    into v_pack from igr_private.igr_v99_variant_manuscripts m where scenario_id=''031'' and variant_id=''A'' and editorial_status=''ready'';\n    if v_pack is null then raise exception ''031 unavailable''; end if;\n  end if;\n';
  execute replace(d,a,b||a);
 end if;
 -- The old optional prosecutor accord does not promise safe release. Prevent
 -- parallel/conflicting contracts in this dossier; all new offers are bilateral.
 d:=pg_get_functiondef('public.igr_v47_offer_cooperation(text,uuid,uuid,uuid,text)'::regprocedure);
 a:=' select * into s from public.igr_v4_players';
 if position('v171 use the binding agreement' in d)=0 then
  if position(a in d)=0 then raise exception '031 old cooperation hook missing'; end if;
  execute replace(d,a,E' -- v171 use the binding agreement\n if r.scenario_id=''031'' and exists(select 1 from igr_private.igr_v171_031_matches where room_code=r.code) then raise exception ''Utilise les accords du dossier 31.''; end if;\n'||a);
 end if;
end $hooks$;
-- Return-producing internal factories are never anonymous endpoints.
revoke all on function public.igr_v4_make_reveal(text) from public,anon,authenticated;
revoke all on function public.igr_v52_make_reveal(text) from public,anon,authenticated;
revoke all on function public.igr_v4_visible_events(text,public.igr_v4_players) from public,anon,authenticated;


do $local_variant$
declare d text;a text;
begin
 d:=pg_get_functiondef('public.igr_local_scenario_pack(text,uuid,text)'::regprocedure);
 a:='where scenario_id=''031'' and variant_id=''A'' and editorial_status=''ready'';';
 if position(a in d)>0 then
  execute replace(d,a,'where scenario_id=''031'' and editorial_status=''ready'' order by gen_random_uuid() limit 1;');
 elsif position('editorial_status=''ready'' order by gen_random_uuid() limit 1' in d)=0 then raise exception '031 local variant hook missing';
 end if;
end $local_variant$;
-- All fixtures are rolled back. Failures abort activation atomically.
do $qa$
declare variant text; n integer; seat integer; mode text; ending text; c text; host uuid; p record; other_actor record;
 lawyer public.igr_v4_players%rowtype; client public.igr_v4_players%rowtype; enq public.igr_v4_players%rowtype;
 x igr_private.igr_v171_031_matches%rowtype; response jsonb; result_item jsonb; levels jsonb;
 right_place text;wrong_place text;right_approach text;wrong_approach text;
 blocked boolean; starts integer:=0; ends integer:=0; cycle_no integer; expected integer; tmp jsonb;
begin
 begin
  foreach variant in array array['A'] loop
   update igr_private.igr_v99_variant_manuscripts set editorial_status=case when variant_id=variant then 'ready' else 'retired' end where scenario_id='031';
  foreach n in array array[6,7,8] loop
   foreach mode in array array['short','long'] loop
    foreach ending in array array['rescued','killed','captive','handover'] loop
     loop
      c:='ZD'||substr(translate(upper(md5(gen_random_uuid()::text)),'01','AB'),1,3);
      exit when not exists(select 1 from public.igr_v4_rooms where code=c);
     end loop;
     insert into public.igr_v4_rooms(code,scenario_id,state) values(c,'031',jsonb_build_object('duration_mode',mode)) returning host_token into host;
     for seat in 0..n-1 loop insert into public.igr_v4_players(room_code,pseudo,seat_index,is_host)
      values(c,'QA dette '||seat,seat,seat=0); end loop;
     perform public.igr_v4_start_game(c,host); starts:=starts+1;
     select * into x from igr_private.igr_v171_031_matches where room_code=c;
     right_place:=x.manuscript#>>'{canonical_truth,hostage_location}'; right_approach:=x.manuscript#>>'{canonical_truth,safe_approach}';
     select a->>'id' into wrong_place from jsonb_array_elements(x.manuscript->'locations') a where a->>'id'<>right_place limit 1;
     select a->>'id' into wrong_approach from jsonb_array_elements(x.manuscript->'approaches') a where a->>'id'<>right_approach limit 1;
     if x.manuscript->>'variant' is distinct from variant then raise exception '031 wrong pinned variant'; end if;
     if x.manuscript->>'version'<>'v171-cartel031-la-dette' then raise exception '031 start not pinned'; end if;
     select * into enq from public.igr_v4_players where room_code=c and public_role='enqueteur';
     select * into lawyer from public.igr_v4_players where room_code=c and public_role='maitre';
     select * into client from public.igr_v4_players where room_code=c and public_role='suspect' and internal_slot=3;
     if not exists(select 1 from public.igr_v43_lawyer_representations where room_code=c and lawyer_id=lawyer.id and client_id=client.id) then raise exception '031 lawyer not assigned to superior'; end if;
     if exists(select 1 from public.igr_v4_players where room_code=c and (private_state ? 'family_proof' or secret_role='espion')) then raise exception '031 premature proof or unintended mole'; end if;
     blocked:=false;
     begin perform public.igr_v171_031_state(c,gen_random_uuid()); exception when others then blocked:=true; end;
     if not blocked then raise exception '031 invalid token accepted'; end if;
     for cycle_no in 1..3 loop
      update public.igr_v4_rooms set cycle=cycle_no,phase='investigation_assembly',phase_ends_at=now()+interval '90 seconds' where code=c;
      expected:=(array[4,9,13])[cycle_no];
      if (select count(*) from public.igr_v4_events where room_code=c and payload->>'evidence_id' like 'D%')<>expected then raise exception '031 evidence timing mismatch'; end if;
      if cycle_no=1 then
       blocked:=false;
       begin perform public.igr_v171_031_act(c,enq.player_token,'vote',jsonb_build_object('choice','refuse'));
       exception when others then blocked:=true; end;
       if not blocked or exists(select 1 from public.igr_v4_events where room_code=c and event_type='cartel031_private_proof') then raise exception '031 crisis before C2'; end if;
      end if;
     end loop;
     if (select count(*) from public.igr_v4_events where room_code=c and event_type='cartel031_private_proof')<>(case when n=6 then 2 else 3 end) then raise exception '031 wrong private proof count'; end if;
     -- Repeated cycle/phase updates never duplicate evidence or life proofs.
     update public.igr_v4_rooms set cycle=3,phase_ends_at=now()+interval '90 seconds' where code=c;
     for p in select * from public.igr_v4_players where room_code=c loop
      response:=public.igr_v171_031_state(c,p.player_token);
      if response ? 'ballots' or response ? 'manuscript' or response ? 'canonical_truth' or response ? 'family_proofs' then raise exception '031 state leaks secrets'; end if;
      tmp:=public.igr_v4_sync(c,p.player_token);
      if exists(select 1 from jsonb_array_elements(tmp->'players') a where a ? 'private_state' or a ? 'player_token') then raise exception '031 roster leaks'; end if;
      if p.public_role in ('enqueteur','analyste','procureur') then
       if response->'proof' is null or response->'proof'='null'::jsonb then raise exception '031 bureau proof missing'; end if;
       if (select count(*) from jsonb_array_elements(tmp->'events') a where a->>'event_type'='cartel031_private_proof')<>1 then raise exception '031 private proof scope'; end if;
       perform public.igr_v171_031_act(c,p.player_token,'vote',jsonb_build_object('choice',case when ending='handover' then enq.id::text else 'refuse' end));
      else
       if response ? 'proof' or response ? 'crew' or response ? 'own_ballot' then raise exception '031 non-bureau sees private vote or proof'; end if;
       blocked:=false;
       begin perform public.igr_v171_031_act(c,p.player_token,'vote',jsonb_build_object('choice',enq.id::text)); exception when others then blocked:=true; end;
       if not blocked then raise exception '031 non-bureau can vote'; end if;
       if p.public_role='temoin' then perform public.igr_v171_031_act(c,p.player_token,'testify','{}'); end if;
      end if;
     end loop;
     blocked:=false;
     begin perform public.igr_v171_031_act(c,enq.player_token,'plan',jsonb_build_object('mode','intervene','location',right_place,'approach',wrong_approach,'assault_author',x.manuscript#>>'{canonical_truth,assault_author}'));
     exception when others then blocked:=true; end;
     if not blocked then raise exception '031 dangerous action without acknowledgement'; end if;
     perform public.igr_v171_031_act(c,enq.player_token,'plan',jsonb_build_object('mode','intervene',
      'location',case when ending='captive' then wrong_place else right_place end,
      'approach',case when ending='killed' then wrong_approach else right_approach end,'acknowledge_risk',true,
      'assault_author',x.manuscript#>>'{canonical_truth,assault_author}'));
     for p in select * from public.igr_v4_players where room_code=c and public_role='suspect' loop
      perform public.igr_v171_031_act(c,enq.player_token,'offer',jsonb_build_object('suspect_id',p.id::text,
       'terms',case p.internal_slot when 1 then 'release' when 2 then 'prison' else 'protected_release' end));
      blocked:=false;
      begin perform public.igr_v171_031_act(c,p.player_token,'respond',jsonb_build_object('revision',0,'accept',true));
      exception when others then blocked:=true; end;
      if not blocked then raise exception '031 stale offer accepted'; end if;
      if p.internal_slot=1 then
       blocked:=false;
       begin perform public.igr_v171_031_act(c,p.player_token,'respond',jsonb_build_object('revision',1,'accept',true));
       exception when others then blocked:=true; end;
       if not blocked then raise exception '031 unsafe release missing acknowledgement'; end if;
      end if;
      perform public.igr_v171_031_act(c,p.player_token,'respond',jsonb_build_object('revision',1,'accept',true,'acknowledge_risk',true));
      blocked:=false;
      begin perform public.igr_v171_031_act(c,enq.player_token,'offer',jsonb_build_object('suspect_id',p.id::text,'terms','prison'));
      exception when others then blocked:=true; end;
      if not blocked then raise exception '031 accepted pledge broken'; end if;
     end loop;
     if ending='handover' then
      perform public.igr_v170_end_representation(c,lawyer.player_token,client.id,true);
      perform public.igr_v43_request_lawyer(c,client.player_token);
      perform public.igr_v43_accept_lawyer(c,lawyer.player_token,client.id);
     end if;
     update public.igr_v4_rooms set phase='locking',phase_ends_at=null,
      state=state||jsonb_build_object('v52_final_reassessment',true) where code=c;
     blocked:=false;
     begin perform public.igr_v171_031_act(c,enq.player_token,'vote',jsonb_build_object('choice','refuse'));
     exception when others then blocked:=true; end;
     if not blocked then raise exception '031 frozen vote changed'; end if;
     select jsonb_object_agg(id::text,2) into levels from public.igr_v4_players where room_code=c and public_role='suspect';
     for p in select * from public.igr_v4_players where room_code=c and public_role in ('enqueteur','analyste','procureur') loop
      insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload) values(c,p.id,3,'final_lock',jsonb_build_object('levels',levels));
     end loop;
     response:=public.igr_v52_maybe_finish(c);
     if response->>'finished' is distinct from 'true' then raise exception '031 normal finish blocked'; end if;
     select payload into response from public.igr_v4_events where room_code=c and event_type='reveal' order by id desc limit 1;
     if response#>>'{crisis,outcome}' is distinct from ending then raise exception '031 ending mismatch %',ending; end if;
     if response ? 'ballots' or response::text like '%"own_ballot"%' then raise exception '031 ballot revealed at ending'; end if;
     for p in select * from public.igr_v4_players where room_code=c and public_role='suspect' loop
      select value into result_item from jsonb_array_elements(response->'results') a where a->>'player_id'=p.id::text;
      if (result_item->>'success')::boolean is distinct from (p.internal_slot=3) then raise exception '031 suspect goal mismatch'; end if;
     end loop;
     select value into result_item from jsonb_array_elements(response->'results') a where a->>'player_id'=lawyer.id::text;
     if ending='handover' then
      if result_item->>'forfeited' is distinct from 'true' or result_item->>'family_fate' is distinct from 'killed' or result_item->>'success' is distinct from 'false' then raise exception '031 lawyer penalty missing'; end if;
     elsif result_item->>'success' is distinct from 'true' then raise exception '031 lawyer client goal mismatch'; end if;
     ends:=ends+1;
     -- A new match must clear both the crisis and the lawyer's permanent
     -- previous-match sanction, while hiding all old evidence and votes.
     update public.igr_v4_rooms set status='lobby',state=jsonb_build_object('match_no',2,'duration_mode',mode) where code=c;
     perform public.igr_v4_start_game(c,host); starts:=starts+1;
     select * into x from igr_private.igr_v171_031_matches where room_code=c;
     if x.ballots<>'{}'::jsonb or x.offers<>'{}'::jsonb or x.decisions_locked or x.crisis_started_at is not null then raise exception '031 rematch stale choices'; end if;
     for p in select * from public.igr_v4_players where room_code=c loop
      tmp:=public.igr_v4_sync(c,p.player_token);
      if exists(select 1 from jsonb_array_elements(tmp->'events') a where a->>'event_type' in ('reveal','trame','cartel031_private_proof','cartel031_demand'))
       or p.private_state ? 'lawyer_cartel_forfeit' or p.private_state ? 'family_proof' then raise exception '031 rematch leaks previous story'; end if;
     end loop;
    end loop;
   end loop;
  end loop;
  end loop;
  if has_table_privilege('anon','igr_private.igr_v171_031_matches','select')
   or has_function_privilege('anon','igr_private.igr_v171_031_make_reveal(text)','execute')
   or has_function_privilege('anon','public.igr_v4_make_reveal(text)','execute') then raise exception '031 internal access exposed'; end if;
  raise exception using errcode='ZX171',message='rollback 031 QA fixtures';
 exception when sqlstate 'ZX171' then null;
 end;
 if starts<>48 or ends<>24 then raise exception '031 incomplete QA %/%',starts,ends; end if;
 raise notice '031 variant A verified: 48 starts/rematches, 24 endings, 6/7/8 players, both durations, private votes/proofs and binding agreements. All fixtures rolled back.';
end $qa$;
