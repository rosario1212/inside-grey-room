-- 011's optional Prosecutor receives cycle-limited, variant-aware prompts:
-- only briefing at cycle 1, then already-introduced evidence from prior cycle.
-- Never returns private verdict, unintroduced future evidence or other cards.
CREATE OR REPLACE FUNCTION public.igr_v47_prosecutor_state(p_code text,p_player_token uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $f$
DECLARE s jsonb; r public.igr_v4_rooms%rowtype; p public.igr_v4_players%rowtype;
 pack jsonb; prior_evidence jsonb; strategic_note text;
BEGIN
 s:=public.igr_v50_prosecutor_state_legacy(p_code,p_player_token);
 SELECT * INTO p FROM public.igr_v4_players WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token;
 IF NOT FOUND OR p.public_role<>'procureur' THEN RAISE EXCEPTION 'forbidden';END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=p.room_code;
 IF r.scenario_id='011' AND r.status='playing' AND r.cycle BETWEEN 1 AND 3 THEN
  IF r.cycle=1 THEN
   strategic_note:='Trois questions à garder séparées : qui a donné un ordre, qui l’a exécuté, et qui pouvait empêcher ou signaler les violences ? Demande une source et un horaire pour chaque affirmation. Une coopération n’efface pas une responsabilité.';
  ELSE
   pack:=igr_private.igr_v371_011_pinned_pack(r.code);
   IF pack IS NULL THEN RAISE EXCEPTION '011 pinned variant not found';END IF;
   SELECT x INTO prior_evidence FROM jsonb_array_elements(pack->'trames') x
    WHERE (x->>'min_cycle')::int=r.cycle-1 LIMIT 1;
   IF prior_evidence IS NULL THEN RAISE EXCEPTION '011 prior evidence missing';END IF;
   strategic_note:='Repars de la pièce déjà dévoilée : « '||
    coalesce(prior_evidence->>'title','')||' » — '||
    coalesce(prior_evidence->>'text','')||
    ' Demande au suspect de distinguer son ordre, son acte et ce qu’il a appris ensuite. Ne transforme pas sa coopération en aveu ni en preuve autonome.';
  END IF;
  s:=s||jsonb_build_object('case_strategy',strategic_note,'case_strategy_cycle',r.cycle);
 END IF;
 RETURN s||jsonb_build_object('version','v495','free_players','[]'::jsonb,'completed_this_cycle',null,'minimum_met',true,'interview',null,'natural_interactions',true);
END;
$f$;

UPDATE public.igr_v4_scenario_packs
SET pack=jsonb_set(pack,'{role_notes,juge}',coalesce(pack#>'{role_notes,juge}','{}'::jsonb)||
 jsonb_build_object('position','Trois points de protection au total : les pièces p1 et p2 coûtent chacune un point, p3 en coûte deux. Arbitre la nécessité de protéger la source sans transformer une contradiction en condamnation.',
 'anchors','Statue sur les pièces contradictoires et les accès demandés. La protection p3 coûte deux points, p1 et p2 un seul. Il est impossible de décider une fois la révélation finale engagée.'),true),
updated_at=now() WHERE scenario_id='008';
