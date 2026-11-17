-- v771: dynamic public dossier progress and two-investigator release.
-- Private role cards and canonical scenario truths are never exposed.

CREATE OR REPLACE FUNCTION igr_private.igr_v771_cycle_public_notice()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_checks integer := 0;
  v_findings integer := 0;
  v_axis text;
  v_text text;
  v_match text;
begin
  if new.status <> 'playing' or new.cycle not between 2 and 3
     or old.cycle is not distinct from new.cycle then
    return new;
  end if;
  v_match := coalesce(new.state->>'match_no','1');
  if exists(
    select 1 from public.igr_v4_events e
    where e.room_code=new.code and e.event_type='public_notice'
      and e.payload->>'notice_kind'='cycle_public_summary_v771'
      and e.payload->>'match_no'=v_match and e.cycle=new.cycle
  ) then return new; end if;

  select count(*)::integer into v_checks
  from public.igr_v4_actions a where a.room_code=new.code and a.cycle=old.cycle
    and (a.action_type in ('field','expert','judge')
         or left(a.action_type,14)='investigation_');
  select count(*)::integer into v_findings
  from public.igr_v4_events e where e.room_code=new.code and e.cycle=old.cycle
    and e.event_type in ('trame','field','expert','judge','field_result','expert_result');

  v_axis := case new.scenario_id
    when '001' then 'les horaires, accès et déplacements autour de la chambre 222'
    when '002' then 'les demandes d’aide, les informations reçues et les possibilités de réaction'
    when '003' then 'la chaîne d’accès au matériel et la circulation des alertes'
    when '004' then 'la chronologie des appels et ce que chaque proche savait à ce moment'
    when '005' then 'les accès à la scène et la différence entre imitation et responsabilité'
    when '006' then 'la dispute, la chute et les décisions prises après le drame'
    when '007' then 'les intérêts liés au testament, aux dettes et aux relations familiales'
    when '008' then 'les horaires et les contradictions vérifiables entre témoignages'
    when '009' then 'le retrait du consentement, les décisions et la tenue des dossiers'
    when '010' then 'l’accès au mur, la séquence des gestes et l’heure de 13 h 54'
    when '011' then 'la chaîne d’ordres et les actes réellement exécutés'
    when '012' then 'les décisions de rétention et les possibilités de sortie'
    when '013' then 'les accès, la préparation et l’exécution de l’attaque'
    when '014' then 'l’extraction, la circulation et la modification des documents'
    when '015' then 'les alertes, les signatures et les modifications de notes'
    when '016' then 'la chronologie entre la captation vidéo et les faits hors champ'
    when '017' then 'les décisions de séquestration, le paiement et les menaces'
    when '018' then 'la distinction entre la mort et la mise en scène du corps'
    when '019' then 'les accès au gala et les intérêts autour du dossier financier'
    when '020' then 'l’origine du feu, les issues et les décisions d’évacuation'
    when '021' then 'les mouvements de l’enveloppe et les déclarations contradictoires'
    when '022' then 'les faits du meurtre et les intérêts des différents membres'
    when '023' then 'les négociations, les absences et les informations circulant entre familles'
    when '024' then 'les déclarations, les contreparties et leur vérification indépendante'
    when '025' then 'les ordres effectivement donnés et les initiatives individuelles'
    when '026' then 'les registres, les disparitions et les responsabilités attribuables'
    when '027' then 'les lieux, les otages et la fiabilité des récits disponibles'
    when '028' then 'les autorisations, les communications et les vérifications indépendantes'
    when '029' then 'les récits des rescapés et les faits vérifiables de captivité'
    when '030' then 'la chronologie du massacre et les traces du registre disparu'
    when '031' then 'l’embuscade et les éléments qui relient les actes aux décisions'
    when '032' then 'les archives, les ordres et les actes matériellement documentés'
    when '033' then 'la répartition réelle du pouvoir au-delà des liens familiaux'
    when '034' then 'les surnoms, les fonctions et leur évolution entre opérations'
    when '035' then 'les documents d’identité et les accès vérifiables'
    when '036' then 'les preuves de l’attaque et les mouvements pendant la crise'
    when '037' then 'les sources indépendantes et la fiabilité du témoignage'
    when '038' then 'les relais, les institutions et la chaîne de décision'
    when '039' then 'la chaîne humaine, les sources et leurs degrés de confiance'
    when '040' then 'les alliances, la chronologie du décès et la coopération proposée'
    when '041' then 'les dettes, les promesses et les actes qui les relient'
    when '042' then 'les instructions, les intermédiaires et les décisions autonomes'
    when '043' then 'les obligations anciennes et les décisions prises en leur nom'
    when '044' then 'les responsabilités vérifiables et les dettes qui relient les acteurs'
    else 'les déclarations confrontées aux éléments vérifiés'
  end;
  v_text := format(
    'Cycle %s terminé : %s vérification(s) enregistrée(s), %s élément(s) de procédure communiqué(s) au camp Enquête. Ces chiffres ne prouvent aucune culpabilité. Pour la suite, confrontez %s. Le contenu réservé aux enquêteurs reste confidentiel.',
    old.cycle, v_checks, v_findings, v_axis
  );
  insert into public.igr_v4_events(room_code,event_type,visibility,cycle,payload)
  values(new.code,'public_notice','public',new.cycle,
    jsonb_build_object('title','Bilan public · cycle '||old.cycle,
      'text',v_text,'notice_kind','cycle_public_summary_v771',
      'match_no',v_match,'source','systeme','verified',true,
      'public_broadcast',true));
  return new;
end;
$function$


revoke all on function igr_private.igr_v771_cycle_public_notice() from public,anon,authenticated;
drop trigger if exists igr_v771_cycle_public_notice on public.igr_v4_rooms;
create trigger igr_v771_cycle_public_notice after update of cycle,status on public.igr_v4_rooms for each row execute function igr_private.igr_v771_cycle_public_notice();

CREATE OR REPLACE FUNCTION public.igr_v771_dossier_candidates(p_code text, p_player_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  actor public.igr_v4_players%rowtype;
  current_room public.igr_v4_rooms%rowtype;
  candidates jsonb;
begin
  perform igr_private.rate_limit('v771_dossier_candidates',p_player_token::text,90,60);
  select * into actor from public.igr_v4_players
    where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found then raise exception 'forbidden'; end if;
  select * into current_room from public.igr_v4_rooms where code=actor.room_code;
  if not found then raise exception 'room not found'; end if;
  if current_room.status<>'playing' or actor.public_role not in
    ('enqueteur','analyste','procureur','juge','inspecteur','expert')
    then return jsonb_build_object('candidates','[]'::jsonb); end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',q.id,'title',q.title,'text',q.body,'cycle',q.cycle,
    'votes',q.votes,'mine',q.mine,'published',q.published
  ) order by q.id desc),'[]'::jsonb) into candidates from (
    select e.id,left(e.payload->>'title',120) as title,
      left(coalesce(e.payload->>'text',e.payload->>'summary',''),1000) as body,
      e.cycle,
      (select count(distinct a.player_id)::integer from public.igr_v4_actions a
        where a.room_code=current_room.code and a.action_type='dossier_vote_v771'
          and a.payload->>'source_id'=e.id::text) as votes,
      exists(select 1 from public.igr_v4_actions a
        where a.room_code=current_room.code and a.action_type='dossier_vote_v771'
          and a.player_id=actor.id and a.payload->>'source_id'=e.id::text) as mine,
      exists(select 1 from public.igr_v4_events pub
        where pub.room_code=current_room.code and pub.event_type='public_evidence'
          and pub.payload->>'source_id'=e.id::text) as published
    from public.igr_v4_events e
    where e.room_code=current_room.code and e.visibility='roles'
      and actor.public_role=any(e.audience_roles)
      and (e.event_type in ('trame','field','expert','judge','evidence',
             'field_result','expert_result') or e.event_type ~ '^investigation_[0-9]{3}$')
      and length(coalesce(e.payload->>'text',e.payload->>'summary',''))>=12
      and length(coalesce(e.payload->>'title',''))>=3
      and coalesce(e.cycle,1)<=current_room.cycle
    order by e.id desc limit 8
  ) q;
  return jsonb_build_object('candidates',candidates);
end;
$function$


revoke all on function public.igr_v771_dossier_candidates(text,uuid) from public,authenticated,anon;
grant execute on function public.igr_v771_dossier_candidates(text,uuid) to anon;

CREATE OR REPLACE FUNCTION public.igr_v771_dossier_vote(p_code text, p_player_token uuid, p_event_id bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  actor public.igr_v4_players%rowtype;
  current_room public.igr_v4_rooms%rowtype;
  source_event public.igr_v4_events%rowtype;
  v_votes integer;
  v_publications integer;
  v_existing boolean;
begin
  perform igr_private.rate_limit('v771_dossier_vote',p_player_token::text,25,60);
  select * into actor from public.igr_v4_players
    where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found then raise exception 'forbidden'; end if;
  select * into current_room from public.igr_v4_rooms where code=actor.room_code for update;
  if not found or current_room.status<>'playing' or current_room.cycle not between 1 and 3
     or current_room.phase='role_reading' then raise exception 'publication closed'; end if;
  if actor.public_role not in ('enqueteur','analyste','procureur','juge','inspecteur','expert')
     then raise exception 'forbidden'; end if;
  select * into source_event from public.igr_v4_events e where e.id=p_event_id
    and e.room_code=current_room.code and e.visibility='roles'
    and actor.public_role=any(e.audience_roles)
    and (e.event_type in ('trame','field','expert','judge','evidence',
           'field_result','expert_result') or e.event_type ~ '^investigation_[0-9]{3}$')
    and length(coalesce(e.payload->>'text',e.payload->>'summary',''))>=12
    and length(coalesce(e.payload->>'title',''))>=3
    and coalesce(e.cycle,1)<=current_room.cycle;
  if not found then raise exception 'source not authorized'; end if;
  if exists(select 1 from public.igr_v4_events e where e.room_code=current_room.code
    and e.event_type='public_evidence' and e.payload->>'source_id'=p_event_id::text) then
    return jsonb_build_object('status','published','votes',2); end if;
  select count(*)::integer into v_publications from public.igr_v4_events e
    where e.room_code=current_room.code and e.cycle=current_room.cycle
      and e.event_type='public_evidence' and e.payload->>'source'='camp_enquete';
  if v_publications>=2 then raise exception 'two public disclosures already made this cycle'; end if;
  select exists(select 1 from public.igr_v4_actions a where a.room_code=current_room.code
    and a.player_id=actor.id and a.action_type='dossier_vote_v771'
    and a.payload->>'source_id'=p_event_id::text) into v_existing;
  if not v_existing then
    insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
    values(current_room.code,actor.id,current_room.cycle,'dossier_vote_v771',
      jsonb_build_object('source_id',p_event_id::text));
  end if;
  select count(distinct a.player_id)::integer into v_votes from public.igr_v4_actions a
    where a.room_code=current_room.code and a.action_type='dossier_vote_v771'
    and a.payload->>'source_id'=p_event_id::text;
  if v_votes<2 then return jsonb_build_object('status','pending','votes',v_votes); end if;

  insert into public.igr_v4_events(room_code,event_type,visibility,cycle,payload)
  values(current_room.code,'public_evidence','public',current_room.cycle,
     jsonb_build_object(
       'title',left('Document communiqué · '||(source_event.payload->>'title'),120),
       'text',left(coalesce(source_event.payload->>'text',source_event.payload->>'summary',''),1000),
       'source','camp_enquete','source_id',source_event.id::text,
       'source_type',source_event.event_type,'public_broadcast',true,
       'verified',coalesce(source_event.payload->>'verified','false')='true',
       'release_mode','two_distinct_investigators'));
  return jsonb_build_object('status','published','votes',v_votes);
end;
$function$


revoke all on function public.igr_v771_dossier_vote(text,uuid,bigint) from public,authenticated,anon;
grant execute on function public.igr_v771_dossier_vote(text,uuid,bigint) to anon;

