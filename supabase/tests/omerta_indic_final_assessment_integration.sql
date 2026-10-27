-- PostgreSQL 16 isolé : vérifie les deux conditions indépendantes du pacte.
do $test$
declare
 inv public.igr_v4_players%rowtype;
 src public.igr_v4_players%rowtype;
 r jsonb;
 found jsonb;
 denied boolean;
begin
 insert into public.igr_v4_rooms(code,scenario_id,status,cycle,phase,state)
 values('ORAL021','021','playing',3,'cycle_debrief','{"match_no":2}'::jsonb);
 insert into public.igr_v4_players(room_code,pseudo,public_role,secret_role)
 values('ORAL021','Investigateur','enqueteur','enqueteur') returning * into inv;
 insert into public.igr_v4_players(room_code,pseudo,public_role,secret_role,internal_slot)
 values('ORAL021','Source orale','suspect','associato',1) returning * into src;
 insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
 values('ORAL021',src.id,2,'omerta_indic_response',
   '{"accepted":true,"match_no":2}'::jsonb);
 -- No verified intel card ever sent: only investigator usefulness counts.
 select public.igr_omerta_indic_final_assess(
   'ORAL021',inv.player_token,src.id,true,3) into r;
 if r->>'ok'<>'true' then raise exception 'final assessment failed';end if;
 if exists(select 1 from public.igr_v4_actions where room_code='ORAL021'
   and action_type='omerta_verified_intel')
 then raise exception 'test accidentally used card';end if;
 select public.igr_omerta_make_reveal('ORAL021') into r;
 select value into found from jsonb_array_elements(r->'results') value
 where value->>'player_id'=src.id::text;
 if found->>'success'<>'true'
    or found->'indic'->>'personal_condition_met'<>'true'
    or found->'indic'->>'second_condition_met'<>'true'
 then raise exception 'oral-only usefulness and reduction did not count';end if;
 denied:=false;
 begin perform public.igr_omerta_indic_final_assess(
  'ORAL021',inv.player_token,src.id,false,0);
 exception when others then denied:=true; end;
 if not denied then raise exception 'final opinion was editable';end if;
 denied:=false;
 begin perform public.igr_omerta_indic_final_assess(
  'ORAL021',src.player_token,src.id,true,3);
 exception when others then denied:=true; end;
 if not denied then raise exception 'source could evaluate itself';end if;
 -- Different match: previous authorized assessment cannot follow a rematch.
 update public.igr_v4_rooms set state='{"match_no":3}'::jsonb where code='ORAL021';
 select public.igr_omerta_make_reveal('ORAL021') into r;
 select value into found from jsonb_array_elements(r->'results') value
 where value->>'player_id'=src.id::text;
 if found->'indic' is not null then raise exception 'assessment leaked across matches';end if;
 -- A pre-lock case cannot be evaluated while any cycle or phase is active.
 update public.igr_v4_rooms set state='{"match_no":2}'::jsonb,cycle=2,phase='interrogation' where code='ORAL021';
 denied:=false;
 begin perform public.igr_omerta_indic_final_assess(
  'ORAL021',inv.player_token,src.id,true,3);
 exception when others then denied:=true; end;
 if not denied then raise exception 'premature assessment allowed';end if;
 -- C3 review event is private to investigator and has no usefulness text.
 if exists(select 1 from public.igr_v4_events e where e.room_code='ORAL021'
  and e.event_type='omerta_indic_final_review_submitted'
  and (e.visibility<>'private' or e.target_player_id<>inv.id
    or (e.payload::text) like '%useful%'))
 then raise exception 'private rating leaked to other players';end if;
end $test$;
select 'OMERTA_ORAL_ASSESSMENT_PASS' as outcome;
