-- Scoped to approved 029 matches; only updates each player's private card.
create or replace function igr_private.igr_v122_029_memory()
returns trigger language plpgsql security definer set search_path='' as $f$
declare p public.igr_v4_players%rowtype;matrix jsonb;branch_id text;profile_id text;
        counter integer; node jsonb;tag text;prompts text;
begin
 if new.scenario_id<>'029' or old.status<>'lobby' or new.status<>'playing'
 or not igr_private.igr_v108_029_is_enabled() then return new;end if;
 select branch,profile into branch_id,profile_id from igr_private.igr_v108_029_room_variants
 where room_code=new.code and match_no=greatest(1,coalesce((new.state->>'match_no')::integer,1));
 if not found then raise exception 'missing private 029 seed';end if;
 select authoring into matrix from igr_private.igr_v107_029_editorial_matrix
 where branch=branch_id and profile=profile_id and editorial_status='approved' and public_enabled;
 if matrix is null then raise exception 'missing approved 029 card';end if;
 for p in select * from public.igr_v4_players where room_code=new.code and public_role='suspect' loop
  counter:=p.internal_slot; tag:='T'||counter::text;
  node:=matrix->'witnesses'->tag;
  select string_agg(s.value,' · ') into prompts from
    jsonb_array_elements_text(coalesce(matrix->'interrogation_memory_prompts'->tag,'[]'::jsonb)) s(value);
  update public.igr_v4_players set private_state=coalesce(private_state,'{}'::jsonb)||
    jsonb_build_object('029_witness_index',counter,'029_family',node->>'family',
       '029_qprompts',coalesce(prompts,''),'029_can_decide',
       counter=4 and profile_id in ('V3','V4','V5'),
       'relations',case when counter=4 then 'Tu ne connaissais pas personnellement les trois rescapés.'
        else 'Tu as été détenu avec les deux autres rescapés. Vous avez fui ensemble.' end)
  where id=p.id;
 end loop;
 return new;
end $f$;
revoke all on function igr_private.igr_v122_029_memory() from public,anon,authenticated;
drop trigger if exists igr_v122_029_memory on public.igr_v4_rooms;
create trigger igr_v122_029_memory after update of status
on public.igr_v4_rooms for each row execute function igr_private.igr_v122_029_memory();
