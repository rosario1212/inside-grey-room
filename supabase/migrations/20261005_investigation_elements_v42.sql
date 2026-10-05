-- Inside Grey Room v42 — investigation clarity
-- Manual completion of interrogations is intentionally allowed for scenarios 001–034.
-- The server remains authoritative for the transition: the client only shortens phase_ends_at,
-- then igr_v4_tick applies the same heard/event/debrief rules used by natural timer expiry.

create or replace function public.igr_v4_end_interrogation(p_code text,p_player_token uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  p public.igr_v4_players%rowtype;
  r public.igr_v4_rooms%rowtype;
begin
  select * into p
  from public.igr_v4_players
  where room_code=upper(trim(p_code)) and player_token=p_player_token;

  if not found or p.public_role<>'enqueteur' then
    raise exception 'forbidden';
  end if;

  select * into r
  from public.igr_v4_rooms
  where code=p.room_code
  for update;

  if not found or r.phase<>'interrogation' then
    raise exception 'wrong phase';
  end if;

  update public.igr_v4_rooms
  set phase_ends_at=now(),updated_at=now()
  where code=r.code;

  perform public.igr_v4_tick(r.code);
  return jsonb_build_object('ok',true);
end
$$;

revoke all on function public.igr_v4_end_interrogation(text,uuid) from public, anon, authenticated;
grant execute on function public.igr_v4_end_interrogation(text,uuid) to anon, authenticated, service_role;
