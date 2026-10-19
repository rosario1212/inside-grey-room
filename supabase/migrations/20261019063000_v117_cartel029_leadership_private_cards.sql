-- CARTEL 029: leadership cards assembled from approved PRIVATE story data.
create or replace function igr_private.igr_v117_029_leader_cards()
returns trigger language plpgsql security definer set search_path='' as $body$
declare material jsonb; v_branch text;v_profile text;v_match integer;
begin
 if new.scenario_id<>'029' or old.status<>'lobby' or new.status<>'playing'
   or not igr_private.igr_v108_029_is_enabled() then return new; end if;
 v_match:=greatest(1,coalesce((new.state->>'match_no')::int,1));
 select branch,profile into v_branch,v_profile from igr_private.igr_v108_029_room_variants
 where room_code=new.code and match_no=v_match;
 select authoring into material from igr_private.igr_v107_029_editorial_matrix
 where branch=v_branch and profile=v_profile and editorial_status='approved' and public_enabled;
 if material is null then raise exception 'private narrative unavailable'; end if;
 update public.igr_v4_players set private_state=coalesce(private_state,'{}'::jsonb)||
 jsonb_build_object(
  'place','Don Ismael « Maelo » Salcedo · chef du cartel',
  'chronology','Tu diriges Los Salcedo et connais son bras droit. Tu as formé plusieurs jeunes hommes de confiance.',
  'anchors','Tu connais l’organisation, mais tu n’es pas présent lors de tous les événements.',
  'hide',coalesce(material->'leader_notes'->>'don','Tu ne connais pas chaque détail de cette affaire.'),
  'position','Tu peux contacter ton bras droit, défendre ton autorité ou choisir de coopérer. Un message n’est jamais un ordre automatique.',
  'objective_main','Protège ton autorité sans inventer de faits.')
 where room_code=new.code and public_role='don';
 update public.igr_v4_players set private_state=coalesce(private_state,'{}'::jsonb)||
 jsonb_build_object(
  'place','Bras droit du Don · Le Coordinateur',
  'chronology','Tu travailles directement avec le Don et tu connais plusieurs responsables locaux.',
  'anchors','Tu connais le réseau et certains transferts, mais tu ne sais pas tout.',
  'hide',coalesce(material->'leader_notes'->>'right_hand','Tu ignores certains détails de la présente enquête.'),
  'position','Tu peux écrire au Don, répondre aux accusations, coopérer ou conserver ta loyauté.',
  'objective_main','Défends ta place auprès du Don. Tes décisions restent les tiennes.')
 where room_code=new.code and public_role='bras_droit';
 return new;
end $body$;
revoke all on function igr_private.igr_v117_029_leader_cards() from public,anon,authenticated;
drop trigger if exists igr_v117_029_leader_cards on public.igr_v4_rooms;
create trigger igr_v117_029_leader_cards after update of status
on public.igr_v4_rooms for each row execute function igr_private.igr_v117_029_leader_cards();
