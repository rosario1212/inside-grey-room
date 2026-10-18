-- Run as the database administrator. Every synthetic write is rolled back.
begin;
do $$
declare owner_id uuid; fixture_room_id uuid := gen_random_uuid(); request_id uuid := gen_random_uuid(); v jsonb;
begin
  select id into owner_id from public.igr_social_profiles limit 1;
  if owner_id is null then raise exception 'Storage fixture needs one existing profile'; end if;
  insert into igr_casino_private.casino_rooms(id,invite_code,owner_profile_id,state,initial_state)
  values(fixture_room_id,'CQQQQQQQQQ',owner_id,'{"status":"lobby","revision":0}','{"status":"lobby","revision":0}');
  v:=public.igr_casino_storage_commit(fixture_room_id,0,request_id,'synthetic',repeat('a',64),'{"type":"FIXTURE"}','{"status":"lobby","revision":1}');
  if (v->>'revision')::integer<>1 then raise exception 'Snapshot not committed'; end if;
  v:=public.igr_casino_storage_commit(fixture_room_id,0,request_id,'synthetic',repeat('a',64),'{"type":"FIXTURE"}','{"status":"lobby","revision":1}');
  if (v->>'revision')::integer<>1 or v->>'replayed'<>'true' then raise exception 'Duplicate command was reapplied'; end if;
  begin
    perform public.igr_casino_storage_commit(fixture_room_id,0,gen_random_uuid(),'synthetic',repeat('b',64),'{}','{"revision":1}');
    raise exception 'Stale revision accepted';
  exception when raise_exception then if sqlerrm<>'revision_conflict' then raise; end if; end;
  begin
    perform public.igr_casino_storage_commit(fixture_room_id,1,request_id,'other',repeat('a',64),'{}','{"revision":2}');
    raise exception 'Foreign replay accepted';
  exception when raise_exception then if sqlerrm<>'idempotency_key_conflict' then raise; end if; end;
  if (select count(*) from igr_casino_private.casino_journal where casino_journal.room_id=fixture_room_id)<>1 then raise exception 'Journal is inconsistent'; end if;
end $$;
set local role service_role;
do $$begin
  if not has_schema_privilege(current_user,'igr_casino_private','USAGE') then raise exception 'Service cannot reach Casino'; end if;
  perform public.igr_casino_approved_releases();
  perform public.igr_casino_storage_read(null,'CQQQQQQQQQ');
end $$;
reset role;
set local role anon;
do $$begin
  begin perform public.igr_casino_storage_read(null,'CQQQQQQQQQ');raise exception 'Anonymous read accepted';
  exception when insufficient_privilege then null;end;
  begin perform * from igr_casino_private.casino_rooms;raise exception 'Anonymous table read accepted';
  exception when insufficient_privilege then null;end;
end $$;
reset role;
set local role authenticated;
do $$begin
  begin perform public.igr_casino_approved_releases();raise exception 'Client secret release read accepted';
  exception when insufficient_privilege then null;end;
end $$;
reset role;
rollback;
