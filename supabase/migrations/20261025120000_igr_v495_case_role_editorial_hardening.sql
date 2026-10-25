-- Focused correction of IGR 003 / 008 / 009 / 011. No approved manuscript mutation.
-- Correct closure, 008 accounting, and variant-aware expert interpretation.
CREATE OR REPLACE FUNCTION public.igr_v44_protection_count(p_room text)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $limit$
 SELECT CASE WHEN EXISTS(SELECT 1 FROM public.igr_v4_rooms rr WHERE rr.code=p_room AND rr.scenario_id='008')
  THEN COALESCE((SELECT sum(GREATEST(1,COALESCE((a.payload->>'cost')::integer,1)))::integer
   FROM public.igr_v4_actions a WHERE a.room_code=p_room AND a.action_type='judge' AND a.payload->>'source' IN ('v65','v495')),0)
  ELSE (SELECT count(*)::integer FROM public.igr_v44_judge_requests q WHERE q.room_code=p_room AND q.protection_consumed=true)
 END
$limit$;

CREATE OR REPLACE FUNCTION igr_private.igr_v495_expert_actions(
 p_case text,p_base jsonb,p_brief text,p_trames jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SET search_path TO ''
AS $expert$
DECLARE entry jsonb; chosen jsonb; res jsonb:='[]'::jsonb; id text; min_c integer; context text; critique text;
BEGIN
 IF p_case NOT IN ('003','009') THEN RAISE EXCEPTION 'unapproved specialist pack'; END IF;
 IF jsonb_array_length(coalesce(p_trames,'[]'::jsonb))<>3 THEN RAISE EXCEPTION 'expert reference chronology incomplete'; END IF;
 FOR entry IN SELECT value FROM jsonb_array_elements(p_base) WITH ORDINALITY x(value,ord) ORDER BY ord LOOP
   id:=entry->>'id';
   min_c:=CASE id WHEN 'e2' THEN 2 WHEN 'e3' THEN 3 ELSE 1 END;
   chosen:=NULL;
   IF id='e2' THEN SELECT x INTO chosen FROM jsonb_array_elements(p_trames) x WHERE (x->>'min_cycle')::integer=1 LIMIT 1; END IF;
   IF id='e3' THEN SELECT x INTO chosen FROM jsonb_array_elements(p_trames) x WHERE (x->>'min_cycle')::integer=2 LIMIT 1; END IF;
   IF id='e1' THEN
      context:=' Point de départ propre à ce dossier : '||left(coalesce(p_brief,''),310)||
      ' Examine la chronologie et distingue les décisions consignées des interprétations.';
      critique:=' Le contexte public ne prouve pas à lui seul une faute individuelle.';
   ELSIF chosen IS NOT NULL THEN
      context:=' Pièce déjà introduite au cycle précédent : « '||coalesce(chosen->>'title','')||
       ' ». Elle indique : '||coalesce(chosen->>'text','')||
       ' Confronte cette source aux versions et aux destinataires ; ne déduis aucune culpabilité du seul document.';
      critique:=' La source du cycle précédent reste soumise au recoupement et ne peut être utilisée pour anticiper des pièces futures.';
   ELSE
      context:=' Examine les hypothèses alternatives uniquement à partir des sources déjà communiquées pendant cette partie.';
      critique:=' Une piste plausible sans trace indépendante reste une hypothèse.';
   END IF;
   entry:=entry || jsonb_build_object(
    'min_cycle',min_c,
    'result',coalesce(entry->>'result','')||E'\n\nAPPLICATION À CETTE VARIANTE —'||context,
    'counter_result',coalesce(entry->>'counter_result','')||critique
   );
   res:=res||jsonb_build_array(entry);
 END LOOP;
 RETURN res;
END;
$expert$;
REVOKE ALL ON FUNCTION igr_private.igr_v495_expert_actions(text,jsonb,text,jsonb) FROM PUBLIC,anon,authenticated;

-- Expand the shortest 003 discoveries with explicit follow-up questions, never new facts.
CREATE OR REPLACE FUNCTION igr_private.igr_v495_enrich_003_investigations(p_items jsonb)
RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SET search_path TO ''
AS $enrich$
DECLARE it jsonb; out_items jsonb:='[]'::jsonb; followup text; title text; original text;
BEGIN
 IF jsonb_array_length(coalesce(p_items,'[]'::jsonb))<>9 THEN RAISE EXCEPTION '003 investigation matrix incomplete';END IF;
 FOR it IN SELECT value FROM jsonb_array_elements(p_items) WITH ORDINALITY t(value,ord) ORDER BY ord LOOP
  title:=lower(coalesce(it->>'title',''));original:=coalesce(it->>'result','');
  IF length(original)<112 THEN
   followup:=CASE
    WHEN title LIKE '%réception%' OR title LIKE '%destinataire%' OR title LIKE '%transmission%' OR title LIKE '%notification%' OR title LIKE '%avis%' THEN
      'Question de recoupement : qui a effectivement reçu ce document, à quelle heure, et quelle autre trace atteste qu’il en connaissait le contenu ?'
    WHEN title LIKE '%signature%' OR title LIKE '%validation%' OR title LIKE '%conformité%' OR title LIKE '%clôture%' THEN
      'Question de recoupement : la signature indique-t-elle une décision, une exécution ou seulement la fermeture administrative d’une étape ? Compare les heures.'
    WHEN title LIKE '%copie%' OR title LIKE '%version%' OR title LIKE '%original%' OR title LIKE '%synthèse%' OR title LIKE '%procès-verbal%' THEN
      'Question de recoupement : compare les versions, leurs dates et leurs auteurs. Identifie précisément la différence sans attribuer d’intention non démontrée.'
    WHEN title LIKE '%contrôl%' OR title LIKE '%réserve%' OR title LIKE '%relecture%' THEN
      'Question de recoupement : distingue une objection émise, une objection reçue et une objection effectivement levée. Qui pouvait agir sur chacune ?'
    WHEN title LIKE '%directeur%' OR title LIKE '%direction%' OR title LIKE '%demande%' OR title LIKE '%mission%' OR title LIKE '%affectation%' THEN
      'Question de recoupement : une demande ou une instruction ne prouve pas à elle seule un acte exécuté. Recherche une confirmation indépendante et datée.'
    ELSE
      'Question de recoupement : quelle conclusion exacte cette pièce permet-elle, et qu’est-ce qu’elle laisse indéterminé sur l’action et la responsabilité ?'
   END;
   it:=jsonb_set(it,'{result}',to_jsonb(original||E'\n\nÀ confronter — '||followup),true);
  END IF;
  out_items:=out_items||jsonb_build_array(it);
 END LOOP;
 RETURN out_items;
END;
$enrich$;
REVOKE ALL ON FUNCTION igr_private.igr_v495_enrich_003_investigations(jsonb) FROM PUBLIC,anon,authenticated;

DO $patch$
DECLARE f text; src text; before text; after text; functions_to_update text[]:=ARRAY[
 'igr_v50_expert_analyze','igr_v50_expert_state','igr_v50_counter_expertise',
 'igr_v50_share_expert_result','igr_v49_publish_expert_result','igr_v49_expert_public_state'];
BEGIN
 -- 003: immutably pinned 3 variant pack, with robust runtime investigation prose.
 SELECT pg_get_functiondef(p.oid) INTO src FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='igr_private' AND p.proname='igr_v220_003_build_pack';
 before:='''investigation_003'',v->''v220_investigations''';
 after:='''investigation_003'',igr_private.igr_v495_enrich_003_investigations(v->''v220_investigations'')';
 IF position(before in src)=0 THEN RAISE EXCEPTION '003 investigation builder changed';END IF;
 src:=replace(src,before,after);
 before:='''expert_actions'',coalesce(base->''expert_actions'',''[]''::jsonb)';
 after:='''expert_actions'',igr_private.igr_v495_expert_actions(''003'',coalesce(base->''expert_actions'',''[]''::jsonb),v->>''v220_public_briefing'',v->''v220_runtime_trames'')';
 IF position(before in src)=0 THEN RAISE EXCEPTION '003 expert builder changed';END IF;
 EXECUTE replace(src,before,after);

 -- 009: add variant-aware specialized analysis into pinned packet.
 SELECT pg_get_functiondef(p.oid) INTO src FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='igr_private' AND p.proname='igr_v330_009_build_pack';
 before:='''context'',m->>''public_briefing'',';
 after:='''context'',m->>''public_briefing'','||E'\n  '||
 '''expert_actions'',igr_private.igr_v495_expert_actions(''009'',coalesce(base->''expert_actions'',''[]''::jsonb),m->>''public_briefing'',t),';
 IF position(before in src)=0 THEN RAISE EXCEPTION '009 expert builder changed';END IF;
 EXECUTE replace(src,before,after);

 -- Six expert endpoints operate against the actual immutable room snapshot
 -- for 003/009, never the static dossier. Other scenarios remain unchanged.
 FOREACH f IN ARRAY functions_to_update LOOP
   SELECT pg_get_functiondef(p.oid) INTO src FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname=f;
   before:=CASE
    WHEN f IN ('igr_v50_expert_state','igr_v49_expert_public_state') THEN
       'select sp.pack into pack from public.igr_v4_scenario_packs sp where sp.scenario_id=r.scenario_id;'
    ELSE NULL END;
   IF before IS NULL THEN
      IF f='igr_v49_publish_expert_result' THEN
        before:='select x.pack into pack from public.igr_v4_scenario_packs x where x.scenario_id=r.scenario_id;';
      ELSE
        before:='select sp.pack into pack from public.igr_v4_scenario_packs sp where sp.scenario_id=r.scenario_id;';
      END IF;
   END IF;
   IF position(before in src)=0 THEN
      IF f='igr_v49_expert_public_state' THEN
        before:='select x.pack into pack from public.igr_v4_scenario_packs x where x.scenario_id=r.scenario_id;';
      END IF;
   END IF;
   IF position(before in src)=0 THEN RAISE EXCEPTION '% base pack lookup changed',f;END IF;
   after:=before||E'\n '||'if r.scenario_id=''003'' then pack:=coalesce(igr_private.igr_v220_003_pinned_pack(r.code),pack); '||
    'elsif r.scenario_id=''009'' then pack:=coalesce(igr_private.igr_v331_009_pinned_pack(r.code),pack);end if;';
   src:=replace(src,before,after);
   IF f='igr_v50_expert_analyze' THEN
     before:='if item is null then raise exception ''invalid choice''; end if;';
     after:=before||E'\n '||
     'if r.scenario_id in (''003'',''009'') and r.cycle<coalesce((item->>''min_cycle'')::integer,1) then raise exception ''expertise unlocks in a later cycle'';end if;';
     IF position(before in src)=0 THEN RAISE EXCEPTION 'expert cycle guard missing'; END IF;
     src:=replace(src,before,after);
   ELSIF f='igr_v50_expert_state' THEN
     before:='''title'',it->>''title'',''used'',';
     after:='''title'',it->>''title'',''min_cycle'',coalesce((it->>''min_cycle'')::integer,1),''available'',r.cycle>=coalesce((it->>''min_cycle'')::integer,1),''used'',';
     IF position(before in src)=0 THEN RAISE EXCEPTION 'expert state catalog changed'; END IF;
     src:=replace(src,before,after);
     before:='''can_counter'',not counter_used and jsonb_array_length(completed)>0';
     after:='''can_counter'',r.status=''playing'' and r.phase not in (''closed'',''provisional_lock'',''defense'',''final_debrief'',''locking'',''judge_speech'',''judge_integrity_vote'',''reveal'') and not counter_used and jsonb_array_length(completed)>0';
     IF position(before in src)=0 THEN RAISE EXCEPTION 'expert can_counter contract changed';END IF;
     src:=replace(src,before,after);
   ELSIF f='igr_v50_counter_expertise' THEN
      before:='select * into r from public.igr_v4_rooms where code=me.room_code;';
      after:='select * into r from public.igr_v4_rooms where code=me.room_code for update;'||
        ' if r.scenario_id in (''003'',''009'') and (r.status<>''playing'' or r.cycle not between 1 and 3 or r.phase in (''closed'',''provisional_lock'',''defense'',''final_debrief'',''locking'',''judge_speech'',''judge_integrity_vote'',''reveal'')) then raise exception ''counter-expertise closed'';end if;';
      IF position(before in src)=0 THEN RAISE EXCEPTION 'counter-expertise room guard changed';END IF;
      src:=replace(src,before,after);
   ELSIF f='igr_v50_share_expert_result' THEN
      before:='select * into r from public.igr_v4_rooms where code=me.room_code;';
      after:=before||' if r.scenario_id in (''003'',''009'') and (r.status<>''playing'' or r.phase in (''closed'',''provisional_lock'',''defense'',''final_debrief'',''locking'',''judge_speech'',''judge_integrity_vote'',''reveal'')) then raise exception ''sharing closed'';end if;';
      IF position(before in src)=0 THEN RAISE EXCEPTION 'expert private share guard changed';END IF;
      src:=replace(src,before,after);
   END IF;
   EXECUTE src;
 END LOOP;

 -- Juge 008: submissions and decisions stop before final reveal.
 FOREACH f IN ARRAY ARRAY['igr_v44_submit_judge_request','igr_v44_judge_decide_request'] LOOP
   SELECT pg_get_functiondef(p.oid) INTO src FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname=f;
   IF f='igr_v44_decide_request' THEN NULL; END IF;
   IF f='igr_v44_submit_judge_request' THEN
     before:='if not found or r.status<>''playing'' or r.cycle not between 1 and 3 then';
     after:='if not found or r.status<>''playing'' or r.cycle not between 1 and 3 or (r.scenario_id=''008'' and r.phase in (''closed'',''provisional_lock'',''defense'',''final_debrief'',''locking'',''judge_speech'',''judge_integrity_vote'',''reveal'')) then';
   ELSE
     before:='select * into r from public.igr_v4_rooms where code=me.room_code for update;';
     after:=before||E'\n '||'if r.scenario_id=''008'' and (r.status<>''playing'' or r.cycle not between 1 and 3 or r.phase in (''closed'',''provisional_lock'',''defense'',''final_debrief'',''locking'',''judge_speech'',''judge_integrity_vote'',''reveal'')) then raise exception ''judge decision closed'';end if;';
   END IF;
   IF position(before in src)=0 THEN RAISE EXCEPTION 'judge % closure anchor changed',f;END IF;
   src:=replace(src,before,after);
   IF f='igr_v44_judge_decide_request' THEN
     before:='v_note text;';
     after:='v_note text; item_cost integer:=1;';
     IF position(before in src)=0 THEN RAISE EXCEPTION 'judge declarations changed';END IF;
     src:=replace(src,before,after);
     before:='used:=public.igr_v44_protection_count(r.code);';
     after:='if r.scenario_id=''008'' and consume and q.element_id is not null then '||
        'select greatest(1,least(3,coalesce((e->>''cost'')::integer,1))) into item_cost '||
        'from public.igr_v4_scenario_packs sp cross join lateral jsonb_array_elements(coalesce(sp.pack->''protected'',''[]''::jsonb)) e '||
        'where sp.scenario_id=''008'' and e->>''id''=q.element_id limit 1; '||
        'if item_cost is null then raise exception ''invalid protected cost'';end if;end if;'||E'\n '||before;
     IF position(before in src)=0 THEN RAISE EXCEPTION 'judge protection measurement changed';END IF;
     src:=replace(src,before,after);
     before:='if consume and used>=3 then raise exception ''protection quota reached''; end if;';
     after:='if consume and used+item_cost>3 then raise exception ''protection quota reached'';end if;';
     IF position(before in src)=0 THEN RAISE EXCEPTION 'judge quota anchor changed'; END IF;
     src:=replace(src,before,after);
     before:='used_after:=used+case when consume then 1 else 0 end;';
     after:='used_after:=used+case when consume then item_cost else 0 end;';
     IF position(before in src)=0 THEN RAISE EXCEPTION 'judge counter anchor changed';END IF;
     src:=replace(src,before,after);
     before:='''choice'',q.element_id,''cost'',1,''source'',''v65''';
     after:='''choice'',q.element_id,''cost'',item_cost,''source'',case when r.scenario_id=''008'' then ''v495'' else ''v65'' end';
     IF position(before in src)=0 THEN RAISE EXCEPTION 'judge cost action anchor changed';END IF;
     src:=replace(src,before,after);
   END IF;
   EXECUTE src;
 END LOOP;
END
$patch$;

DO $verify$
DECLARE sid text; vid text; p jsonb;
BEGIN
 FOREACH sid IN ARRAY ARRAY['003','009'] LOOP
  FOREACH vid IN ARRAY ARRAY['A','B','C'] LOOP
   IF sid='003' THEN
     SELECT igr_private.igr_v220_003_build_pack(manuscript) INTO p FROM igr_private.igr_v99_variant_manuscripts WHERE scenario_id=sid AND variant_id=vid;
     IF (SELECT min(length(x->>'result')) FROM jsonb_array_elements(p->'investigation_003') x)<112 THEN RAISE EXCEPTION '003 inquiry too short variant %',vid;END IF;
   ELSE p:=igr_private.igr_v330_009_build_pack(vid); END IF;
   IF jsonb_array_length(p->'expert_actions')<>4 OR p#>>'{expert_actions,1,min_cycle}'<>'2' OR p#>>'{expert_actions,2,min_cycle}'<>'3'
     THEN RAISE EXCEPTION 'incorrect gated specialized actions % %',sid,vid;END IF;
   IF jsonb_array_length(p->'trames')<>3 OR jsonb_array_length(p->'suspects')<>3 THEN RAISE EXCEPTION 'private pack changed';END IF;
  END LOOP;
 END LOOP;
 IF public.igr_v4_min_players('003')<>4 OR public.igr_v4_max_players('011')<>6 THEN RAISE EXCEPTION 'roster regressed';END IF;
END
$verify$;
