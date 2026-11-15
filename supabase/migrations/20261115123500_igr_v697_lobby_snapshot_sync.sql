-- v697: a room is joinable in the lobby BEFORE an A/B/C private
-- variant is sealed at the authoritative game-start transition.
-- Legacy sync previously threw "NNN private snapshot missing" at lobby time
-- for cases 008..020, making some valid rooms appear disconnected.
--
-- This migration changes ONLY public.igr_omerta_legacy_sync_core.
-- Authentication, rate limits, authoritative game start and pinned secret
-- evidence for playing/finished rooms retain their previous behavior.
DO $igr_v697$
DECLARE
  ddl text;
  sid text;
  before_clause text;
  after_clause text;
  guard_020 text;
  lobby_redaction text;
  n integer;
BEGIN
  SELECT pg_get_functiondef('public.igr_omerta_legacy_sync_core(text,uuid)'::regprocedure)
    INTO ddl;
  IF ddl IS NULL OR position('igr_v601_020_pinned_pack' in ddl)=0
    OR position('SECURITY DEFINER' in ddl)=0 THEN
    RAISE EXCEPTION 'v697: unexpected sync implementation; refusing to patch';
  END IF;

  -- Never require a sealed variant while the room is still in the lobby.
  FOR n IN 8..20 LOOP
    sid:=lpad(n::text,3,'0');
    before_clause:='if r.scenario_id='''||sid||''' then pack:=';
    after_clause:='if r.scenario_id='''||sid||''' and r.status<>''lobby'' then pack:=';
    IF position(before_clause in ddl)>0 THEN
      ddl:=replace(ddl,before_clause,after_clause);
    ELSIF position(after_clause in ddl)=0 THEN
      RAISE EXCEPTION 'v697: cannot identify pinned-pack guard %',sid;
    END IF;
  END LOOP;

  -- In a lobby, the client only needs public context: no private pack,
  -- hidden variant, suspect card, evidence, or truth can leave the server.
  lobby_redaction:='if r.status=''lobby'' and r.scenario_id between ''008'' and ''020'' then pack:=jsonb_build_object(''context'',pack->>''context'');end if;';
  guard_020:='if r.scenario_id=''020'' and r.status<>''lobby'' then pack:=igr_private.igr_v601_020_pinned_pack(r.code);if pack is null then raise exception ''020 private snapshot missing'';end if;end if;';
  IF position(lobby_redaction in ddl)=0 THEN
    IF position(guard_020 in ddl)=0 THEN
      RAISE EXCEPTION 'v697: cannot find the last pinned-pack guard';
    END IF;
    ddl:=replace(ddl,guard_020,guard_020||E'\n '||lobby_redaction);
  END IF;

  EXECUTE ddl;
END
$igr_v697$;

-- Validation after applying:
-- SELECT r.scenario_id,
--        public.igr_v4_sync(r.code,p.player_token)->'room'->>'status' AS phase
-- FROM public.igr_v4_rooms r
-- JOIN public.igr_v4_players p ON p.room_code=r.code AND p.is_host
-- WHERE r.scenario_id IN ('015','019','020') AND r.status='lobby'
-- ORDER BY r.created_at DESC LIMIT 5;
