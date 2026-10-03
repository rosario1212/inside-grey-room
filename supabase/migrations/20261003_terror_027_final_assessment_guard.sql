-- Inside Grey Room — TERREUR 027 final assessment guard
-- Credibility and sincerity are final judgements, not buttons to lock at the start of the investigation.

create or replace function public.igr_v33_terror_rate(p_code text,p_player_token uuid,p_axis text,p_value text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.igr_v4_players%rowtype;
  r public.igr_v4_rooms%rowtype;
  st jsonb;
  rt jsonb;
  assessments jsonb;
  actor_label text;
begin
  select * into p from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found then raise exception 'unauthorized'; end if;
  select * into r from public.igr_v4_rooms where code=p.room_code for update;
  if r.scenario_id<>'027' or r.status<>'playing' then raise exception 'not available'; end if;
  if r.phase<>'locking' then raise exception 'assessment available during locking'; end if;

  if p_axis='credibility' then
    if p.public_role<>'enqueteur' then raise exception 'enqueteur only'; end if;
    if p_value not in ('incertaine','plausible','solide') then raise exception 'invalid value'; end if;
    actor_label:='L’Enquêteur';
  elsif p_axis='sincerity' then
    if p.public_role<>'analyste' then raise exception 'analyste only'; end if;
    if p_value not in ('faible','incertaine','forte') then raise exception 'invalid value'; end if;
    actor_label:='L’Analyste';
  else raise exception 'invalid axis'; end if;

  st:=coalesce(r.state,'{}'::jsonb);
  rt:=coalesce(st->'terror_runtime','{}'::jsonb);
  assessments:=coalesce(rt->'assessments','{}'::jsonb);
  if assessments ? p_axis then return jsonb_build_object('ok',true,'runtime',rt,'already_locked',true); end if;
  assessments:=jsonb_set(assessments,array[p_axis],to_jsonb(p_value),true);
  rt:=jsonb_set(rt,'{assessments}',assessments,true);
  st:=jsonb_set(st,'{terror_runtime}',rt,true);
  update public.igr_v4_rooms set state=st,updated_at=now() where code=r.code;
  insert into public.igr_v4_events(room_code,event_type,payload)
  values(r.code,'terror_assessment',jsonb_build_object('title','ÉVALUATION VERROUILLÉE','text',actor_label||' a verrouillé son évaluation indépendamment.'));
  return jsonb_build_object('ok',true,'runtime',rt);
end
$$;

revoke all on function public.igr_v33_terror_rate(text,uuid,text,text) from public,anon,authenticated;
grant execute on function public.igr_v33_terror_rate(text,uuid,text,text) to anon,authenticated;
