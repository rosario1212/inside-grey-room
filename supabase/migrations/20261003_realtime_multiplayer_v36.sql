-- Inside Grey Room v36 — multiplayer realtime coalescing
-- One gameplay RPC can touch room + players + events + actions in the same transaction.
-- Coalesce those trigger calls into one public realtime revision per room/transaction.

alter table igr_private.igr_v4_room_realtime_map
  add column if not exists last_bump_xid text;

create or replace function igr_private.igr_v4_bump_room_realtime(p_room_code text)
returns void
language plpgsql
security definer
set search_path='public','igr_private'
as $$
declare
  v_token uuid;
  v_xid text:=pg_current_xact_id()::text;
begin
  update igr_private.igr_v4_room_realtime_map m
  set last_bump_xid=v_xid
  where m.room_code=upper(trim(p_room_code))
    and m.last_bump_xid is distinct from v_xid
  returning m.signal_token into v_token;

  -- No map means no room signal yet; same xid means this RPC already emitted one.
  if v_token is null then return; end if;

  update public.igr_v4_room_realtime
  set revision=revision+1,
      updated_at=clock_timestamp(),
      closed=false
  where signal_token=v_token;
end;
$$;

comment on column igr_private.igr_v4_room_realtime_map.last_bump_xid is
  'Transaction id of the last realtime bump; prevents duplicate invalidations inside one gameplay RPC.';
