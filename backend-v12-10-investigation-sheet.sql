-- Inside Grey Room v12.10 — shared investigation sheet
-- Applied to Supabase production on 2026-09-28.
-- The current focus is public room state: it is visible to every role, editable only by the Investigator,
-- and intentionally does not alter adaptive trame selection.

create or replace function public.igr_v4_set_investigation_focus(
  p_code text,
  p_player_token uuid,
  p_focus text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  p public.igr_v4_players%rowtype;
  r public.igr_v4_rooms%rowtype;
  v_focus text;
  v_label text;
  v_payload jsonb;
begin
  perform igr_private.rate_limit('investigation_focus', p_player_token::text, 20, 60);

  select * into p
  from public.igr_v4_players
  where room_code = upper(trim(p_code))
    and player_token = p_player_token;

  if not found or p.public_role <> 'enqueteur' then
    raise exception 'forbidden';
  end if;

  perform public.igr_v4_tick(p.room_code);
  select * into r
  from public.igr_v4_rooms
  where code = p.room_code
  for update;

  if not found or r.status <> 'playing' then
    raise exception 'closed';
  end if;

  if r.phase in ('briefing','role_reading','locking','reveal') then
    raise exception 'wrong phase';
  end if;

  v_focus := lower(trim(coalesce(p_focus, 'libre')));
  case v_focus
    when 'libre' then v_label := 'Discussion libre';
    when 'chronologie' then v_label := 'Chronologie';
    when 'acces' then v_label := 'Accès & déplacements';
    when 'temoignages' then v_label := 'Témoignages & versions';
    when 'mobile' then v_label := 'Motifs & intérêts';
    when 'materiel' then v_label := 'Éléments matériels';
    when 'responsabilite' then v_label := 'Responsabilités';
    else raise exception 'invalid focus';
  end case;

  v_payload := jsonb_build_object(
    'key', v_focus,
    'label', v_label,
    'cycle', r.cycle,
    'updated_at', clock_timestamp(),
    'updated_by', p.id
  );

  update public.igr_v4_rooms
  set state = jsonb_set(coalesce(state, '{}'::jsonb), '{investigation_focus}', v_payload, true),
      updated_at = now()
  where code = r.code;

  return jsonb_build_object('ok', true, 'focus', v_payload);
end
$function$;

revoke all on function public.igr_v4_set_investigation_focus(text, uuid, text) from public;
revoke all on function public.igr_v4_set_investigation_focus(text, uuid, text) from authenticated;
grant execute on function public.igr_v4_set_investigation_focus(text, uuid, text) to anon, service_role;
