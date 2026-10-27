-- Every shared note changes room.state so current clients reconcile notebooks.
CREATE OR REPLACE FUNCTION public.igr_v87_add_dossier_note(p_code text, p_player_token uuid, p_suspect_id uuid, p_kind text, p_text text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare actor public.igr_v4_players%rowtype; clean_text text:=trim(coalesce(p_text,'')); note_id bigint;
begin
 select * into actor from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token;
 if not found or actor.public_role not in ('enqueteur','analyste','procureur','juge','inspecteur','expert') then raise exception 'forbidden';end if;
 if not exists(select 1 from public.igr_v4_rooms r where r.code=actor.room_code and r.status='playing')
 then raise exception 'inactive room';end if;
 if p_kind not in ('declaration','hypothese','question') or char_length(clean_text) not between 1 and 800
 then raise exception 'invalid note';end if;
 if p_suspect_id is not null and not exists(select 1 from public.igr_v4_players p
  where p.id=p_suspect_id and p.room_code=actor.room_code and p.public_role='suspect')
 then raise exception 'invalid suspect';end if;
 perform igr_private.rate_limit('v87_note',p_player_token::text,20,60);
 if (select count(*) from public.igr_v87_investigator_notes n
    where n.room_code=actor.room_code and n.author_id=actor.id)>=100
 then raise exception 'note limit';end if;
 insert into public.igr_v87_investigator_notes(room_code,author_id,suspect_id,kind,content,match_no)
 values(actor.room_code,actor.id,p_suspect_id,p_kind,clean_text,
  (select coalesce((r.state->>'match_no')::integer,1) from public.igr_v4_rooms r where r.code=actor.room_code))
 returning id into note_id;
 -- Trigger room change detection for other team members' live notebooks.
 update public.igr_v4_rooms
 set state=jsonb_set(coalesce(state,'{}'::jsonb),'{notebook_revision_v636}',
       to_jsonb(coalesce((state->>'notebook_revision_v636')::bigint,0)+1),true),
     updated_at=clock_timestamp()
 where code=actor.room_code;
 -- Invalidate all investigation clients without adding any visible notification.
 update public.igr_v4_rooms set updated_at=clock_timestamp() where code=actor.room_code;
 return jsonb_build_object('ok',true,'id',note_id);
end$function$;
