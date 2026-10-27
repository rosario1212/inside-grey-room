-- Intégration de l'attribution des rôles sur PostgreSQL 16 éphémère.
-- Les secrets synthétiques ci-dessous NE SONT PAS le canon de production.
do $qa$
declare
 c text:='CAST021';
 investigator public.igr_v4_players%rowtype;
 source_player public.igr_v4_players%rowtype;
 before_slots jsonb;
 after_slots jsonb;
 dossier jsonb;
 intro jsonb;
 start_result jsonb;
 safe_snapshot jsonb;
 host uuid;
 started_count int;
 closure jsonb;
 assigned integer;
 blocked boolean;
 i int;
begin
 -- Compléter le modèle factice 021 avec 7 rôles adaptés à une salle à 8.
 update igr_private.igr_v99_variant_manuscripts
 set manuscript=jsonb_set(jsonb_set(manuscript,'{private_cards}',
   coalesce(manuscript->'private_cards','[]'::jsonb)
   || (
     select jsonb_agg(jsonb_build_object('slot',slot,
       'identity','Synthetic role '||slot,
       'objective','Private goal '||slot,
       'what_you_know','Private clue '||slot,
       'what_you_hide','Private secret '||slot,
       'your_chronology','Synthetic chronology '||slot,
       'conversation_hooks',jsonb_build_array('Talk if you wish')) order by slot)
     from generate_series(4,7) slot
   ),true),'{canonical_truth,responsibility_by_slot}',
    '{"1":0,"2":1,"3":2,"4":0,"5":1,"6":2,"7":1}'::jsonb,true)
 where scenario_id='021';
 if igr_private.igr_omerta_structural_preflight('021') is not true
 then raise exception '7-role structural preflight failed'; end if;

 -- L'ancien univers Verri ne peut jamais être livré sous le label Santoro,
 -- même si un éditeur avait marqué son manuscrit comme prêt.
 update igr_private.igr_v99_variant_manuscripts
 set manuscript=jsonb_set(manuscript,'{saga,family}','"VERRI"'::jsonb,true)
 where scenario_id='021' and variant_id='A';
 if igr_private.igr_omerta_structural_preflight('021') is not false
 then raise exception 'old mafia canon falsely eligible for Santoro';end if;
 update igr_private.igr_v99_variant_manuscripts
 set manuscript=jsonb_set(manuscript,'{saga,family}','"SANTORO"'::jsonb,true)
 where scenario_id='021' and variant_id='A';
 if igr_private.igr_omerta_structural_preflight('021') is not true
 then raise exception 'valid Santoro canon not restored';end if;


 insert into public.igr_v4_rooms(code,scenario_id,status,cycle,phase,state)
 values(c,'021','lobby',0,'briefing','{"match_no":1}'::jsonb);
 if igr_private.igr_omerta_pin_standalone_room_variant(c) not in ('A','B','C')
 then raise exception 'scenario 021 independent pin unavailable'; end if;
 insert into public.igr_v4_players(room_code,pseudo,seat_index,public_role,secret_role)
 values(c,'Investigator',1,'enqueteur','enqueteur') returning * into investigator;
 for i in 2..8 loop
   insert into public.igr_v4_players(
      room_code,pseudo,seat_index,public_role,secret_role)
   values(c,'Mafia '||i,i,'suspect','associato');
 end loop;
 -- Caporegime doit correspondre au personnage canon du slot 2,
 -- indépendamment du mélange aléatoire des joueurs.
 update public.igr_v4_players set preferred_role='caporegime'
 where room_code=c and seat_index=2;
 update public.igr_v4_rooms set status='playing',phase='briefing',cycle=0 where code=c;
 assigned:=igr_private.igr_omerta_cast_standalone_room(c);
 if assigned<>7 then raise exception '8-player cast failed: %',assigned; end if;
 if (select count(distinct internal_slot) from public.igr_v4_players
      where room_code=c and public_role='suspect')<>7
 then raise exception 'duplicate mafia identity'; end if;
 if (select internal_slot from public.igr_v4_players
     where room_code=c and seat_index=2)<>2
 then raise exception 'caporegime lost its canonical rank slot';end if;
 if exists(select 1 from public.igr_v4_players where room_code=c
      and public_role='suspect' and
      private_state->>'objective' is null)
 then raise exception 'role has no personal goal';end if;

 select jsonb_object_agg(p.id::text,p.internal_slot) into before_slots
 from public.igr_v4_players p
 where p.room_code=c and p.public_role='suspect';
 if igr_private.igr_omerta_cast_standalone_room(c)<>7
 then raise exception 'second cast changed room';end if;
 select jsonb_object_agg(p.id::text,p.internal_slot) into after_slots
 from public.igr_v4_players p
 where p.room_code=c and p.public_role='suspect';
 if before_slots is distinct from after_slots
 then raise exception 'cast not stable after reconnect';end if;

 select * into source_player from public.igr_v4_players
 where room_code=c and public_role='suspect' order by seat_index limit 1;
 dossier:=public.igr_omerta_my_private_dossier(c,source_player.player_token);
 if dossier->>'available'<>'true' or nullif(dossier->'card'->>'objective','') is null
 then raise exception 'assigned private dossier missing during briefing';end if;
 update public.igr_v4_rooms set phase='interrogation',cycle=1 where code=c;
 dossier:=public.igr_omerta_my_private_dossier(c,source_player.player_token);
 if dossier->'card'->>'objective' is null
 then raise exception 'assigned role not visible to its owner';end if;
 if dossier::text like '%SECRET: do not send to players%'
 then raise exception 'final reveal leaked into private dossier';end if;
 intro:=public.igr_omerta_public_briefing(c,investigator.player_token);
 if intro->>'text'<>'Synthetic public case introduction'
 then raise exception 'public briefing missing';end if;
 if intro::text like '%SECRET: do not send to players%'
 then raise exception 'final reveal leaked into public briefing';end if;

 closure:=public.igr_omerta_standalone_closure(c,investigator.player_token);
 if closure->>'available'<>'false'
 then raise exception 'closure revealed before official end';end if;
 update public.igr_v4_rooms set status='finished',phase='finished' where code=c;
 closure:=public.igr_omerta_standalone_closure(c,investigator.player_token);
 if closure->>'available'<>'true'
   or closure->>'story'<>'SECRET: do not send to players'
   or jsonb_array_length(closure->'characters')<>7
 then raise exception 'post-game authored closure or cast responsibility missing';end if;
 if exists(
   select 1 from jsonb_array_elements(closure->'characters') k
   where coalesce((k->>'editorial_involvement_level')::int,-1) not between 0 and 2
 ) then raise exception 'invalid editorial involvement level';end if;
 blocked:=false;
 begin perform public.igr_omerta_standalone_closure(c,gen_random_uuid());
 exception when others then blocked:=true;end;
 if not blocked then raise exception 'stranger accessed final storyline'; end if;
 -- A rematch with no new approved snapshot must not inherit this ending.
 update public.igr_v4_rooms set state='{"match_no":2}'::jsonb where code=c;
 closure:=public.igr_omerta_standalone_closure(c,investigator.player_token);
 if closure->>'available'<>'false'
 then raise exception 'previous match ending leaked into rematch';end if;

 blocked:=false;
 begin perform igr_private.igr_omerta_cast_standalone_room(c);
 exception when others then blocked:=true;end;
 if not blocked then raise exception 'cast allowed after briefing'; end if;
 if has_function_privilege('anon','igr_private.igr_omerta_cast_standalone_room(text)','EXECUTE')
 then raise exception 'public privilege to cast roles';end if;
 if has_table_privilege('anon','igr_private.igr_omerta_room_cast_slots','SELECT')
 then raise exception 'role mapping leaked to anon';end if;

 -- Host-only opt-in release path: preserves legacy room, rejects unapproved
 -- variants, and replaces any old public context inside the same transaction.
 insert into public.igr_v4_rooms(code,scenario_id,status,cycle,phase,state)
 values('START022','022','lobby',0,'briefing','{"match_no":1}'::jsonb)
 returning host_token into host;
 for i in 1..4 loop
   insert into public.igr_v4_players(
     room_code,pseudo,seat_index,public_role,secret_role)
   values('START022','Player '||i,i,
      case when i=1 then 'enqueteur' else 'suspect' end,
      case when i=1 then 'enqueteur' else 'associato' end);
 end loop;
 blocked:=false;
 begin perform public.igr_omerta_start_standalone('START022',host);
 exception when others then blocked:=true;end;
 if not blocked then raise exception 'unreviewed chapter launch succeeded';end if;
 if (select status from public.igr_v4_rooms where code='START022')<>'lobby'
    or exists(select 1 from igr_private.igr_omerta_room_variant_snapshots
              where room_code='START022')
 then raise exception 'blocked start mutated lobby';end if;

 insert into public.igr_v4_rooms(code,scenario_id,status,cycle,phase,state)
 values('START021','021','lobby',0,'briefing','{"match_no":1}'::jsonb)
 returning host_token into host;
 for i in 1..4 loop
   insert into public.igr_v4_players(
     room_code,pseudo,seat_index,public_role,secret_role)
   values('START021','Player '||i,i,
      case when i=1 then 'enqueteur' else 'suspect' end,
      case when i=1 then 'enqueteur' else 'associato' end);
 end loop;
 blocked:=false;
 begin perform public.igr_omerta_start_standalone('START021',gen_random_uuid());
 exception when others then blocked:=true;end;
 if not blocked then raise exception 'non-host started standalone case';end if;
 if (select status from public.igr_v4_rooms where code='START021')<>'lobby'
 then raise exception 'unauthorized call changed lobby';end if;

 -- L'interrupteur reste sur OFF même si un auteur a approuvé toutes
 -- les variantes dans les fixtures : aucune activation implicite.
 if (public.igr_omerta_standalone_release_status('START021',host)
    ->>'available')::boolean is not false then
   raise exception 'standalone status leaked as active before release';end if;
 blocked:=false;
 begin perform public.igr_omerta_start_standalone('START021',host);
 exception when others then blocked:=true;end;
 if not blocked or (select status from public.igr_v4_rooms where code='START021')<>'lobby'
 then raise exception 'unreleased standalone started without explicit flag';end if;
 update igr_private.igr_omerta_standalone_release_control
 set enabled=true,updated_at=now() where id=1;
 if (public.igr_omerta_standalone_release_status('START021',host)
    ->>'available')::boolean is not true then
   raise exception 'release-eligible synthetic chapter status not enabled';end if;

 -- Événement d'archive : une relance ne doit effacer QUE le contexte
 -- créé lors du lancement actuel, jamais une ancienne partie.
 insert into public.igr_v4_events(
   room_code,cycle,event_type,visibility,payload)
 values('START021',0,'context','public',
   '{"title":"ARCHIVE","text":"PREVIOUS MATCH HISTORICAL CONTEXT"}'::jsonb);
 start_result:=public.igr_omerta_start_standalone('START021',host);
 if start_result->>'ok'<>'true' or start_result->>'standalone'<>'true'
    or start_result ? 'variant_id' or start_result ? 'manuscript'
 then raise exception 'standalone host response failed or leaked its branch';end if;
 if (select status from public.igr_v4_rooms where code='START021')<>'playing'
    or (select state->>'omerta_standalone'
        from public.igr_v4_rooms where code='START021')<>'true'
 then raise exception 'room not safely started';end if;
 select count(*) into started_count
 from igr_private.igr_omerta_room_cast_slots where room_code='START021';
 if started_count<>3 then raise exception 'standalone room cast was not wired';end if;
 if exists(select 1 from public.igr_v4_events where room_code='START021'
    and event_type='context' and payload::text like '%LEGACY STORY%')
    or not exists(select 1 from public.igr_v4_events where room_code='START021'
    and event_type='context' and payload->>'text'='Synthetic public case introduction')
 then raise exception 'legacy context leaked into standalone room';end if;
 if not exists(select 1 from public.igr_v4_events
   where room_code='START021' and event_type='context'
     and payload->>'text'='PREVIOUS MATCH HISTORICAL CONTEXT')
 then raise exception 'old match context wiped by standalone release';end if;
 -- Un événement issu de l'ancienne trame ne doit JAMAIS traverser le
 -- proxy de synchronisation d'un dossier Santoro.
 insert into public.igr_v4_events(
    room_code,cycle,event_type,visibility,payload)
 values('START021',0,'trame','public',
        '{"title":"VERRI TRAME","text":"LEGACY VERRI SPOILER"}'::jsonb);
 update public.igr_v4_rooms set phase='role_reading',cycle=1
 where code='START021';
 safe_snapshot:=public.igr_omerta_standalone_safe_sync(
   'START021',(select player_token from public.igr_v4_players
               where room_code='START021' and seat_index=1));
 if safe_snapshot->'scenario'->>'context'<>'Synthetic public case introduction'
    or safe_snapshot->'scenario'->>'truth' is not null
    or safe_snapshot::text like '%LEGACY VERRI%'
 then raise exception 'old campaign narrative leaked through standalone sync';end if;
 if jsonb_array_length(safe_snapshot->'events')<>1
 then raise exception 'standalone event allowlist did not filter old trames';end if;
 if safe_snapshot->'player'->'private_state'->>'identity'<>'Enquêteur'
    or safe_snapshot->'player'->'private_state'->>'what_you_know'
       <>'Synthetic public case introduction'
    or safe_snapshot->'player'->'private_state' ? 'legacy_private'
 then raise exception 'old investigator private card was not replaced';end if;
 safe_snapshot:=public.igr_omerta_standalone_safe_sync(
   'START021',(select player_token from public.igr_v4_players
               where room_code='START021' and seat_index=2));
 if safe_snapshot->'player'->'private_state'->>'objective' is null
   or safe_snapshot->'player'->'private_state' ? 'legacy_private'
 then raise exception 'suspect received legacy private role or missing objective';end if;

 -- La fiche doit être visible immédiatement au briefing initial,
 -- sans attendre une transition vers le cycle I.
 update public.igr_v4_rooms set phase='briefing' where code='START021';
 safe_snapshot:=public.igr_omerta_standalone_safe_sync(
   'START021',(select player_token from public.igr_v4_players
               where room_code='START021' and seat_index=2));
 if nullif(safe_snapshot->'player'->'private_state'->>'objective','') is null
 then raise exception 'initial briefing hides assigned Santoro objective';end if;

 -- L'API historique publique ne permet plus de contourner le filtre.
 safe_snapshot:=public.igr_v4_sync(
  'START021',(select player_token from public.igr_v4_players
              where room_code='START021' and seat_index=1));
 if safe_snapshot::text like '%LEGACY VERRI%'
    or safe_snapshot->'scenario'->>'context'
        <>'Synthetic public case introduction'
 then raise exception 'original public sync RPC bypasses standalone guard'; end if;
 if has_function_privilege('anon',
      'public.igr_omerta_legacy_sync_core(text,uuid)','EXECUTE')
    or has_function_privilege('authenticated',
      'public.igr_omerta_legacy_sync_core(text,uuid)','EXECUTE')
 then raise exception 'internal raw sync accidentally remains callable';end if;
 if has_function_privilege('public',
    'public.igr_omerta_standalone_safe_sync(text,uuid)','EXECUTE')
 then raise exception 'PUBLIC execute not revoked from safe sync';end if;
 -- La même API ne doit rien modifier pour une salle Verri ancienne.
 safe_snapshot:=public.igr_omerta_standalone_safe_sync(
   'START022',(select player_token from public.igr_v4_players
               where room_code='START022' and seat_index=1));
 if safe_snapshot->'scenario'->>'context'<>'LEGACY VERRI PRIVATE CAMPAIGN'
 then raise exception 'legacy Verri sync unexpectedly changed';end if;

 if has_function_privilege('public','public.igr_omerta_start_standalone(text,uuid)','EXECUTE')
 then raise exception 'PUBLIC access grant retained on standalone host starter';end if;

 -- Vérification spécifique du Pentito 024 : ses obligations personnelles
 -- ne doivent jamais être échangées avec celles de l'Associato.
 update igr_private.igr_v99_variant_manuscripts
 set editorial_status='ready',approved_by='fixture_only',approved_at=now(),
 manuscript=manuscript||jsonb_build_object(
   'private_cards',coalesce(manuscript->'private_cards','[]'::jsonb)
       ||(select jsonb_agg(jsonb_build_object(
            'slot',slot,'identity','Synthetic rank identity '||slot,
            'objective','Synthetic rank objective '||slot,
            'what_you_know','Synthetic rank knowledge '||slot,
            'what_you_hide','Synthetic rank secret '||slot)
           order by slot) from generate_series(4,8) slot),
   'canonical_truth',(manuscript->'canonical_truth')
       ||jsonb_build_object('responsibility_by_slot',
          '{"1":0,"2":1,"3":2,"4":0,"5":1,"6":2,"7":1,"8":0}'::jsonb),
   'revelations',jsonb_set(manuscript->'revelations',
       '{0,editorial_provenance,human_source_review}','"verified"'::jsonb,true),
   'status','ready','human_review_approved',true
 )
 where scenario_id='024';
 if igr_private.igr_omerta_standalone_can_start('024') is not true
 then raise exception 'approved 024 fixture denied for wrong reason';end if;
 insert into public.igr_v4_rooms(code,scenario_id,status,cycle,phase,state)
 values('START024','024','lobby',0,'briefing','{"match_no":1}'::jsonb)
 returning host_token into host;
 for i in 1..8 loop
   insert into public.igr_v4_players(
     room_code,pseudo,seat_index,public_role,secret_role,preferred_role)
   values('START024','Player '||i,i,
      case when i=1 then 'enqueteur' else 'suspect' end,
      case i when 1 then 'enqueteur' when 2 then 'pentito'
          when 3 then 'associato' when 4 then 'caporegime'
          when 5 then 'consigliere' when 6 then 'contabile'
          when 7 then 'uomo_onore' else 'suspect' end,
      case i when 1 then 'enqueteur' when 2 then 'pentito'
          when 3 then 'associato' when 4 then 'caporegime'
          when 5 then 'consigliere' when 6 then 'contabile'
          when 7 then 'uomo_onore' else 'suspect' end);
 end loop;
 start_result:=public.igr_omerta_start_standalone('START024',host);
 if start_result->>'ok'<>'true' then raise exception '024 did not start';end if;
 if (select internal_slot from public.igr_v4_players
      where room_code='START024' and preferred_role='pentito')<>1
   or (select internal_slot from public.igr_v4_players
      where room_code='START024' and preferred_role='associato')<>8
   or (select internal_slot from public.igr_v4_players
      where room_code='START024' and preferred_role='caporegime')<>2
   or (select count(distinct internal_slot) from public.igr_v4_players
      where room_code='START024' and public_role='suspect')<>7
 then raise exception '024 rank-to-character assignments inconsistent';end if;


 -- Santoro V25: le rang provient de la FICHE rédigée, pas de l'ancien
 -- numéro Verri. Deux Associati et deux Soldati sont possibles.
 update igr_private.igr_v99_variant_manuscripts
 set manuscript=jsonb_set(
     jsonb_set(manuscript,'{private_format}','"santoro_v25"'::jsonb,true),
       '{private_cards}',(
       select jsonb_agg(
        jsonb_set(card,'{rank_code}',
          to_jsonb(case (card->>'slot')::integer
            when 1 then 'associato' when 2 then 'associato'
            when 3 then 'uomo_onore' when 4 then 'uomo_onore'
            when 5 then 'contabile' when 6 then 'caporegime'
            else 'consigliere' end),true)
         order by (card->>'slot')::integer)
       from jsonb_array_elements(manuscript->'private_cards') card
       ),true)
 where scenario_id='021';
 insert into public.igr_v4_rooms(code,scenario_id,status,cycle,phase,state)
 values('SANT021','021','lobby',0,'briefing','{"match_no":1}'::jsonb);
 if igr_private.igr_omerta_pin_standalone_room_variant('SANT021') not in ('A','B','C')
 then raise exception 'Santoro 021 synthetic variant could not pin';end if;
 for i in 1..4 loop
   insert into public.igr_v4_players(
      room_code,pseudo,seat_index,public_role,secret_role,preferred_role)
   values('SANT021','V25 '||i,i,
      case when i=1 then 'enqueteur' else 'suspect' end,
      case i when 1 then 'enqueteur' when 2 then 'caporegime'
        when 3 then 'associato' else 'uomo_onore' end,
      case i when 1 then 'enqueteur' when 2 then 'caporegime'
        when 3 then 'associato' else 'uomo_onore' end);
 end loop;
 update public.igr_v4_rooms set status='playing',phase='briefing',cycle=0
 where code='SANT021';
 if igr_private.igr_omerta_cast_standalone_room('SANT021')<>3
 then raise exception 'Santoro rank cast failed';end if;
 if (select internal_slot from public.igr_v4_players
      where room_code='SANT021' and preferred_role='caporegime')<>6
   or (select internal_slot from public.igr_v4_players
      where room_code='SANT021' and preferred_role='associato') not in (1,2)
   or (select internal_slot from public.igr_v4_players
      where room_code='SANT021' and preferred_role='uomo_onore') not in (3,4)
 then raise exception 'Santoro roles assigned to Verri numeric indices';end if;

end $qa$;
select 'PRIVATE_ROLE_CAST_8_PLAYERS_PASS' as outcome;
