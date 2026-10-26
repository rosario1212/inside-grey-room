-- OMERTÀ 021 · carte de renseignement « Les transferts d’argent »
-- Pilote additif : n'altère pas les révélations génériques ni les gagnants existants.
-- Vérité serveur : emplacement 1 (Paolo, circuit Rinaldi) ou 7 (Salvatore, somme hors registre).
-- Les échanges oraux restent libres. Le bouton certifie uniquement le transfert formel.

create or replace function public.igr_omerta_money_intel_options(
  p_code text, p_player_token uuid
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  p public.igr_v4_players%rowtype;
  r public.igr_v4_rooms%rowtype;
  key text;
  detail text;
  pack_secret text;
  already_sent boolean;
begin
  select * into p from public.igr_v4_players
  where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found then raise exception 'unauthorized'; end if;
  select * into r from public.igr_v4_rooms where code=p.room_code;

  if not found or r.scenario_id<>'021' or r.status<>'playing' or r.cycle<2
     or r.phase in ('briefing','provisional_lock','final_debrief','locking','reveal')
     or p.public_role<>'suspect'
     or coalesce((r.state->'omerta'->'dead') ? p.id::text,false)
  then
    return jsonb_build_object('available',false,'cards','[]'::jsonb);
  end if;

  -- Une carte dépend strictement des connaissances du personnage attribuées au début.
  if p.internal_slot=1
     and position('rinaldi' in lower(coalesce(p.private_state->>'hide',''))) > 0
  then
    key:='021_money_route';
    detail:='Une partie de l’argent de l’enveloppe devait remonter au cercle de Rinaldi.';
  elsif p.internal_slot=7
     and position('somme supplémentaire' in lower(coalesce(p.private_state->>'hide',''))) > 0
  then
    key:='021_money_ledger';
    detail:='Les comptes révèlent une somme supplémentaire absente des registres du groupe.';
  else
    return jsonb_build_object('available',false,'cards','[]'::jsonb);
  end if;

  -- Les deux versions sont ancrées dans le dossier serveur, pas dans du texte client.
  select case when p.internal_slot=1 then x.pack->'suspects'->0->>'hide'
              when p.internal_slot=7 then x.pack->'suspects'->6->>'hide' end
    into pack_secret
  from public.igr_v4_scenario_packs x where x.scenario_id='021';
  if pack_secret is null or
     (p.internal_slot=1 and position('rinaldi' in lower(pack_secret))=0) or
     (p.internal_slot=7 and position('somme supplémentaire' in lower(pack_secret))=0)
  then
    return jsonb_build_object('available',false,'cards','[]'::jsonb);
  end if;

  select exists(
    select 1 from public.igr_v4_actions a
    where a.room_code=r.code and a.action_type='omerta_verified_intel'
      and a.payload->>'fact_id'=key
  ) into already_sent;

  return jsonb_build_object(
    'available',not already_sent, 'already_sent',already_sent,
    'cards',case when already_sent then '[]'::jsonb else jsonb_build_array(
      jsonb_build_object('id',key,'title','Les transferts d’argent',
        'detail',detail,'warning','Le renseignement sera transmis à l’Enquêteur et pourra exposer ta coopération.')
    ) end
  );
end;
$$;

create or replace function public.igr_omerta_money_intel_send(
  p_code text, p_player_token uuid, p_card_id text
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  p public.igr_v4_players%rowtype;
  r public.igr_v4_rooms%rowtype;
  options jsonb;
  chosen jsonb;
  receiver public.igr_v4_players%rowtype;
  action_id bigint;
begin
  select * into p from public.igr_v4_players
  where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found then raise exception 'unauthorized'; end if;

  -- Verrou de salle : sérialise la consommation du renseignement et le quota par cycle.
  select * into r from public.igr_v4_rooms where code=p.room_code for update;
  if not found or r.status<>'playing' or r.scenario_id<>'021' or r.cycle<2 then
    raise exception 'intel_unavailable';
  end if;
  perform igr_private.rate_limit('omerta_money_intel_send',p.id::text,10,60);

  options:=public.igr_omerta_money_intel_options(p_code,p_player_token);
  select value into chosen
  from jsonb_array_elements(coalesce(options->'cards','[]'::jsonb))
  where value->>'id'=p_card_id limit 1;
  if chosen is null then raise exception 'intel_not_owned_or_unavailable'; end if;

  if exists(
    select 1 from public.igr_v4_actions a
    where a.room_code=r.code and a.player_id=p.id and a.cycle=r.cycle
      and a.action_type='omerta_verified_intel'
  ) then raise exception 'one_intel_per_cycle'; end if;

  if exists(
    select 1 from public.igr_v4_actions a
    where a.room_code=r.code and a.action_type='omerta_verified_intel'
      and a.payload->>'fact_id'=p_card_id
  ) then raise exception 'intel_already_received'; end if;

  select * into receiver from public.igr_v4_players
  where room_code=r.code and public_role='enqueteur'
  order by seat_index limit 1;
  if not found then raise exception 'investigator_not_found'; end if;

  -- Ne pas stocker le texte secret dans my_actions : juste la provenance authentifiée.
  insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
  values(r.code,p.id,r.cycle,'omerta_verified_intel',
         jsonb_build_object('fact_id',p_card_id,'receiver_id',receiver.id,
           'truth_verified',true,'new_to_investigator',true,'scenario_id','021'))
  returning id into action_id;

  -- Seul l'Enquêteur peut lire le contenu, via le filtrage privé des événements.
  insert into public.igr_v4_events(room_code,cycle,event_type,visibility,target_player_id,payload)
  values(r.code,r.cycle,'omerta_intel','private',receiver.id,
         jsonb_build_object('title','RENSEIGNEMENT D’UN INDIC',
           'text',chosen->>'detail','category','transferts_argent',
           'fact_id',p_card_id,'action_id',action_id));
  insert into public.igr_v4_events(room_code,cycle,event_type,visibility,target_player_id,payload)
  values(r.code,r.cycle,'omerta_private','private',p.id,
         jsonb_build_object('title','TRANSMISSION CONFIRMÉE',
           'text','L’Enquêteur a reçu le renseignement sur les transferts d’argent. La transmission reste confidentielle.'));
  return jsonb_build_object('ok',true,'action_id',action_id,
    'truth_verified',true,'new_to_investigator',true);
end;
$$;

-- Par défaut PostgreSQL autorise EXECUTE à PUBLIC : le retirer explicitement.
revoke all on function public.igr_omerta_money_intel_options(text,uuid) from public;
revoke all on function public.igr_omerta_money_intel_send(text,uuid,text) from public;
grant execute on function public.igr_omerta_money_intel_options(text,uuid) to anon,authenticated;
grant execute on function public.igr_omerta_money_intel_send(text,uuid,text) to anon,authenticated;
