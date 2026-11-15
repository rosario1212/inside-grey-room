BEGIN;
CREATE TABLE IF NOT EXISTS igr_private.igr_v690_terror_function_backup(signature text primary key,definition text not null,saved_at timestamptz not null default now());
ALTER TABLE igr_private.igr_v690_terror_function_backup ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON igr_private.igr_v690_terror_function_backup FROM PUBLIC,anon,authenticated;
INSERT INTO igr_private.igr_v690_terror_function_backup(signature,definition)
SELECT s.sig,pg_get_functiondef(s.sig::regprocedure) FROM (VALUES
('igr_private.igr_v688_terror_captivity()'),
('public.igr_v4_make_reveal(text)'),
('public.igr_v33_terror_confirm_028(text,uuid,text)')
) s(sig) ON CONFLICT(signature) DO NOTHING;
CREATE OR REPLACE FUNCTION igr_private.igr_v688_terror_captivity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE city_name text;message text;outcome text;
BEGIN
 IF new.scenario_id NOT IN ('026','027','028')
 OR old.status IS NOT DISTINCT FROM new.status OR new.status<>'finished'
 THEN RETURN new;END IF;
 outcome:=new.state#>>'{terror_v681,terminal_outcome}';
 IF outcome<>'front_at_gates' THEN RETURN new;END IF;
 city_name:=coalesce(new.state#>>'{terror_v681,city}','la capitale');
 message:=CASE new.scenario_id
 WHEN '026' THEN 'Le dernier secteur de {VILLE} cesse de répondre. Le FDR franchit les portes de la Grey Room, saisit les registres judiciaires et fait sortir tous les occupants de leurs cellules. Enquêteurs et détenus sont maltraités et interrogés sous la menace; les rebelles enregistrent de faux aveux pour effacer les disparitions qu ils ont organisées. Au matin, les captifs sont exécutés sommairement. Le FDR annonce que le tribunal n a jamais existé. Seules les copies déjà conservées hors de la capitale peuvent encore démentir ce mensonge.'
 WHEN '027' THEN 'La zone rouge et les derniers secteurs de {VILLE} tombent. Les combattants du FDR capturent les occupants de la Grey Room, les séparent et les soumettent à des interrogatoires coercitifs et à de mauvais traitements pour leur faire confirmer un renseignement falsifié. Des déclarations sont enregistrées sous la contrainte, puis tous les captifs sont exécutés sommairement. Le FDR diffuse ces aveux fabriqués comme la preuve de sa victoire; les familles des disparus n ont plus personne à qui réclamer une réponse.'
 WHEN '028' THEN 'La dernière liaison de l état-major se tait. Les membres du FDR entrent dans la Grey Room et retiennent enquêteurs, personnel et suspects. Tous sont interrogés sous la contrainte et maltraités tandis que les rebelles recherchent les preuves et les témoins. Une annonce prétend que des complices se trouvaient dans le centre depuis le début, sans que cette affirmation soit nécessairement vraie. Les captifs sont finalement exécutés sommairement. Le bâtiment reste silencieux : la menace extérieure était réelle, même si la cellule intérieure n était peut-être qu une invention.'
 ELSE 'Le FDR a pris la Grey Room.' END;
 message:=replace(message,'{VILLE}',city_name);
 INSERT INTO public.igr_v4_events(room_code,event_type,visibility,cycle,payload)
 VALUES(new.code,'terror_v688_captivity','public',new.cycle,
  jsonb_build_object('title','DÉFAITE · EXÉCUTIONS SOMMAIRES',
   'text',message,'city',city_name,'country','Almizia',
   'defeat',true,'captured',true,'executed_summarily',true,'fates_unresolved',false,'scenario',new.scenario_id));
 RETURN new;
END; $function$
;
CREATE OR REPLACE FUNCTION public.igr_v4_make_reveal(p_room text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  r public.igr_v4_rooms%rowtype;
  pack jsonb;
  s public.igr_v4_players%rowtype;
  p public.igr_v4_players%rowtype;
  q public.igr_v4_players%rowtype;
  enq public.igr_v4_players%rowtype;
  truth_levels jsonb;
  enq_payload jsonb := '{}'::jsonb;
  own_payload jsonb := '{}'::jsonb;
  own_levels jsonb := '{}'::jsonb;
  provisional_payload jsonb := '{}'::jsonb;
  resp jsonb := '[]'::jsonb;
  results jsonb := '[]'::jsonb;
  winners jsonb := '[]'::jsonb;
  achievements jsonb := '[]'::jsonb;
  truth int;
  guess int;
  exact int := 0;
  total int := 0;
  own_exact int;
  own_total int;
  client_count int;
  client_exact int;
  lawyer_count int;
  lawyer_rank int;
  action_count int;
  witness_flags int;
  judge_spent int;
  provisional_exact int;
  threshold int;
  max_cycle_success int;
  success boolean;
  result_role text;
  result_text text;
begin
  -- v171 031 ending
  if exists(select 1 from igr_private.igr_v171_031_matches where room_code=p_room) then
    return igr_private.igr_v171_031_make_reveal(p_room);
  end if;
  select * into r from public.igr_v4_rooms where code=p_room;
  if not found then raise exception 'room not found'; end if;
  if r.scenario_id='029' and coalesce((r.state->>'cartel029_ready')::boolean,false)
   and igr_private.igr_v108_029_is_enabled() then
      return igr_private.igr_v120_029_make_reveal(r.code);
  end if;

  select x.pack into pack
  from public.igr_v4_scenario_packs x
  where x.scenario_id=r.scenario_id; /* IGR_V181_001_SNAPSHOT_igr_v4_make_reveal */ if r.scenario_id='001' then pack:=coalesce(igr_private.igr_v181_001_pinned_game_pack(r.code),pack); end if; /* IGR_V202_002_PINNED_READ */ if r.scenario_id='002' then pack:=coalesce(igr_private.igr_v201_002_pinned_game_pack(r.code),pack); end if; /* IGR_003_V221_READER */ if r.scenario_id='003' then pack:=coalesce(igr_private.igr_v220_003_pinned_pack(r.code),pack);end if; if r.scenario_id='004' then pack:=coalesce(igr_private.igr_v230_004_pinned_pack(r.code),pack);end if; if r.scenario_id='005' then pack:=coalesce(igr_private.igr_v250_005_pinned_pack(r.code),pack);end if; if r.scenario_id='006' then pack:=coalesce(igr_private.igr_v260_006_pinned_pack(r.code),pack);end if; if r.scenario_id='007' then pack:=coalesce(igr_private.igr_v281_007_pinned_pack(r.code),pack);end if; if r.scenario_id='008' then pack:=igr_private.igr_v301_008_pinned_pack(r.code);if pack is null then raise exception '008 private snapshot missing';end if;end if; if r.scenario_id='009' then pack:=igr_private.igr_v331_009_pinned_pack(r.code);if pack is null then raise exception '009 private snapshot missing';end if;end if; if r.scenario_id='010' then pack:=igr_private.igr_v351_010_pinned_pack(r.code);if pack is null then raise exception '010 private snapshot missing';end if;end if; if r.scenario_id='011' then pack:=igr_private.igr_v371_011_pinned_pack(r.code);if pack is null then raise exception '011 private snapshot missing';end if;end if; if r.scenario_id='012' then pack:=igr_private.igr_v391_012_pinned_pack(r.code);if pack is null then raise exception '012 private snapshot missing';end if;end if; if r.scenario_id='013' then pack:=igr_private.igr_v411_013_pinned_pack(r.code);if pack is null then raise exception '013 private snapshot missing';end if;end if; if r.scenario_id='014' then pack:=igr_private.igr_v431_014_pinned_pack(r.code);if pack is null then raise exception '014 private snapshot missing';end if;end if; if r.scenario_id='015' then pack:=igr_private.igr_v451_015_pinned_pack(r.code);if pack is null then raise exception '015 private snapshot missing';end if;end if; if r.scenario_id='016' then pack:=igr_private.igr_v481_016_pinned_pack(r.code);if pack is null then raise exception '016 private snapshot missing';end if;end if; if r.scenario_id='017' then pack:=igr_private.igr_v521_017_pinned_pack(r.code);if pack is null then raise exception '017 private snapshot missing';end if;end if; if r.scenario_id='018' then pack:=igr_private.igr_v541_018_pinned_pack(r.code);if pack is null then raise exception '018 private snapshot missing';end if;end if; if r.scenario_id='019' then pack:=igr_private.igr_v571_019_pinned_pack(r.code);if pack is null then raise exception '019 private snapshot missing';end if;end if; if r.scenario_id='020' then pack:=igr_private.igr_v601_020_pinned_pack(r.code);if pack is null then raise exception '020 private snapshot missing';end if;end if;

  truth_levels := coalesce(pack->'truth'->'levels','[]'::jsonb);

  select * into enq
  from public.igr_v4_players
  where room_code=r.code and public_role='enqueteur'
  limit 1;

  select payload into enq_payload
  from public.igr_v4_actions
  where room_code=r.code and player_id=enq.id and action_type='final_lock'
  order by id desc limit 1;
  enq_payload := coalesce(enq_payload->'levels', enq_payload, '{}'::jsonb);

  for s in
    select * from public.igr_v4_players
    where room_code=r.code and public_role='suspect'
    order by internal_slot
  loop
    truth := coalesce((truth_levels->>(s.internal_slot-1))::int,0);
    guess := coalesce((enq_payload->>s.id::text)::int,-1);
    total := total+1;
    if guess=truth then exact:=exact+1; end if;
    resp := resp || jsonb_build_array(
      jsonb_build_object(
        'player_id',s.id,
        'pseudo',s.pseudo,
        'truth_level',truth,
        'enqueteur_level',guess
      )
    );
  end loop;

  threshold := greatest(1,ceil(total*2.0/3.0)::int);

  for p in
    select * from public.igr_v4_players
    where room_code=r.code
    order by seat_index
  loop
    achievements := '[]'::jsonb;
    success := false;
    result_role := p.public_role;
    result_text := 'Objectif non évalué.';

    if p.secret_role='espion' then
      result_role := 'espion';
      success := exact < total;
      result_text := case when success
        then 'L’enquête n’a pas reconstruit parfaitement les responsabilités : ta couverture a tenu.'
        else 'L’enquête a reconstruit toutes les responsabilités : ta mission d’ombre échoue.'
      end;
      if success and exact*2<=total then
        achievements := achievements || jsonb_build_array('espion_ombre');
      end if;

    elsif p.public_role='suspect' then
      truth := coalesce((truth_levels->>(p.internal_slot-1))::int,0);
      guess := coalesce((enq_payload->>p.id::text)::int,-1);
      success := guess=truth;
      result_text := case when success
        then 'La frontière exacte de ta responsabilité a été reconnue.'
        else 'Le verdict a déformé ou manqué ton degré réel de responsabilité.'
      end;
      if success and truth>=2 then
        achievements := achievements || jsonb_build_array('suspect_sous_pression');
      end if;

    elsif p.public_role='maitre' then
      select count(*) into lawyer_count
      from public.igr_v4_players a
      where a.room_code=r.code and a.public_role='maitre';

      select count(*) into lawyer_rank
      from public.igr_v4_players a
      where a.room_code=r.code and a.public_role='maitre' and a.seat_index<=p.seat_index;

      client_count:=0;
      client_exact:=0;
      for q in
        select * from public.igr_v4_players c
        where c.room_code=r.code
          and c.public_role='suspect'
          and (lawyer_count=1 or ((c.internal_slot-1)%lawyer_count)=(lawyer_rank-1))
        order by c.internal_slot
      loop
        client_count:=client_count+1;
        truth:=coalesce((truth_levels->>(q.internal_slot-1))::int,0);
        guess:=coalesce((enq_payload->>q.id::text)::int,-1);
        if truth=guess then client_exact:=client_exact+1; end if;
      end loop;
      success := client_count>0 and client_exact=client_count;
      result_text := case when success
        then client_exact||'/'||client_count||' client(s) défendu(s) dans la frontière exacte de leur responsabilité.'
        else client_exact||'/'||client_count||' client(s) correctement défendu(s) au verdict final.'
      end;
      if success and client_count>=2 then
        achievements := achievements || jsonb_build_array('avocat_double_defense');
      end if;

    elsif p.public_role in ('enqueteur','analyste','procureur','juge') then
      if p.public_role='enqueteur' then
        own_exact:=exact;
        own_total:=total;
      else
        select payload into own_payload
        from public.igr_v4_actions
        where room_code=r.code and player_id=p.id and action_type='final_lock'
        order by id desc limit 1;
        own_levels:=coalesce(own_payload->'levels',own_payload,'{}'::jsonb);
        own_exact:=0;
        own_total:=0;
        for s in
          select * from public.igr_v4_players
          where room_code=r.code and public_role='suspect'
          order by internal_slot
        loop
          own_total:=own_total+1;
          truth:=coalesce((truth_levels->>(s.internal_slot-1))::int,0);
          guess:=coalesce((own_levels->>s.id::text)::int,-1);
          if truth=guess then own_exact:=own_exact+1; end if;
        end loop;
      end if;

      success := own_total>0 and own_exact=own_total;

      if p.public_role='enqueteur' then
        result_text := own_exact||'/'||own_total||' responsabilités exactes.';
        select payload into provisional_payload
        from public.igr_v4_actions
        where room_code=r.code and player_id=p.id and action_type='provisional'
        order by id desc limit 1;
        if provisional_payload is not null then
          provisional_exact:=0;
          for s in
            select * from public.igr_v4_players
            where room_code=r.code and public_role='suspect'
          loop
            truth:=coalesce((truth_levels->>(s.internal_slot-1))::int,0);
            guess:=coalesce((provisional_payload->>s.id::text)::int,-1);
            if truth=guess then provisional_exact:=provisional_exact+1; end if;
          end loop;
          if success and provisional_exact=total then
            achievements:=achievements||jsonb_build_array('enq_sans_correction');
          end if;
        end if;

      elsif p.public_role='analyste' then
        result_text := own_exact||'/'||own_total||' responsabilités correctement lues dans ton verrouillage.';
        if success then achievements:=achievements||jsonb_build_array('analyste_parfait'); end if;

      elsif p.public_role='procureur' then
        select count(*) into action_count
        from public.igr_v4_actions
        where room_code=r.code and player_id=p.id and action_type='prosecutor_success';
        success := success and action_count>=1;
        result_text := own_exact||'/'||own_total||' responsabilités exactes · '||action_count||' entretien(s) accepté(s).';
        select coalesce(max(c),0) into max_cycle_success from (
          select cycle,count(*) c
          from public.igr_v4_actions
          where room_code=r.code and player_id=p.id and action_type='prosecutor_success'
          group by cycle
        ) z;
        if success and max_cycle_success>=2 then
          achievements:=achievements||jsonb_build_array('procureur_double_entretien');
        end if;

      elsif p.public_role='juge' then
        select coalesce(sum(coalesce((a.payload->>'cost')::int,0)),0) into judge_spent
        from public.igr_v4_actions a
        where a.room_code=r.code and a.player_id=p.id and a.action_type='judge';
        result_text := own_exact||'/'||own_total||' responsabilités exactes · '||judge_spent||'/5 points de confidentialité utilisés.';
        if success and judge_spent<=2 then
          achievements:=achievements||jsonb_build_array('juge_confidentiel');
        end if;
      end if;

    elsif p.public_role='journaliste' then
      select count(*) into action_count
      from public.igr_v4_actions
      where room_code=r.code and player_id=p.id and action_type='breaking_news';
      select payload into own_payload
      from public.igr_v4_actions
      where room_code=r.code and player_id=p.id and action_type='final_lock'
      order by id desc limit 1;
      success := action_count>=1 and length(trim(coalesce(own_payload->>'note','')))>=8;
      result_text := action_count||' Breaking News publiée(s) · angle final '||
        case when length(trim(coalesce(own_payload->>'note','')))>=8 then 'assumé.' else 'non verrouillé.' end;
      if success and action_count=3 then
        achievements:=achievements||jsonb_build_array('journaliste_trois_unes');
      end if;

    elsif p.public_role='inspecteur' then
      select count(*) into action_count
      from public.igr_v4_actions
      where room_code=r.code and player_id=p.id and action_type='field';
      success := action_count>=1 and exact>=threshold;
      result_text := action_count||' action(s) de terrain · enquête à '||exact||'/'||total||' responsabilités exactes.';
      if success and action_count>=3 then
        achievements:=achievements||jsonb_build_array('inspecteur_trois_pistes');
      end if;

    elsif p.public_role='expert' then
      select count(*) into action_count
      from public.igr_v4_actions
      where room_code=r.code and player_id=p.id and action_type='expert';
      success := action_count>=1 and exact>=threshold;
      result_text := action_count||' analyse(s) technique(s) · enquête à '||exact||'/'||total||' responsabilités exactes.';
      if success and action_count>=3 then
        achievements:=achievements||jsonb_build_array('expert_trois_analyses');
      end if;

    elsif p.public_role='temoin' then
      select count(*) into witness_flags
      from public.igr_v4_actions
      where room_code=r.code and action_type='witness_status'
        and payload->>'target'=p.id::text
        and payload->>'status'='suspect';
      success := witness_flags=0;
      result_text := case when success
        then 'Tu n’as jamais été formellement requalifié comme suspect.'
        else 'Tu as été requalifié comme suspect au cours de l’enquête.'
      end;
      select count(*) into action_count
      from public.igr_v4_actions
      where room_code=r.code and action_type='witness_status'
        and payload->>'target'=p.id::text;
      if success and action_count=0 then
        achievements:=achievements||jsonb_build_array('temoin_intouchable');
      end if;

    else
      success := false;
      result_text := 'Aucune condition de victoire n’est définie pour ce rôle.';
    end if;

    -- v170 cartel withdrawal result
    if p.public_role='maitre' and r.scenario_id in ('030','031')
      and coalesce((p.private_state->>'lawyer_cartel_forfeit')::boolean,false) then
      success:=false; achievements:='[]'::jsonb;
      result_text:='Tu as abandonné le mandat du cartel. Tu perds personnellement la partie. Le cartel a fait tuer ta famille.';
    end if;

    -- The Front reaches the Grey Room on a failed collective investigation.
    -- All occupants are executed after a terminal FDR victory, whatever their status.
    if r.scenario_id in ('026','027','028')
      and (exact<threshold OR coalesce((r.state#>>'{terror_v681,controlled}')::int,0)=0)
    then
      success:=false;
      achievements:='[]'::jsonb;
      result_text:='Le FDR prend la Grey Room de la dernière capitale libre d Almizia. Tu es capturé, maltraité et exécuté sommairement, sans distinction de rôle ni de fidélité au groupe.';
    end if;
    if p.public_role='officier_liaison' AND r.scenario_id in ('026','027','028') then
      select count(*) into action_count from public.igr_v4_actions cmd
       where cmd.room_code=r.code AND cmd.player_id=p.id
       AND cmd.action_type='terror_v688_military';
      success:=exact>=threshold
       AND coalesce((r.state#>>'{terror_v681,controlled}')::int,0)>0
       AND action_count>=1;
      result_text:=CASE WHEN success THEN
        'Tes ordres ont contribué à préserver les défenses de la capitale d Almizia, appuyés par un dossier suffisamment exact. La Grey Room tient encore.'
       WHEN action_count=0 THEN
        'Tu n as transmis aucun ordre militaire avant l issue de la crise. Le FDR prend la capitale ou les preuves ne permettent pas de conclure.'
       ELSE
        'Malgré tes décisions, les informations disponibles et le dernier verdict ne permettent pas d empêcher le FDR de prendre la Grey Room.' END;
    end if;
    if success then
      winners := winners || jsonb_build_array(p.id);
    end if;

    results := results || jsonb_build_array(
      jsonb_build_object(
        'player_id',p.id,
        'pseudo',p.pseudo,
        'role',result_role,
        'public_role',p.public_role,
        'success',success,
        'achievements',achievements,
        'text',result_text
      )
    );
  end loop;

  return jsonb_build_object(
    'title','RÉVÉLATION',
    'terror_finale',case when r.scenario_id in ('026','027','028') then
      jsonb_build_object(
       'organization','Front de la Restauration',
       'city',coalesce(r.state#>>'{terror_v681,city}','la ville'),
       'status',case when exact<threshold OR
          coalesce((r.state#>>'{terror_v681,controlled}')::int,0)=0
          then 'front_at_gates' else 'evidence_preserved' end,
       'message',case when exact<threshold OR
          coalesce((r.state#>>'{terror_v681,controlled}')::int,0)=0
         then 'DÉFAITE. Le FDR a pris la Grey Room. Tous les occupants sont faits prisonniers, maltraités puis exécutés sommairement. Le contexte précis dépend du scénario.'
         else 'La Grey Room conserve ses preuves et tient encore un secteur de la capitale. Le FDR demeure une menace, mais sa progression peut être contenue.' end)
      else null end,
    'summary',pack->'truth'->>'summary',
    'responsibilities',resp,
    'results',results,
    'winners',winners,
    'winner_count',jsonb_array_length(winners),
    'accuracy',jsonb_build_object('exact',exact,'total',total)
  );
end
$function$
;
CREATE OR REPLACE FUNCTION public.igr_v33_terror_confirm_028(p_code text, p_player_token uuid, p_choice text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  p public.igr_v4_players%rowtype;
  r public.igr_v4_rooms%rowtype;
  st jsonb;
  rt jsonb;
  label text;
  result_text text;
begin
  select * into p from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found then raise exception 'unauthorized'; end if;
  select * into r from public.igr_v4_rooms where code=p.room_code for update;
  if r.scenario_id<>'028' or r.status<>'playing' then raise exception 'not available'; end if;
  if p.public_role not in ('enqueteur','analyste') then raise exception 'investigation lead only'; end if;
  if coalesce(r.cycle,0)<3 or r.phase in ('closed','provisional_orals','provisional_lock','defense','final_debrief','locking','reveal') then raise exception 'liaison unavailable'; end if;
  if p_choice not in ('identite','chronologie','relais') then raise exception 'invalid choice'; end if;

  st:=coalesce(r.state,'{}'::jsonb);rt:=coalesce(st->'terror_runtime','{}'::jsonb);
  if nullif(rt->>'selected_confirmation','') is not null then return jsonb_build_object('ok',true,'runtime',rt,'already_locked',true); end if;

  if p_choice='identite' then
    label:='IDENTITÉ';
    result_text:='Une source extérieure retrouve un ancien contact attribué au FDR, mais ne peut confirmer si cette identité est encore active ni qui dirige la menace présente.';
  elsif p_choice='chronologie' then
    label:='CHRONOLOGIE';
    result_text:='La liaison extérieure compare les dates de deux messages anciens sans pouvoir prouver une présence contemporaine à la Grey Room. Le niveau de responsabilité reste à établir.';
  else
    label:='RELAIS INTÉRIEUR';
    result_text:='Une source extérieure trouve une référence ancienne à un relais du FDR, mais ne confirme ni un accès toujours valable ni une activité actuelle. Le document doit être recoupé.';
  end if;

  rt:=jsonb_set(rt,'{selected_confirmation}',to_jsonb(p_choice),true);
  rt:=jsonb_set(rt,'{selected_confirmation_label}',to_jsonb(label),true);
  rt:=jsonb_set(rt,'{confirmation_result}',to_jsonb(result_text),true);
  st:=jsonb_set(st,'{terror_runtime}',rt,true);
  update public.igr_v4_rooms set state=st,updated_at=now() where code=r.code;
  insert into public.igr_v4_events(room_code,event_type,payload)
  values(r.code,'terror_last_liaison',jsonb_build_object('title','DERNIÈRE LIAISON','text',result_text));
  return jsonb_build_object('ok',true,'runtime',rt);
end
$function$
;
DO $audit$
DECLARE s text;
BEGIN
 SELECT pg_get_functiondef('igr_private.igr_v688_terror_captivity()'::regprocedure) INTO s;
 IF position('exécutés sommairement' in s)=0 OR position('executed_summarily' in s)=0
 THEN RAISE EXCEPTION 'Explicit final executions not present';END IF;
 IF has_function_privilege('anon','igr_private.igr_v688_terror_captivity()','EXECUTE') OR has_table_privilege('anon','igr_private.igr_v690_terror_function_backup','SELECT')
 THEN RAISE EXCEPTION 'Private ending privileges exposed';END IF;
END $audit$;
COMMIT;
