-- OMERTÀ - version révisée du calcul de verdict, uniquement pour les sources recrutées.
-- Source : définition SQL active inspectée avant modification ; aucune autre branche de rôle changée.
-- Appliquer après les migrations de recrutement, cartes et vote de fin.
CREATE OR REPLACE FUNCTION public.igr_omerta_make_reveal(p_room text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  r public.igr_v4_rooms%rowtype; base jsonb; item jsonb; out_results jsonb:='[]'::jsonb; out_winners jsonb:='[]'::jsonb;
  p public.igr_v4_players%rowtype; role text; success boolean; txt text; reveals int; major int; coop int; reduction int; exposure int; protected boolean; dead boolean; wrongful int; audiences int;
  indic_matched boolean; indic_by_card boolean; indic_second_ok boolean; indic_personal_ok boolean; indic_match_id integer;
  pack jsonb; base_sentence int; final_sentence int; cid uuid; camp public.igr_omerta_campaigns%rowtype; dossier jsonb; deaths jsonb:='[]'::jsonb; protections jsonb:='[]'::jsonb; charname text; next_dossier text; cstatus jsonb;
begin
  select * into r from public.igr_v4_rooms where code=p_room; if not found then raise exception 'room not found'; end if;
  base:=public.igr_v4_make_reveal(p_room);
  select x.pack into pack from public.igr_v4_scenario_packs x where x.scenario_id=r.scenario_id;
  for item in select value from jsonb_array_elements(coalesce(base->'results','[]'::jsonb)) loop
    select * into p from public.igr_v4_players where id=(item->>'player_id')::uuid and room_code=r.code;
    role:=coalesce(p.preferred_role,p.secret_role,p.public_role);
    select count(*),coalesce(sum(coalesce((a.payload->>'cooperation')::int,0)),0),coalesce(sum(coalesce((a.payload->>'exposure')::int,0)),0),coalesce(sum(case coalesce((a.payload->>'level')::int,0) when 1 then 1 when 2 then 3 when 3 then 7 else 0 end),0),coalesce(sum(case when coalesce((a.payload->>'level')::int,0)=3 then 1 else 0 end),0)
      into reveals,coop,exposure,reduction,major from public.igr_v4_actions a where a.room_code=r.code and a.player_id=p.id and a.action_type='omerta_reveal';
    select exists(select 1 from public.igr_v4_actions a where a.room_code=r.code and a.action_type='omerta_protection_granted' and a.payload->>'target'=p.id::text) into protected;
    dead:=coalesce((r.state->'omerta'->'dead') ? p.id::text,false);
    select count(*) into wrongful from public.igr_v4_actions a where a.room_code=r.code and a.player_id=p.id and a.action_type='omerta_sanction' and coalesce((a.payload->>'wrongful')::boolean,false);
    select count(*) into audiences from public.igr_v4_actions a where a.room_code=r.code and a.player_id=p.id and a.action_type='omerta_audience';
    base_sentence:=case when p.public_role='suspect' then coalesce((pack->'suspects'->greatest(0,p.internal_slot-1)->>'base_sentence')::int,0) else 0 end;
    final_sentence:=greatest(1,base_sentence-reduction);
    success:=coalesce((item->>'success')::boolean,false); txt:=coalesce(item->>'text','');
    if role='associato' then success:=not dead and exposure<65; txt:='Reste en vie sans devenir l’homme sacrifiable. Exposition '||exposure||'.';
    elsif role='uomo_onore' then success:=major=0 and not dead; txt:='Aucune révélation majeure livrée directement. Omertà '||case when success then 'tenue.' else 'brisée.' end;
    elsif role='contabile' then success:=reveals>=1 and exposure<65 and not dead; txt:='Les comptes ont parlé. À toi de ne pas devenir la preuve suivante.';
    elsif role='pentito' then success:=coop>=45 and protected and not dead; txt:='Coopération '||coop||' · protection '||case when protected then 'accordée' else 'absente' end||' · peine estimée '||final_sentence||' an(s).';
    elsif role='caporegime' then success:=wrongful=0; txt:=case when success then 'Aucun homme loyal sanctionné par erreur.' else 'Tu as frappé sans preuve suffisante.' end;
    elsif role='consigliere' then success:=wrongful=0 and not dead; txt:='Le sommet reste protégé sans exécution inutile de ta part.';
    elsif role='sottocapo' then success:=wrongful=0 and not dead; txt:='La chaîne tient. Aucune sanction aveugle ne porte ta signature.';
    elsif role='don' then success:=audiences>=1 and wrongful=0; txt:='Audiences '||audiences||' · aucune sanction aveugle '||case when wrongful=0 then 'confirmée.' else 'non.' end;
    elsif p.public_role='suspect' then txt:=txt||' · Peine de départ '||base_sentence||' an(s) · réduction obtenue '||reduction||' · peine estimée '||final_sentence||' an(s) · '||case when dead then 'MORT' when protected then 'PROTÉGÉ' else 'EXPOSÉ' end||'.'; end if;
    -- La coopération n'est validée que par un renseignement canonique transmis et vérifié côté serveur.
    -- Une déclaration subjective de l'Enquêteur ne peut ni accorder ni refuser une victoire.
    indic_match_id:=greatest(1,coalesce((r.state->>'match_no')::int,1));
    select exists(
      select 1 from public.igr_v4_actions a where a.room_code=r.code
      and a.player_id=p.id and a.action_type='omerta_indic_response'
      and a.payload->>'accepted'='true'
      and coalesce((a.payload->>'match_no')::int,1)=indic_match_id
    ) into indic_matched;
    if indic_matched then

      select exists(
        select 1 from public.igr_v4_actions a
        where a.room_code=r.code and a.player_id=p.id
        and a.action_type='omerta_verified_intel'
        and a.payload->>'truth_verified'='true'
        and coalesce((a.payload->>'match_no')::int,1)=indic_match_id
      ) into indic_by_card;
      indic_second_ok:=indic_by_card;
      -- But individuel d'une source : sauver ses intérêts (protection OU
      -- remise officielle d'au moins 3 ans). Survivre reste séparément requis.
      -- L'ancien objectif de loyauté d'un uomo_onore ne peut pas devenir le
      -- critère égoïste d'un joueur passé Indic.
      indic_personal_ok:=protected or reduction>=3;
      success:=indic_personal_ok and indic_second_ok and not dead;
      txt:=txt||' · INDIC : protection ou remise de peine '||
        case when indic_personal_ok then 'atteint' else 'non atteint' end||
        ' · coopération '||
        case when indic_second_ok then 'validée par renseignement officiellement confirmé'
        else 'non validée' end||
        ' · survie '||case when dead then 'non' else 'oui' end||'.';
      item:=item||jsonb_build_object('indic',jsonb_build_object(
        'recruited',true,
        'personal_condition_met',indic_personal_ok,
        'second_condition_met',indic_second_ok,
        'second_via_confirmed_card',indic_by_card,
        'survival_condition_met',not dead
      ));
    end if;
    item:=item||jsonb_build_object('role',role,'success',success,'text',txt,'omerta',jsonb_build_object('cooperation',coop,'exposure',exposure,'sentence_base',base_sentence,'sentence_reduction',reduction,'sentence_final',final_sentence,'protected',protected,'dead',dead));
    out_results:=out_results||jsonb_build_array(item); if success then out_winners:=out_winners||jsonb_build_array(p.id); end if;
  end loop;
  base:=jsonb_set(base,'{results}',out_results,true); base:=jsonb_set(base,'{winners}',out_winners,true); base:=jsonb_set(base,'{winner_count}',to_jsonb(jsonb_array_length(out_winners)),true);
  select m.campaign_id into cid from public.igr_omerta_room_campaigns m where m.room_code=r.code;
  if cid is not null then
    select * into camp from public.igr_omerta_campaigns where id=cid for update; cstatus:=coalesce(camp.state->'character_status','{}'::jsonb);
    for p in select * from public.igr_v4_players where room_code=r.code and public_role='suspect' loop
      charname:=split_part(coalesce(pack->'suspects'->greatest(0,p.internal_slot-1)->>'place',p.pseudo),' · ',1); dead:=coalesce((r.state->'omerta'->'dead') ? p.id::text,false);
      select exists(select 1 from public.igr_v4_actions a where a.room_code=r.code and a.action_type='omerta_protection_granted' and a.payload->>'target'=p.id::text) into protected;
      if dead then deaths:=deaths||to_jsonb(charname); cstatus:=jsonb_set(cstatus,array[charname],to_jsonb('mort'::text),true); elsif protected then protections:=protections||to_jsonb(charname); cstatus:=jsonb_set(cstatus,array[charname],to_jsonb('protégé'::text),true); end if;
    end loop;
    next_dossier:=case r.scenario_id when '021' then '022' when '022' then '023' when '023' then '024' when '024' then '025' else 'TERMINÉ' end;
    dossier:=jsonb_build_object('completed_at',now(),'deaths',deaths,'protected',protections,'winner_count',jsonb_array_length(out_winners));
    update public.igr_omerta_campaigns set state=jsonb_set(jsonb_set(jsonb_set(camp.state,'{character_status}',cstatus,true),array['dossiers',r.scenario_id],dossier,true),'{current_dossier}',to_jsonb(next_dossier),true),status=case when r.scenario_id='025' then 'completed' else status end,updated_at=now() where id=cid returning * into camp;
    update public.igr_v4_rooms set state=jsonb_set(state,'{omerta_campaign}',camp.state,true),updated_at=now() where code=r.code; base:=jsonb_set(base,'{omerta_campaign}',camp.state,true);
  end if;
  return base;
end;
$function$;
