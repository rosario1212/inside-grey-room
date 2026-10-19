-- Keep witness secret identity and final reveal aligned with pre-pinned match on retry.
CREATE OR REPLACE FUNCTION igr_private.igr_v108_029_seed()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare selected igr_private.igr_v107_029_editorial_matrix%rowtype;
        n integer; t text; witness jsonb; specific jsonb; actor_id uuid;
        content jsonb; slot_id integer;
begin
 if new.scenario_id<>'029' or not (old.status='lobby' and new.status='playing')
   or not igr_private.igr_v108_029_is_enabled() then return new; end if;
 n:=greatest(1,coalesce((new.state->>'match_no')::integer,1));
 select * into selected from igr_private.igr_v107_029_editorial_matrix
 where editorial_status='approved' and public_enabled
 order by random() limit 1;
 if not found then raise exception '029 private narrative unavailable'; end if;
 insert into igr_private.igr_v108_029_room_variants(room_code,match_no,branch,profile)
 values(new.code,n,selected.branch,selected.profile) on conflict do nothing;
 -- A retry or resumed match must use the pre-existing pinned variant.
 select m.* into selected
 from igr_private.igr_v108_029_room_variants pin
 join igr_private.igr_v107_029_editorial_matrix m on m.branch=pin.branch and m.profile=pin.profile
 where pin.room_code=new.code and pin.match_no=n
   and m.editorial_status='approved' and m.public_enabled;
 if not found then raise exception 'missing pinned 029 variant'; end if;
 for slot_id in 1..4 loop
   select id into actor_id from public.igr_v4_players
   where room_code=new.code and public_role='suspect' and internal_slot=slot_id;
   if actor_id is null then raise exception 'missing compulsory 029 witness'; end if;
   t:='T'||slot_id::text;
   witness:=selected.authoring->'witnesses'->t;
   specific:=case when slot_id=4 then selected.authoring->'witness4' else '{}'::jsonb end;
   if witness is null then raise exception 'missing private 029 witness card'; end if;
   content:=jsonb_build_object(
      'place',coalesce(witness->>'title','Témoin'),
      'anchors',coalesce(witness->>'knows',''),
      'hide',coalesce(witness->>'secret','')||case when slot_id=4 then ' '||coalesce(specific->>'secret','') else '' end,
      'position',coalesce(witness->>'history','')||case when slot_id=4 then ' '||coalesce(specific->>'cover','') else '' end,
      'objective_main',coalesce(witness->>'goal','')||case when slot_id=4 then ' '||coalesce(specific->>'real','') else '' end,
      'chronology',coalesce(witness->>'history',''),
      'unknown',coalesce(witness->>'unknown','')
   );
   update public.igr_v4_players set private_state=private_state||content where id=actor_id;
 end loop;
 update public.igr_v4_players set private_state=coalesce(private_state,'{}'::jsonb)||jsonb_build_object(
 'place','Don Ismael « Maelo » Salcedo · chef de Los Salcedo',
 'chronology','Tu diriges Los Salcedo. Tu as sauvé un enfant qui a grandi dans ton organisation et dont tu apprécies l’intelligence.',
 'anchors','Tu connais le bras droit et les responsables du réseau. Tu ne connais pas forcément chaque crime personnellement.',
 'hide',case when selected.profile='V5' then 'Le quatrième témoin est ton protégé, un soldat du réseau. Seuls les faits de ta fiche sont certains.' else 'Ne suppose pas connaître la véritable histoire du quatrième témoin.' end,
 'position','Tu peux écrire au bras droit, défendre ton organisation, négocier ou révéler des informations. Tes messages ne déclenchent jamais automatiquement de violence.',
 'objective_main','Protège ton autorité et ta survie sans inventer de preuves.'
 ) where room_code=new.code and public_role='don';
 update public.igr_v4_players set private_state=coalesce(private_state,'{}'::jsonb)||jsonb_build_object(
 'place','Bras droit de Don Ismael · Le Coordinateur',
 'chronology','Tu travailles directement avec le Don et les responsables locaux.',
 'anchors','Tu connais des circuits du cartel, mais la vérité de cette partie dépend des preuves.',
 'hide',case when selected.profile='V5' then 'Le quatrième témoin travaille pour ton réseau. Il prétend venir de La Noria.' else 'Tu ne connais pas automatiquement les secrets du quatrième témoin.' end,
 'position','Tu peux écrire au Don et répondre aux accusations. Un message ne donne pas d’ordre automatique à la fiction.',
 'objective_main','Préserve ta place auprès du Don. Tu restes libre de coopérer ou de trahir.'
 ) where room_code=new.code and public_role='bras_droit';
 update public.igr_v4_rooms set state=jsonb_set(coalesce(state,'{}'::jsonb),'{cartel029_ready}','true'::jsonb,true) where code=new.code;
 return new;
end $function$;
