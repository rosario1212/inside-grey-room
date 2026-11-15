BEGIN;
-- TERREUR 026–028 : les convocations finales doivent refléter les six vrais rôles.
-- Correction éditoriale exclusivement ; ni durée, ni droits, ni calcul de victoire modifiés.
DO $patch$
DECLARE fn text; old_audience text; new_audience text; old_defenses text; new_defenses text;
BEGIN
 SELECT pg_get_functiondef('public.igr_v52_begin_stage(text,text)'::regprocedure) INTO fn;
 IF position('v705_terror_audience_copy' IN fn)>0 THEN RETURN; END IF;
 old_audience:=$old$when 'audience' then jsonb_build_object('title','AUDIENCE FINALE','text','Enquêteur → Analyste → Inspecteur → Expert → Procureur → Juge → Journaliste. COURT 01:00 / LONG 02:00 max. Tous peuvent passer sauf le Juge.')$old$;
 new_audience:=$new$when 'audience' then CASE WHEN r.scenario_id IN ('026','027','028') THEN
        jsonb_build_object('title','AUDIENCE FINALE · TERREUR',
          'text','L’Enquêteur puis l’Analyste présentent leur lecture des faits (COURT 01:00 / LONG 02:00 chacun). Ils peuvent passer. Les trois suspects se défendent ensuite, avant les deux conclusions individuelles.')
        ELSE jsonb_build_object('title','AUDIENCE FINALE','text','Enquêteur → Analyste → Inspecteur → Expert → Procureur → Juge → Journaliste. COURT 01:00 / LONG 02:00 max. Tous peuvent passer sauf le Juge.') END /* v705_terror_audience_copy */$new$;
 old_defenses:=$old$else jsonb_build_object('title','DÉFENSES FINALES',
          'text','Chaque suspect peut parler COURT 02:00 / LONG 03:00 ou passer. Son Avocat officiel partage ce temps ; il n’existe pas de second plaidoyer séparé.')$old$;
 new_defenses:=$new$else CASE WHEN r.scenario_id IN ('026','027','028') THEN
        jsonb_build_object('title','DÉFENSES FINALES · TERREUR',
          'text','Les trois suspects présentent leur défense à tour de rôle (COURT 02:00 / LONG 03:00 chacun), ou passent. Il n’y a ni Avocat ni Juge dans TERREUR.')
        ELSE jsonb_build_object('title','DÉFENSES FINALES',
          'text','Chaque suspect peut parler COURT 02:00 / LONG 03:00 ou passer. Son Avocat officiel partage ce temps ; il n’existe pas de second plaidoyer séparé.') END$new$;
 IF strpos(fn,old_audience)=0 OR strpos(fn,old_defenses)=0 THEN
   RAISE EXCEPTION 'v705 final-phase message anchors changed; manual review';
 END IF;
 fn:=replace(replace(fn,old_audience,new_audience),old_defenses,new_defenses);
 EXECUTE fn;
END $patch$;
DO $assert$
DECLARE fn text;
BEGIN
 SELECT pg_get_functiondef('public.igr_v52_begin_stage(text,text)'::regprocedure) INTO fn;
 IF strpos(fn,'v705_terror_audience_copy')=0 OR strpos(fn,'DÉFENSES FINALES · TERREUR')=0
 THEN RAISE EXCEPTION 'v705 TERREUR final audience copy not installed'; END IF;
END $assert$;
COMMIT;
