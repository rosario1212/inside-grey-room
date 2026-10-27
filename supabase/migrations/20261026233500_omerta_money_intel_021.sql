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
  cards_out jsonb;
  catalog jsonb;
  match_id int;
  authored jsonb;
  headings text[];
begin
  select * into p from public.igr_v4_players
  where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found then raise exception 'unauthorized'; end if;
  select * into r from public.igr_v4_rooms where code=p.room_code;

  if not found or r.scenario_id not in ('021','022','023','024','025') or r.status<>'playing' or r.cycle<2
     or r.phase in ('briefing','provisional_lock','final_debrief','locking','reveal')
     or p.public_role<>'suspect'
     or coalesce((r.state->'omerta'->'dead') ? p.id::text,false)
  then
    return jsonb_build_object('available',false,'cards','[]'::jsonb);
  end if;

  -- Les fiches Verri historiques ne peuvent servir de renseignement
  -- pour une branche Santoro A/B/C. Refuser au niveau du serveur avant
  -- toute présentation ou consignation.
  if coalesce((r.state->>'omerta_standalone')::boolean,false) then
    return jsonb_build_object('available',false,'cards','[]'::jsonb);
  end if;
  match_id:=greatest(1,coalesce((r.state->>'match_no')::int,1));
  -- L'onglet n'existe qu'après acceptation d'une offre authentifiée par le serveur.
  if not exists(
    select 1 from public.igr_v4_actions a
    where a.room_code=r.code and a.player_id=p.id
      and a.action_type='omerta_indic_response'
      and a.payload->>'accepted'='true'
      and coalesce((a.payload->>'match_no')::int,1)=match_id
  ) then
    return jsonb_build_object('available',false,'cards','[]'::jsonb);
  end if;

  -- Trois sujets distincts fondés sur la fiche réellement assignée au joueur.
  -- Seule la première carte donne une information financière cachée majeure.
  if r.scenario_id<>'021' then
    -- Dossiers 022–025 : trois sujets, strictement tirés des cartes privées
    -- du canon actif, sans révélation fabriquée ni fuite d'une variante secrète.
    select x.pack->'suspects'->(p.internal_slot-1) into authored
    from public.igr_v4_scenario_packs x where x.scenario_id=r.scenario_id;
    if authored is null
      or coalesce(authored->>'hide','')='' or coalesce(authored->>'chronology','')=''
      or jsonb_array_length(coalesce(authored->'anchors','[]'::jsonb))=0
      or coalesce(authored->>'hide','')<>coalesce(p.private_state->>'hide','')
      or coalesce(authored->>'chronology','')<>coalesce(p.private_state->>'chronology','')
    then return jsonb_build_object('available',false,'cards','[]'::jsonb); end if;
    catalog:=jsonb_build_array(
      jsonb_build_object('id',r.scenario_id||'_'||p.internal_slot||'_secret',
        'title',coalesce(nullif(authored->'negotiable_facts'->>0,''),'Ce que je sais'),
        'detail',authored->>'hide','novelty','unassessed'),
      jsonb_build_object('id',r.scenario_id||'_'||p.internal_slot||'_chronology',
        'title',coalesce(nullif(authored->'negotiable_facts'->>1,''),'La chronologie'),
        'detail',authored->>'chronology','novelty','unassessed'),
      jsonb_build_object('id',r.scenario_id||'_'||p.internal_slot||'_anchor',
        'title','Un fait établi',
        'detail',authored->'anchors'->>0,'novelty','already_documented')
    );
  elsif p.internal_slot=1 and position('rinaldi' in lower(coalesce(p.private_state->>'hide','')))>0 then
    select x.pack->'suspects'->0->>'hide' into pack_secret
      from public.igr_v4_scenario_packs x where x.scenario_id='021';
    if position('rinaldi' in lower(coalesce(pack_secret,'')))=0
    then return jsonb_build_object('available',false,'cards','[]'::jsonb); end if;
    catalog:=jsonb_build_array(
      jsonb_build_object('id','021_money_route','title','Les transferts d’argent',
        'detail','Une partie de l’argent de l’enveloppe devait remonter au cercle de Rinaldi.',
        'novelty','potentially_new'),
      jsonb_build_object('id','021_handoff','title','La remise de l’enveloppe',
        'detail','Paolo a remis l’enveloppe à un intermédiaire avant 22 heures.',
        'novelty','potentially_new'),
      jsonb_build_object('id','021_detour','title','Le détour de 21 h 22',
        'detail','Paolo n’était plus sur l’itinéraire prévu à 21 h 22.',
        'novelty','already_documented')
    );
  elsif p.internal_slot=7 and position('somme supplémentaire' in lower(coalesce(p.private_state->>'hide','')))>0 then
    select x.pack->'suspects'->6->>'hide' into pack_secret
      from public.igr_v4_scenario_packs x where x.scenario_id='021';
    if position('somme supplémentaire' in lower(coalesce(pack_secret,'')))=0
    then return jsonb_build_object('available',false,'cards','[]'::jsonb); end if;
    catalog:=jsonb_build_array(
      jsonb_build_object('id','021_money_ledger','title','Les transferts d’argent',
        'detail','Les comptes révèlent une somme supplémentaire absente des registres du groupe.',
        'novelty','potentially_new'),
      jsonb_build_object('id','021_money_preparation','title','La préparation des montants',
        'detail','Salvatore a préparé les montants plus tôt dans la journée.',
        'novelty','already_documented'),
      jsonb_build_object('id','021_money_records','title','Les écritures comptables',
        'detail','Les écritures comptables de Salvatore existent.',
        'novelty','already_documented')
    );
  elsif p.internal_slot between 2 and 6 then
    -- Les autres suspects peuvent aussi devenir Indic. Leurs trois sujets
    -- reprennent strictement des éléments déjà écrits dans leur fiche privée.
    -- Une suspicion ne devient jamais une preuve par la seule consignation.
    select x.pack->'suspects'->(p.internal_slot-1) into authored
    from public.igr_v4_scenario_packs x where x.scenario_id='021';
    if authored is null
     or coalesce(authored->>'hide','')<>coalesce(p.private_state->>'hide','')
     or coalesce(authored->>'chronology','')<>coalesce(p.private_state->>'chronology','')
    then return jsonb_build_object('available',false,'cards','[]'::jsonb);end if;
    headings:=case p.internal_slot
      when 2 then array['Les ordres du Caporegime','La disparition de l’enveloppe','Les pressions sur le groupe']
      when 3 then array['La somme dissimulée','La rencontre avec Rinaldi','Le paiement préparé']
      when 4 then array['Le paiement exceptionnel','Les appels de la soirée','Le dîner des Verri']
      when 5 then array['La confidence de Paolo','La rencontre avec Paolo','Sa place dans la Famiglia']
      else array['L’escorte écartée','Le changement de mission','L’itinéraire du transport'] end;
    catalog:=jsonb_build_array(
      jsonb_build_object('id','021_person_'||p.internal_slot||'_secret','title',headings[1],
        'detail',authored->>'hide','novelty','unassessed'),
      jsonb_build_object('id','021_person_'||p.internal_slot||'_chronology','title',headings[2],
        'detail',authored->>'chronology','novelty','unassessed'),
      jsonb_build_object('id','021_person_'||p.internal_slot||'_anchor','title',headings[3],
        'detail',authored->'anchors'->>0,'novelty','already_documented')
    );
  else
    return jsonb_build_object('available',false,'cards','[]'::jsonb);
  end if;

  -- Barème autoritatif et déterministe du renseignement, hors du client.
  -- Seuls les faits matériels ou déclarations de première main relus et
  -- pertinents pour le dossier sont éligibles. Les soupçons seuls ne le sont pas.
  -- 024/2, 024/4, 024/6 n'ont aucune information admissible dans ce canon :
  -- leur pacte est interdit AVANT recrutement par le serveur.
  select coalesce(jsonb_agg(
    c.value || jsonb_build_object(
       'eligible',
         case
           when r.scenario_id='021' then
             (p.internal_slot=1 and c.value->>'id' in ('021_money_route','021_handoff'))
             or (p.internal_slot=7 and c.value->>'id'='021_money_ledger')
             or (p.internal_slot between 2 and 5
               and c.value->>'id'='021_person_'||p.internal_slot||'_secret')
             or (p.internal_slot=6
               and c.value->>'id'='021_person_6_chronology')
           when r.scenario_id='023' and p.internal_slot=4 then
             c.value->>'id'='023_4_chronology'
           when r.scenario_id='024' and p.internal_slot in (2,4,6) then false
           when r.scenario_id between '022' and '025' then
             c.value->>'id'=r.scenario_id||'_'||p.internal_slot||'_secret'
           else false
         end
      ) order by c.ordinality),'[]'::jsonb)
    into catalog
    from jsonb_array_elements(catalog) with ordinality c(value,ordinality);

  -- L'Indic conserve toujours ses trois cartes affichées ; une carte déjà
  -- transmise passe à l'état « consigné » au lieu de disparaître.
  select coalesce(jsonb_agg(
      c.value||jsonb_build_object('logged',exists(
        select 1 from public.igr_v4_actions a
        where a.room_code=r.code and a.action_type='omerta_verified_intel'
          and coalesce((a.payload->>'match_no')::int,1)=match_id
          and a.payload->>'fact_id'=c.value->>'id'
      )) order by c.ordinality),'[]'::jsonb)
  into cards_out
  from jsonb_array_elements(catalog) with ordinality c(value,ordinality);
  return jsonb_build_object('available',true,
    'cards',cards_out,'total_cards',3);
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
  match_id int;
begin
  select * into p from public.igr_v4_players
  where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found then raise exception 'unauthorized'; end if;

  -- Verrou de salle : sérialise la consommation du renseignement et le quota par cycle.
  select * into r from public.igr_v4_rooms where code=p.room_code for update;
  if not found or r.status<>'playing' or r.scenario_id not in ('021','022','023','024','025') or r.cycle<2 then
    raise exception 'intel_unavailable';
  end if;
  perform igr_private.rate_limit('omerta_money_intel_send',p.id::text,10,60);
  match_id:=greatest(1,coalesce((r.state->>'match_no')::int,1));
  if not exists(
    select 1 from public.igr_v4_actions a
    where a.room_code=r.code and a.player_id=p.id and a.action_type='omerta_indic_response'
      and a.payload->>'accepted'='true'
      and coalesce((a.payload->>'match_no')::int,1)=match_id
  ) then raise exception 'indic_not_recruited'; end if;

  if coalesce((r.state->>'omerta_standalone')::boolean,false)
    then raise exception 'standalone_intel_facts_unapproved'; end if;
  options:=public.igr_omerta_money_intel_options(p_code,p_player_token);
  select value into chosen
  from jsonb_array_elements(coalesce(options->'cards','[]'::jsonb))
  where value->>'id'=p_card_id and coalesce((value->>'logged')::boolean,false)=false limit 1;
  if chosen is null then raise exception 'intel_not_owned_or_unavailable'; end if;

  if exists(
    select 1 from public.igr_v4_actions a
    where a.room_code=r.code and a.player_id=p.id and a.cycle=r.cycle
      and a.action_type='omerta_verified_intel'
      and coalesce((a.payload->>'match_no')::int,1)=greatest(1,coalesce((r.state->>'match_no')::int,1))
  ) then raise exception 'one_intel_per_cycle'; end if;

  if exists(
    select 1 from public.igr_v4_actions a
    where a.room_code=r.code and a.action_type='omerta_verified_intel'
      and coalesce((a.payload->>'match_no')::int,1)=greatest(1,coalesce((r.state->>'match_no')::int,1))
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
           'canonically_authored',true,'truth_verified',
           coalesce((chosen->>'eligible')::boolean,false),
           'first_official_delivery',true,
           'match_no',greatest(1,coalesce((r.state->>'match_no')::int,1)),
           'scenario_id',r.scenario_id,'topic_title',chosen->>'title',
           'novelty',chosen->>'novelty'))
  returning id into action_id;

  -- Seul l'Enquêteur peut lire le contenu, via le filtrage privé des événements.
  insert into public.igr_v4_events(room_code,cycle,event_type,visibility,target_player_id,payload)
  values(r.code,r.cycle,'omerta_intel','private',receiver.id,
         jsonb_build_object('title','RENSEIGNEMENT D’UN INDIC',
           'text',chosen->>'detail','category','source_confidentielle',
           'fact_id',p_card_id,'action_id',action_id));
  insert into public.igr_v4_events(room_code,cycle,event_type,visibility,target_player_id,payload)
  values(r.code,r.cycle,'omerta_private','private',p.id,
         jsonb_build_object('title','TRANSMISSION CONFIRMÉE',
           'text','L’Enquêteur a reçu ton renseignement. La transmission reste confidentielle.'));
  return jsonb_build_object('ok',true,'action_id',action_id,
    'canonically_authored',true,'first_official_delivery',true);
end;
$$;

-- Par défaut PostgreSQL autorise EXECUTE à PUBLIC : le retirer explicitement.
revoke all on function public.igr_omerta_money_intel_options(text,uuid) from public;
revoke all on function public.igr_omerta_money_intel_send(text,uuid,text) from public;
grant execute on function public.igr_omerta_money_intel_options(text,uuid) to anon,authenticated;
grant execute on function public.igr_omerta_money_intel_send(text,uuid,text) to anon,authenticated;

-- Signal anticipé purement facultatif : « Je souhaite en parler ».
-- Jamais comptabilisé comme coopération réelle ; aucun détail secret n'est transmis.
create or replace function public.igr_omerta_money_intel_signal(
 p_code text, p_player_token uuid, p_card_id text
) returns jsonb language plpgsql security definer set search_path=''
as $$
declare
 p public.igr_v4_players%rowtype;
 r public.igr_v4_rooms%rowtype;
 receiver public.igr_v4_players%rowtype;
 chosen jsonb;
 opts jsonb;
 match_id int;
begin
 select * into p from public.igr_v4_players
 where room_code=upper(trim(p_code)) and player_token=p_player_token;
 if not found then raise exception 'unauthorized'; end if;
 select * into r from public.igr_v4_rooms where code=p.room_code for update;
 if r.scenario_id not in ('021','022','023','024','025') or r.status<>'playing' or r.cycle<2 then raise exception 'intel_unavailable'; end if;
 perform igr_private.rate_limit('omerta_money_intel_signal',p.id::text,10,60);
 if coalesce((r.state->>'omerta_standalone')::boolean,false)
 then raise exception 'standalone_intel_facts_unapproved'; end if;
 opts:=public.igr_omerta_money_intel_options(p_code,p_player_token);
 select value into chosen from jsonb_array_elements(coalesce(opts->'cards','[]'::jsonb))
  where value->>'id'=p_card_id limit 1;
 if chosen is null then raise exception 'intel_not_owned_or_unavailable'; end if;
 match_id:=greatest(1,coalesce((r.state->>'match_no')::int,1));
 if exists(select 1 from public.igr_v4_actions a where a.room_code=r.code
   and a.player_id=p.id and a.cycle=r.cycle and a.action_type='omerta_intel_intent'
   and coalesce((a.payload->>'match_no')::int,1)=match_id
   and a.payload->>'fact_id'=p_card_id)
 then return jsonb_build_object('ok',true,'already',true,'status','intent_only'); end if;
 select * into receiver from public.igr_v4_players
 where room_code=r.code and public_role='enqueteur' order by seat_index limit 1;
 if not found then raise exception 'investigator_not_found'; end if;
 insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
 values(r.code,p.id,r.cycle,'omerta_intel_intent',jsonb_build_object(
  'fact_id',p_card_id,'match_no',match_id,'counts_for_cooperation',false));
 insert into public.igr_v4_events(room_code,cycle,event_type,visibility,target_player_id,payload)
 values(r.code,r.cycle,'omerta_intel_intent','private',receiver.id,jsonb_build_object(
 'title','UNE SOURCE SOUHAITE PARLER',
 'text',p.pseudo||' souhaite vous parler de : '||(chosen->>'title')||'.',
 'fact_id',p_card_id,'match_no',match_id));
 return jsonb_build_object('ok',true,'status','intent_only','counts_for_cooperation',false);
end $$;

revoke all on function public.igr_omerta_money_intel_signal(text,uuid,text) from public;
grant execute on function public.igr_omerta_money_intel_signal(text,uuid,text) to anon,authenticated;
