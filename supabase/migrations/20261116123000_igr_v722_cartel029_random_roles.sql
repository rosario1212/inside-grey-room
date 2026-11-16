-- v722 CARTEL 029: random lobby role discovery must include BOTH mandatory
-- leadership seats in 10- and 11-player games. Role availability remains
-- constrained by igr_v4_role_capacity, so no other scenario gains these roles.
-- Existing sessions and private truths are untouched.
CREATE OR REPLACE FUNCTION public.igr_v4_choose_random_role(p_code text, p_player_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare p public.igr_v4_players%rowtype; r public.igr_v4_rooms%rowtype; player_count int; picked text;
begin
 select * into p from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token;
 if not found then raise exception 'unauthorized'; end if;
 select * into r from public.igr_v4_rooms where code=p.room_code for update;
 if not found then raise exception 'room not found'; end if;
 if r.status<>'lobby' then raise exception 'game already started'; end if;
 select count(*) into player_count from public.igr_v4_players where room_code=r.code;
 if r.scenario_id in ('021','022','023','024','025') then
   select q.role into picked from (values ('enqueteur'),('analyste'),('suspect'),('associato'),('uomo_onore'),('contabile'),('caporegime'),('consigliere'),('pentito'),('sottocapo'),('don')) as q(role)
   where public.igr_omerta_role_allowed(r.scenario_id,q.role)
     and (select count(*) from public.igr_v4_players x where x.room_code=r.code and x.id<>p.id and x.preferred_role=q.role) < case when q.role='suspect' then 7 else 1 end
   order by gen_random_uuid() limit 1;
 else
   select q.role into picked from (values ('enqueteur'),('analyste'),('suspect'),('procureur'),('juge'),('journaliste'),('maitre'),('inspecteur'),('expert'),('temoin'),('don'),('bras_droit')) as q(role)
   where public.igr_v4_role_capacity(r.scenario_id,player_count,q.role)>0
     and (select count(*) from public.igr_v4_players x where x.room_code=r.code and x.id<>p.id and x.preferred_role=q.role) < public.igr_v4_role_capacity(r.scenario_id,player_count,q.role)
   order by gen_random_uuid() limit 1;
 end if;
 if picked is null then raise exception 'no role available'; end if;
 update public.igr_v4_players set preferred_role=picked where id=p.id;
 return jsonb_build_object('ok',true,'role',picked,'scenario_id',r.scenario_id,'player_count',player_count);
end $function$

DO $v722$
BEGIN
 IF position('(''don''),(''bras_droit'')' in pg_get_functiondef('public.igr_v4_choose_random_role(text,uuid)'::regprocedure))=0
 THEN RAISE EXCEPTION '029 random leadership roster not installed'; END IF;
 IF public.igr_v4_role_capacity('029',9,'don')<>0
  OR public.igr_v4_role_capacity('029',10,'don')<>1
  OR public.igr_v4_role_capacity('029',10,'bras_droit')<>0
  OR public.igr_v4_role_capacity('029',11,'bras_droit')<>1
 THEN RAISE EXCEPTION '029 leadership limits regressed'; END IF;
END $v722$;
