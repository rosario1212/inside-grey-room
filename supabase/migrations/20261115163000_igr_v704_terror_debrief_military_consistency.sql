BEGIN;
-- TERREUR V704: the final cycle report must describe the Officer's last
-- v694 military decision, not the retired v688 one-order system.
-- No changes to score, verdicts, private variants or military effects.
DO $patch$
DECLARE fn text;
BEGIN
 SELECT pg_get_functiondef('igr_private.igr_v681_terror_dynamic_room()'::regprocedure) INTO fn;
 IF position('v704_terror_debrief_canonical_last_order' IN fn)>0 THEN RETURN;END IF;
 IF position('group_survives boolean;' IN fn)=0 OR
    position('military_choice:=coalesce(military_choice,''tenir'');' IN fn)=0 OR
    position('band:=CASE' IN fn)=0 OR
    position('''military_operation'',military_choice,' IN fn)=0 OR
    position('''decision_effect'',CASE' IN fn)=0
 THEN RAISE EXCEPTION 'v704 base trigger changed; manual review required';END IF;
 fn:=replace(fn,'group_survives boolean;','group_survives boolean; v704_order jsonb;');
 fn:=replace(fn,'military_choice:=coalesce(military_choice,''tenir'');',
 $patchline$
 military_choice:=coalesce(military_choice,'tenir');
 -- v704_terror_debrief_canonical_last_order: v694 owns all three military orders.
 IF coalesce((new.state#>>'{terror_v694,enabled}')::boolean,false) THEN
  SELECT a.payload INTO v704_order
  FROM public.igr_v4_actions a
  WHERE a.room_code=new.code AND a.cycle=old.cycle
    AND a.action_type='terror_v694_military'
    AND (a.payload->>'slot')::int=3
  ORDER BY a.id DESC LIMIT 1;
  military_choice:=coalesce(v704_order->>'choice','tenir');
 END IF;
 $patchline$);
 fn:=replace(fn,
 $from$band:=CASE
     WHEN military_choice='reconquerir' AND correct_count>=5 THEN 'RECONQUÊTE NATIONALE'
     WHEN military_choice='reconquerir' AND correct_count<3 THEN 'OFFENSIVE ÉCHOUÉE · LE FDR ACCÉLÈRE'
     WHEN military_choice='proteger' THEN 'PROTECTION DES CIVILS'
     WHEN military_choice='tenir' AND correct_count>=5 THEN 'DÉFENSE TENUE · DOSSIER VÉRIFIÉ'
     WHEN correct_count>=3 THEN 'PRESSION CONTENUE' ELSE 'AVANCÉE DU FDR' END;$from$,
 $to$band:=CASE WHEN v704_order IS NOT NULL THEN
   CASE military_choice
     WHEN 'reconquerir' THEN CASE
       WHEN coalesce((v704_order->>'delta')::int,0)<0 THEN 'RECONQUÊTE TENTÉE · PRESSION RÉDUITE'
       ELSE 'RECONQUÊTE TENTÉE · PRESSION ACCRUE' END
     WHEN 'proteger' THEN 'PROTECTION DES CIVILS'
     ELSE 'DÉFENSE DES POSITIONS' END
   ELSE CASE
     WHEN military_choice='reconquerir' AND correct_count>=5 THEN 'RECONQUÊTE NATIONALE'
     WHEN military_choice='reconquerir' AND correct_count<3 THEN 'OFFENSIVE ÉCHOUÉE · LE FDR ACCÉLÈRE'
     WHEN military_choice='proteger' THEN 'PROTECTION DES CIVILS'
     WHEN military_choice='tenir' AND correct_count>=5 THEN 'DÉFENSE TENUE · DOSSIER VÉRIFIÉ'
     WHEN correct_count>=3 THEN 'PRESSION CONTENUE' ELSE 'AVANCÉE DU FDR' END END;$to$);
 fn:=replace(fn,'''military_operation'',military_choice,',
  '''military_operation'',military_choice,'||
  E'\n       ''military_order_label'',v704_order->>''label'','||
  E'\n       ''military_order_text'',v704_order->>''text'',');
 fn:=replace(fn,
 $from$'decision_effect',CASE
         WHEN military_choice='reconquerir' AND correct_count>=5 THEN 'national_reconquest'
         WHEN military_choice='proteger' THEN 'civilian_protection'
         WHEN correct_count>=3 THEN 'defensive_hold'
         ELSE 'fdr_breakthrough' END$from$,
 $to$'decision_effect',CASE WHEN v704_order IS NOT NULL THEN
          CASE
           WHEN military_choice='reconquerir' AND v704_order->>'text'
             LIKE 'Un secteur contesté est repris.%' THEN 'national_reconquest'
           WHEN military_choice='reconquerir' AND coalesce((v704_order->>'delta')::int,0)>0 THEN 'fdr_breakthrough'
           WHEN military_choice='proteger' THEN 'civilian_protection'
           ELSE 'defensive_hold' END
         ELSE CASE
           WHEN military_choice='reconquerir' AND correct_count>=5 THEN 'national_reconquest'
           WHEN military_choice='proteger' THEN 'civilian_protection'
           WHEN correct_count>=3 THEN 'defensive_hold'
           ELSE 'fdr_breakthrough' END END$to$);
 IF position('v704_terror_debrief_canonical_last_order' IN fn)=0 OR
    position('''military_order_label'',v704_order->>''label''' IN fn)=0 THEN
    RAISE EXCEPTION 'v704 debrief rewrite incomplete';END IF;
 EXECUTE fn;
END $patch$;

-- The v694 action schema remains the only military source for all 026–028 rooms.
DO $audit$
DECLARE s text;
BEGIN
 SELECT pg_get_functiondef('igr_private.igr_v681_terror_dynamic_room()'::regprocedure) INTO s;
 IF position('v704_terror_debrief_canonical_last_order' IN s)=0 OR
    position('''military_order_text'',v704_order->>''text''' IN s)=0
 THEN RAISE EXCEPTION 'v704 debrief consistency not installed'; END IF;
END $audit$;
COMMIT;
