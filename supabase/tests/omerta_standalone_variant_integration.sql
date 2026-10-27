-- Le tirage serveur ne doit exiger NI chapitre précédent NI achat.
-- Tests sur du contenu synthétique totalement dépourvu de spoilers.
do $suite$
declare
 sc text; c text; selected text; same text; next_variant text;
 source_player public.igr_v4_players%rowtype; other_player public.igr_v4_players%rowtype;
 investigator public.igr_v4_players%rowtype; dossier jsonb; delivered int; refused boolean;
 pristine jsonb; after_mutation jsonb; blocked boolean; next_no integer; variant record;
begin
 for sc in select lpad(s::text,3,'0') from generate_series(21,25) s loop
  c:='PIN'||sc;
  insert into public.igr_v4_rooms(code,scenario_id,status,cycle,phase,state)
  values(c,sc,'lobby',0,'briefing','{"match_no":1}'::jsonb);
  for variant in select * from (values ('A'),('B'),('C')) v(letter) loop
   insert into igr_private.igr_v99_variant_manuscripts(
    scenario_id,variant_id,manuscript,editorial_status)
   values(sc,variant.letter,
    jsonb_build_object(
      'public_briefing','Synthetic public case introduction',
      'final_reveal','SECRET: do not send to players',
      'canonical_truth',jsonb_build_object('synthetic',sc||variant.letter, 'responsibility_by_slot',jsonb_build_object('1',0,'2',1,'3',2), 'timeline', jsonb_build_array(jsonb_build_object('id','qa-t1','what','Synthetic document A'),jsonb_build_object('id','qa-t2','what','Synthetic document B'))),
      'private_cards',jsonb_build_array(jsonb_build_object('slot',1,'objective','QA only '||variant.letter,'identity','Synthetic role A','what_you_know','Private clue A','what_you_hide','Private secret A'),jsonb_build_object('slot',2,'objective','Other goal','identity','Synthetic role B','what_you_know','Private clue B','what_you_hide','Private secret B'),jsonb_build_object('slot',3,'objective','QA only','identity','Synthetic role C','what_you_know','Private clue C')),
      'saga',jsonb_build_object('collection','OMERTA','family','SANTORO','branch',variant.letter,
        'chapter',sc::int-20),
      'revelations',jsonb_build_array(jsonb_build_object(
        'kind','guaranteed','min_cycle','3','canonical_event_id','qa-t2','id','qa-guaranteed-c3','audience','investigation','title','Synthetic crosscheck','text','Two documents establish a discrepancy, not individual guilt',
        'editorial_provenance',jsonb_build_object(
          'human_source_review','unverified','source_material','synthetic manuscript fixture','existing_events',jsonb_build_array('qa-t1','qa-t2'),
          'independent_of_optional_actions','true'))),
      'status','review','human_review_approved',false),
    'review');
  end loop;
  selected:=igr_private.igr_omerta_pin_standalone_room_variant(c);
  if selected is not null then raise exception 'unapproved % activated',sc; end if;
 end loop;

 if igr_private.igr_omerta_structural_preflight('021') is not true
 then raise exception 'valid synthetic crosschecks rejected'; end if;
 -- Approuver une variante imaginaire UNIQUEMENT dans PostgreSQL jetable.
 -- 022–025 restent des brouillons ; 021 doit pouvoir démarrer indépendamment.
 update igr_private.igr_v99_variant_manuscripts
 set editorial_status='ready',approved_by='fixture_only',approved_at=now(),
 manuscript=jsonb_set(jsonb_set(
    jsonb_set(manuscript,'{status}','"ready"'::jsonb,true),
    '{human_review_approved}','true'::jsonb,true),
    '{revelations,0,editorial_provenance,human_source_review}',
    '"verified"'::jsonb,true)
 where scenario_id='021';
 selected:=igr_private.igr_omerta_pin_standalone_room_variant('PIN021');
 if selected not in ('A','B','C') then raise exception 'standalone episode 021 blocked'; end if;
 same:=igr_private.igr_omerta_pin_standalone_room_variant('PIN021');
 if same<>selected then raise exception 'not stable on same match'; end if;
 pristine:=igr_private.igr_omerta_standalone_snapshot('PIN021',1);
 if pristine is null then raise exception 'no snapshot'; end if;

 -- Réécriture éditoriale postérieure: une partie existante conserve sa vérité.
 update igr_private.igr_v99_variant_manuscripts
 set manuscript=jsonb_set(manuscript,'{canonical_truth}',
    '{"synthetic":"edited later"}'::jsonb,true)
 where scenario_id='021' and variant_id=selected;
 after_mutation:=igr_private.igr_omerta_standalone_snapshot('PIN021',1);
 if after_mutation is distinct from pristine then raise exception 'pinned truth mutated'; end if;

 -- Un lecteur public n'obtient QUE son dossier par jeton, sans identité
 -- d'une autre place, ni copie de la vérité totale.
 insert into public.igr_v4_players(room_code,pseudo,seat_index,public_role,secret_role,internal_slot)
 values('PIN021','Alice',1,'suspect','associato',1) returning * into source_player;
 insert into public.igr_v4_players(room_code,pseudo,seat_index,public_role,secret_role,internal_slot)
 values('PIN021','Bob',2,'suspect','associato',2) returning * into other_player;
 insert into public.igr_v4_players(room_code,pseudo,seat_index,public_role,secret_role)
 values('PIN021','Enquêteur',3,'enqueteur','enqueteur') returning * into investigator;
 update public.igr_v4_rooms set status='playing',phase='interrogation',cycle=2 where code='PIN021';
 dossier:=public.igr_omerta_my_private_dossier('PIN021',source_player.player_token);
 if dossier->>'available'<>'false'
 then raise exception 'uncast legacy slot leaked standalone dossier'; end if;
 insert into igr_private.igr_omerta_room_cast_slots(
   room_code,match_no,player_id,internal_slot)
 values('PIN021',1,source_player.id,1),('PIN021',1,other_player.id,2);
 dossier:=public.igr_omerta_my_private_dossier('PIN021',source_player.player_token);
 if dossier->>'available'<>'true'
   or dossier->'card'->>'what_you_hide'<>'Private secret A'
   or dossier->'card' ? 'canonical_truth'
 then raise exception 'source private dossier incorrect'; end if;
 dossier:=public.igr_omerta_my_private_dossier('PIN021',other_player.player_token);
 if dossier->'card'->>'what_you_hide'<>'Private secret B'
   or dossier::text like '%Private secret A%'
 then raise exception 'cross player private dossier leaked'; end if;
 dossier:=public.igr_omerta_my_private_dossier('PIN021',investigator.player_token);
 if dossier->>'available'<>'false' then raise exception 'investigator accessed private suspect dossier'; end if;
 refused:=false;
 begin
   perform public.igr_omerta_my_private_dossier('PIN021',gen_random_uuid());
 exception when others then refused:=true; end;
 if not refused then raise exception 'invalid token accepted'; end if;
 if igr_private.igr_omerta_emit_c3_crosschecks('PIN021')<>0 then
   raise exception 'C3 evidence leaked in C2'; end if;
 update public.igr_v4_rooms set cycle=3 where code='PIN021';
 -- Le trigger de transition émet sans aucun clic et uniquement en présence
 -- d'une variante épinglée de la partie courante.
 select count(*) into delivered from public.igr_v4_events
  where room_code='PIN021' and event_type='omerta_c3_crosscheck'
    and target_player_id=investigator.id;
 if delivered<>1 then raise exception 'automatic C3 authored synthesis not delivered: %',delivered;end if;
 if not exists(
   select 1 from public.igr_v4_events e
   where e.room_code='PIN021' and e.event_type='omerta_c3_crosscheck'
   and e.target_player_id=investigator.id
   and e.payload->>'text'='Two documents establish a discrepancy, not individual guilt'
   and jsonb_array_length(e.payload->'source_event_ids')=2
   and e.payload::text not like '%Synthetic document A%'
   and e.payload::text not like '%Synthetic document B%'
 ) then raise exception 'raw canonical timeline leaked instead of authored document'; end if;
 if igr_private.igr_omerta_emit_c3_crosschecks('PIN021')<>0 then
    raise exception 'duplicate C3 event';end if;
 if (select count(*) from public.igr_v4_events
     where room_code='PIN021' and event_type='omerta_c3_crosscheck'
       and visibility='private' and target_player_id=investigator.id)<>1
 then raise exception 'investigation private C3 evidence missing';end if;
 if exists(select 1 from public.igr_v4_events
     where room_code='PIN021' and event_type='omerta_c3_crosscheck'
       and target_player_id in (source_player.id,other_player.id))
 then raise exception 'C3 evidence leaked to the mafia';end if;
 if has_function_privilege('anon','igr_private.igr_omerta_emit_c3_crosschecks(text)','EXECUTE')
 then raise exception 'C3 emission callable without server';end if;

 -- Test de non-régression : une salle sans snapshot A/B/C ne doit
 -- rien recevoir, même en passant au cycle III.
 insert into public.igr_v4_rooms(code,scenario_id,status,cycle,phase,state)
 values('UNPIN021','021','playing',2,'interrogation','{"match_no":1}'::jsonb);
 insert into public.igr_v4_players(room_code,pseudo,seat_index,public_role)
 values('UNPIN021','Old investigator',1,'enqueteur');
 update public.igr_v4_rooms set cycle=3 where code='UNPIN021';
 if exists(select 1 from public.igr_v4_events
   where room_code='UNPIN021' and event_type='omerta_c3_crosscheck')
 then raise exception 'legacy room incorrectly received standalone C3';end if;

 -- Nouveau match de la même salle -> autre variante quand elle est disponible.
 update public.igr_v4_rooms set state='{"match_no":2}'::jsonb
 where code='PIN021';
 -- La version rééditée sans ligne chronologique est invalide pour un
 -- NOUVEAU match. Le match précédent doit rester immuable.
 next_variant:=igr_private.igr_omerta_pin_standalone_room_variant('PIN021');
 if next_variant is not null then raise exception 'broken amended manuscript activated'; end if;
 -- Restaurer dans le TEST la rédaction certifiée afin d'exercer le rematch.
 update igr_private.igr_v99_variant_manuscripts set manuscript=pristine
 where scenario_id='021' and variant_id=selected;
 next_variant:=igr_private.igr_omerta_pin_standalone_room_variant('PIN021');
 if next_variant is null or next_variant not in ('A','B','C') or next_variant=selected
 then raise exception 'rematch did not rotate ABC'; end if;
 select count(*) into next_no
 from igr_private.igr_omerta_room_variant_snapshots
 where room_code='PIN021';
 if next_no<>2 then
   raise exception 'match isolation broken: count %, snapshots %, current room state %',
     next_no,
     (select jsonb_agg(jsonb_build_object('room',x.room_code,'match',x.match_no,'variant',x.variant_id))
       from igr_private.igr_omerta_room_variant_snapshots x),
     (select state from public.igr_v4_rooms where code='PIN021');
 end if;

 -- Les dossiers 022–025 restent inaccessibles tant qu'ils ne sont pas approuvés.
 for sc in select lpad(s::text,3,'0') from generate_series(22,25) s loop
  if igr_private.igr_omerta_pin_standalone_room_variant('PIN'||sc) is not null
  then raise exception 'other chapter unlocked without review %',sc; end if;
 end loop;

 -- Un client anon / authenticated ne reçoit aucune permission de révélation.
 if has_function_privilege('anon',
    'igr_private.igr_omerta_pin_standalone_room_variant(text)','EXECUTE')
    or has_function_privilege('authenticated',
    'igr_private.igr_omerta_standalone_snapshot(text,integer)','EXECUTE')
    or has_table_privilege('anon',
    'igr_private.igr_omerta_room_variant_snapshots','SELECT')
 then raise exception 'private manuscript exposed'; end if;
end $suite$;
select 'PRIVATE_A_B_C_PINNING_PASS' as outcome;
