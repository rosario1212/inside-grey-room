CREATE OR REPLACE FUNCTION public.igr_v4_lock_final(p_code text, p_player_token uuid, p_payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE p public.igr_v4_players%rowtype;r public.igr_v4_rooms%rowtype;
 levels jsonb;note_text text;st jsonb;is_029 boolean;
BEGIN
 PERFORM igr_private.rate_limit('final_lock',p_player_token::text,12,60);
 SELECT * INTO p FROM public.igr_v4_players
 WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token;
 IF NOT FOUND OR NOT (public.igr_v52_investigation_role(p.public_role) OR p.public_role='journaliste')
 THEN RAISE EXCEPTION 'forbidden'; END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=p.room_code FOR UPDATE;
 IF r.phase<>'locking' OR NOT coalesce((r.state->>'v52_final_reassessment')::boolean,false)
 THEN RAISE EXCEPTION 'wrong phase'; END IF;
 is_029:=r.scenario_id='029' AND coalesce((r.state->>'cartel029_ready')::boolean,false)
       AND igr_private.igr_v108_029_is_enabled();
 IF exists(SELECT 1 FROM public.igr_v4_actions WHERE room_code=r.code AND player_id=p.id AND action_type='final_lock')
 THEN RAISE EXCEPTION 'already locked'; END IF;
 IF coalesce(r.state->'v59_absent','[]'::jsonb) ? p.id::text
 THEN RAISE EXCEPTION 'player marked absent'; END IF;
 IF is_029 THEN
   -- No fabricated responsibility levels for four witnesses; the report decides.
   -- Unsubmitted reports count as incomplete, never a permanent lockout.
   levels:='{}'::jsonb;
 ELSIF p.public_role<>'journaliste' THEN
   levels:=public.igr_v52_validate_levels(r.code,p_payload->'levels');
 ELSE levels:='{}'::jsonb; END IF;
 IF r.scenario_id='001' AND p.public_role in ('enqueteur','analyste') AND p_payload ? 'reconstruction_001' THEN
   IF jsonb_typeof(p_payload->'reconstruction_001')<>'object' OR
     coalesce(p_payload->'reconstruction_001'->>'moment','') NOT IN ('first','second') OR
     coalesce(p_payload->'reconstruction_001'->>'gesture','') NOT IN ('s1_intentional','s2_intentional','s3_accident') OR
     coalesce(p_payload->'reconstruction_001'->>'reframe','') NOT IN ('recording','evidence_moved','third_intervention')
     THEN RAISE EXCEPTION 'invalid reconstruction'; END IF;
 END IF;
 IF r.scenario_id='002' AND p.public_role in ('enqueteur','analyste') AND p_payload ? 'reconstruction_002' THEN
   IF jsonb_typeof(p_payload->'reconstruction_002')<>'object' OR
     coalesce(p_payload->'reconstruction_002'->>'central','') NOT IN ('repeated_public_humiliation','explicit_help_request_unanswered','distinct_acts_without_single_culprit') OR
     coalesce(p_payload->'reconstruction_002'->>'evidence','') NOT IN ('repeated_publications','unmade_call_after_note','unread_apology_and_unverified_help') OR
     coalesce(p_payload->'reconstruction_002'->>'boundary','') NOT IN ('no_unique_cause','no_certain_outcome','separate_knowledge')
   THEN RAISE EXCEPTION 'invalid 002 reconstruction'; END IF;
 END IF;
 IF r.scenario_id='003' AND p.public_role in ('enqueteur','analyste') AND p_payload ? 'reconstruction_003' THEN
   IF jsonb_typeof(p_payload->'reconstruction_003')<>'object'
    OR coalesce(p_payload->'reconstruction_003'->>'central','') not in ('maintained_order','validation_erroneous','transfer_without_agreement')
    OR coalesce(p_payload->'reconstruction_003'->>'knowledge','') not in ('active_warning','conflicting_records_known','unsigned_receipt')
    OR coalesce(p_payload->'reconstruction_003'->>'reversal','') not in ('omitted_reservation','error_not_proven_fraud','postincident_rewrite')
    THEN raise exception 'invalid 003 reconstruction'; end if;
 END IF;
 if r.scenario_id='004' and p.public_role in ('enqueteur','analyste') then
 if jsonb_typeof(p_payload->'reconstruction_004')<>'object'
 or coalesce(p_payload->'reconstruction_004'->>'signal','') not in ('explicit_first_call','parallel_messages','misdated_passage')
 or coalesce(p_payload->'reconstruction_004'->>'decision','') not in ('refused_referral','mutual_waiting','early_refusal')
 or coalesce(p_payload->'reconstruction_004'->>'limit','') not in ('no_certain_prevention','no_rescue_assigned','late_visit_no_early_knowledge')
 then raise exception 'invalid 004 reconstruction';end if;
 end if;
 if r.scenario_id='005' and p.public_role in ('enqueteur','analyste') then
 if jsonb_typeof(p_payload->'reconstruction_005')<>'object'
 or coalesce(p_payload->'reconstruction_005'->>'author','') not in ('first_suspect','second_suspect','third_suspect')
 or coalesce(p_payload->'reconstruction_005'->>'mask','') not in ('added_after','present_before','moved_after')
 or coalesce(p_payload->'reconstruction_005'->>'proof','') not in ('late_entry_and_staging','inventory_and_appointment','separate_entries_and_shift')
 then raise exception 'invalid 005 reconstruction';end if;
 end if;
 if r.scenario_id='006' and p.public_role in ('enqueteur','analyste') then
 if jsonb_typeof(p_payload->'reconstruction_006')<>'object' or
 coalesce(p_payload->'reconstruction_006'->>'fall','') not in ('accidental','strike') or
 coalesce(p_payload->'reconstruction_006'->>'response','') not in ('presumed_dead','help_blocked') or
 coalesce(p_payload->'reconstruction_006'->>'lie','') not in ('coordinated_presence','concealed_strike','suppressed_signs')
 then raise exception 'invalid 006 reconstruction';end if;end if;
 if r.scenario_id='007' and p.public_role in ('enqueteur','analyste') then
 if jsonb_typeof(p_payload->'reconstruction_007')<>'object'
 or coalesce(p_payload->'reconstruction_007'->>'cause','') not in ('separate_dispute','debt_confrontation','lineage_document')
 or coalesce(p_payload->'reconstruction_007'->>'actor','') not in ('second_confrontation','third_file_struggle','second_document_struggle')
 or coalesce(p_payload->'reconstruction_007'->>'decoy','') not in ('forced_signature','concealed_debt','hidden_lineage')
 then raise exception 'invalid 007 reconstruction';end if;
 end if;
 if r.scenario_id='008' and p.public_role in ('enqueteur','analyste') then
   if jsonb_typeof(p_payload->'reconstruction_008')<>'object'
   or coalesce(p_payload->'reconstruction_008'->>'incident','') not in ('authorised_removal_confirmed','custody_gap','document_displacement')
   or coalesce(p_payload->'reconstruction_008'->>'responsible','') not in ('slot2_witness_pressure','slot1_custody_breach','slot3_deliberate_move')
   or coalesce(p_payload->'reconstruction_008'->>'decoy','') not in ('slot3_private_arrival','slot3_early_arrival','slot1_false_timesheet')
   or (select count(*) from jsonb_object_keys(p_payload->'reconstruction_008'))<>3
   then raise exception 'invalid 008 reconstruction';end if;
 end if;

 if r.scenario_id='009' and p.public_role in ('enqueteur','analyste') then
   if jsonb_typeof(p_payload->'reconstruction_009')<>'object'
     or coalesce(p_payload->'reconstruction_009'->>'withdrawal','') not in
        ('explicit_before_continuation','original_note_confirmed_explicit')
     or coalesce(p_payload->'reconstruction_009'->>'decision','') not in
        ('director_ordered_continuation','clinician_signed_continuation','director_rewrote_and_blocked_stop')
     or coalesce(p_payload->'reconstruction_009'->>'decoy','') not in
        ('amnesia_does_not_erase_prior_order','supervision_recommended_stop','unauthorized_copy_not_source_of_refusal')
     or (select count(*) from jsonb_object_keys(p_payload->'reconstruction_009'))<>3
   then raise exception 'invalid 009 reconstruction';end if;
 end if;

 if r.scenario_id='010' and p.public_role in ('enqueteur','analyste') then
   if jsonb_typeof(p_payload->'reconstruction_010')<>'object'
     or coalesce(p_payload->'reconstruction_010'->>'origin','') not in
        ('manual_confinement_by_first','accidental_latch_after_maintenance','knowledge_and_order_by_first')
     or coalesce(p_payload->'reconstruction_010'->>'door','') not in
        ('independent_reclose_after_contact','panic_reclose_after_contact','pressured_reclose_after_contact')
     or coalesce(p_payload->'reconstruction_010'->>'signal','') not in
        ('noise_witness_without_identification','credible_warning_read_ignored','unauthorized_presence_misdirection')
     or (select count(*) from jsonb_object_keys(p_payload->'reconstruction_010'))<>3
   then raise exception 'invalid 010 reconstruction';end if;
 end if;

 if r.scenario_id='011' and p.public_role in ('enqueteur','analyste') then
   if jsonb_typeof(p_payload->'reconstruction_011')<>'object'
     or coalesce(p_payload->'reconstruction_011'->>'order','') not in
        ('informed_illegal_authorization','explicit_civilian_limits','general_risk_no_specific_authorization')
     or coalesce(p_payload->'reconstruction_011'->>'field','') not in
        ('abusive_execution_with_local_discretion','unauthorized_expansion_with_self_edited_report','unauthorized_expansion_with_coverup_by_control')
     or coalesce(p_payload->'reconstruction_011'->>'halt','') not in
        ('delayed_despite_first_alert','delayed_after_repeated_warnings','delayed_and_directed_coverup')
     or (select count(*) from jsonb_object_keys(p_payload->'reconstruction_011'))<>3
   then raise exception 'invalid 011 reconstruction';end if;
 end if;

 if r.scenario_id='012' and p.public_role in ('enqueteur','analyste') then
   if jsonb_typeof(p_payload->'reconstruction_012')<>'object'
     or coalesce(p_payload->'reconstruction_012'->>'directive','') not in
        ('ordre_explicite_de_retenir','consigne_de_discussion_detournee','aucun_ordre_initial')
     or coalesce(p_payload->'reconstruction_012'->>'violence','') not in
        ('coups_ajoutes_hors_ordre','coups_pour_imposer_consigne','violences_et_retention_autonomes')
     or coalesce(p_payload->'reconstruction_012'->>'reaction','') not in
        ('direction_assume_retention','chef_averti_mais_inactif','chef_organise_couverture')
     or (select count(*) from jsonb_object_keys(p_payload->'reconstruction_012'))<>3
   then raise exception 'invalid 012 reconstruction';end if;
 end if;

 if r.scenario_id='013' and p.public_role in ('enqueteur','analyste') then
   if jsonb_typeof(p_payload->'reconstruction_013')<>'object'
     or coalesce(p_payload->'reconstruction_013'->>'knowledge','') not in
        ('logistique_savait_violence','logistique_risque_sans_cible','logistique_alerte_et_suspension')
     or coalesce(p_payload->'reconstruction_013'->>'command','') not in
        ('ordre_nominatif_transmis','financeur_nomme_cible_separement','suspension_jamais_confirmee')
     or coalesce(p_payload->'reconstruction_013'->>'security','') not in
        ('acces_vendu_et_journal_retouche_apres','securite_payee_separement','acces_prepare_et_logs_alteres_avant')
     or (select count(*) from jsonb_object_keys(p_payload->'reconstruction_013'))<>3
   then raise exception 'invalid 013 reconstruction';end if;
 end if;

 if r.scenario_id='014' and p.public_role in ('enqueteur','analyste') then
   if jsonb_typeof(p_payload->'reconstruction_014')<>'object'
     or coalesce(p_payload->'reconstruction_014'->>'source','') not in
        ('export_irregulier','procedure_urgence_incomplete','acces_autorise_detourne')
     or coalesce(p_payload->'reconstruction_014'->>'transmission','') not in
        ('vente_volontaire','canal_secours_non_verifie','mandat_emploie_hors_mission')
     or coalesce(p_payload->'reconstruction_014'->>'concealment','') not in
        ('logs_retouches_pour_cacher_faille','alerte_ignoree','fausse_piste_intrusion')
     or (select count(*) from jsonb_object_keys(p_payload->'reconstruction_014'))<>3
   then raise exception 'invalid 014 reconstruction';end if;
 end if;

 if r.scenario_id='015' and p.public_role in ('enqueteur','analyste') then
   if jsonb_typeof(p_payload->'reconstruction_015')<>'object'
     or coalesce(p_payload->'reconstruction_015'->>'authority','') not in
        ('direction_refuse_suspension','direction_autorise_arret','direction_absente_blocage_admin')
     or coalesce(p_payload->'reconstruction_015'->>'continuation','') not in
        ('ordre_de_poursuite_impose','clinicien_poursuit_malgre_arret','sortie_bloquee_administrativement')
     or coalesce(p_payload->'reconstruction_015'->>'records','') not in
        ('alertes_attenuees_apres_deces','compromis_clinique_masque','delai_sortie_efface')
     or (select count(*) from jsonb_object_keys(p_payload->'reconstruction_015'))<>3
   then raise exception 'invalid 015 reconstruction';end if;
 end if;

 if r.scenario_id='016' and p.public_role in ('enqueteur','analyste') then
   if jsonb_typeof(p_payload->'reconstruction_016')<>'object'
     or coalesce(p_payload->'reconstruction_016'->>'after_video','') not in
       ('executant_reste_seul','organisateur_revient_clandestinement','executant_n_appelle_pas_les_secours')
     or coalesce(p_payload->'reconstruction_016'->>'death','') not in
       ('executant_homicide_volontaire','organisateur_homicide_volontaire','deces_violences_sedation_sans_geste_distinct')
     or coalesce(p_payload->'reconstruction_016'->>'warning','') not in
       ('intermediaire_message_trop_tard','intermediaire_ignore_retour','intermediaire_a_ete_induit_en_erreur')
     or (select count(*) from jsonb_object_keys(p_payload->'reconstruction_016'))<>3
   then raise exception 'invalid 016 reconstruction';end if;
 end if;
 if r.scenario_id='017' and p.public_role in ('enqueteur','analyste') and (jsonb_typeof(p_payload->'reconstruction_017')<>'object' or (select count(*) from jsonb_object_keys(p_payload->'reconstruction_017'))<>3 or not (p_payload->'reconstruction_017' ?& array['act','decision','cover'])) then raise exception 'invalid 017 reconstruction';end if; if r.scenario_id='018' and p.public_role in ('enqueteur','analyste') and (jsonb_typeof(p_payload->'reconstruction_018')<>'object' or (select count(*) from jsonb_object_keys(p_payload->'reconstruction_018'))<>3 or not (p_payload->'reconstruction_018' ?& array['killer','tableau','prior_plan']) or coalesce(p_payload->'reconstruction_018'->>'killer','') not in ('resident_1','resident_2') or coalesce(p_payload->'reconstruction_018'->>'tableau','') not in ('resident_1','resident_2') or coalesce(p_payload->'reconstruction_018'->>'prior_plan','') not in ('isolated_confrontation','joint_intimidation')) then raise exception 'invalid 018 reconstruction';end if; if r.scenario_id='019' and p.public_role in ('enqueteur','analyste') and (jsonb_typeof(p_payload->'reconstruction_019')<>'object' or (select count(*) from jsonb_object_keys(p_payload->'reconstruction_019'))<>3 or not (p_payload->'reconstruction_019' ?& array['mandate','knowledge','cover'])) then raise exception 'invalid 019 reconstruction';end if; if r.scenario_id='020' and p.public_role in ('enqueteur','analyste') and (jsonb_typeof(p_payload->'reconstruction_020')<>'object' or (select count(*) from jsonb_object_keys(p_payload->'reconstruction_020'))<>4 or not (p_payload->'reconstruction_020' ?& array['ignition','exits','maintenance','evacuation'])) then raise exception 'invalid 020 reconstruction';end if; note_text:=left(trim(coalesce(p_payload->>'note','')),300);
 IF p.public_role='journaliste' AND length(note_text)<(CASE WHEN is_029 THEN 24 ELSE 8 END) THEN RAISE EXCEPTION 'journalist final angle too short';END IF;
 IF note_text<>'' THEN PERFORM igr_private.assert_ugc(note_text,300,false);END IF;
 INSERT INTO public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
 VALUES(r.code,p.id,r.cycle,'final_lock',jsonb_build_object('levels',levels,'note',note_text,'version',case when is_029 then '029-v148' else 'v52' end,'reconstruction_001',case when r.scenario_id='001' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_001' else null end,'reconstruction_002',case when r.scenario_id='002' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_002' else null end,'reconstruction_003',case when r.scenario_id='003' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_003' else null end,'reconstruction_004',case when r.scenario_id='004' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_004' else null end,'reconstruction_005',case when r.scenario_id='005' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_005' else null end,'reconstruction_006',case when r.scenario_id='006' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_006' else null end,'reconstruction_007',case when r.scenario_id='007' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_007' else null end,'reconstruction_008',case when r.scenario_id='008' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_008' else null end,'reconstruction_009',case when r.scenario_id='009' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_009' else null end,'reconstruction_010',case when r.scenario_id='010' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_010' else null end,'reconstruction_011',case when r.scenario_id='011' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_011' else null end,'reconstruction_012',case when r.scenario_id='012' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_012' else null end,'reconstruction_013',case when r.scenario_id='013' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_013' else null end,'reconstruction_014',case when r.scenario_id='014' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_014' else null end,'reconstruction_015',case when r.scenario_id='015' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_015' else null end,'reconstruction_016',case when r.scenario_id='016' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_016' else null end,'reconstruction_017',case when r.scenario_id='017' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_017' else null end,'reconstruction_018',case when r.scenario_id='018' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_018' else null end,'reconstruction_019',case when r.scenario_id='019' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_019' else null end,'reconstruction_020',case when r.scenario_id='020' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_020' else null end));
 st:=public.igr_v52_maybe_finish(r.code);
 RETURN jsonb_build_object('ok',true)||st;
END $function$;
