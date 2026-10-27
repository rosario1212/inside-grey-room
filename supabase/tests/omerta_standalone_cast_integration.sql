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
 if dossier->>'available'<>'false'
 then raise exception 'private dossier accessible during briefing';end if;
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
 if has_function_privilege('public','public.igr_omerta_start_standalone(text,uuid)','EXECUTE')
 then raise exception 'PUBLIC access grant retained on standalone host starter';end if;
end $qa$;
select 'PRIVATE_ROLE_CAST_8_PLAYERS_PASS' as outcome;
