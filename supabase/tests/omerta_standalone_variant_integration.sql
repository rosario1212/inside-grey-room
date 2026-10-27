-- Le tirage serveur ne doit exiger NI chapitre précédent NI achat.
-- Tests sur du contenu synthétique totalement dépourvu de spoilers.
do $suite$
declare
 sc text; c text; selected text; same text; next_variant text;
 pristine jsonb; after_mutation jsonb; blocked boolean; next_no integer;
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
      'canonical_truth',jsonb_build_object('synthetic',sc||variant.letter),
      'private_cards',jsonb_build_array(jsonb_build_object('slot',1,'objective','QA only')),
      'saga',jsonb_build_object('collection','OMERTA','branch',variant.letter,
        'chapter',sc::int-20),
      'revelations',jsonb_build_array(jsonb_build_object(
        'kind','guaranteed','min_cycle','3',
        'editorial_provenance',jsonb_build_object(
          'human_source_review','unverified',
          'independent_of_optional_actions','true'))),
      'status','review','human_review_approved',false),
    'review');
  end loop;
  selected:=igr_private.igr_omerta_pin_standalone_room_variant(c);
  if selected is not null then raise exception 'unapproved % activated',sc; end if;
 end loop;

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

 -- Nouveau match de la même salle -> autre variante quand elle est disponible.
 update public.igr_v4_rooms set state='{"match_no":2}'::jsonb
 where code='PIN021';
 next_variant:=igr_private.igr_omerta_pin_standalone_room_variant('PIN021');
 if next_variant not in ('A','B','C') or next_variant=selected
 then raise exception 'rematch did not rotate ABC'; end if;
 select count(*) into next_no
 from igr_private.igr_omerta_room_variant_snapshots
 where room_code='PIN021';
 if next_no<>2 then raise exception 'match isolation broken'; end if;

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
