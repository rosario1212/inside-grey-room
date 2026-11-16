-- Disposable fixture extension. Never execute this against real Supabase.
alter table public.igr_heritage_online_rooms
  add column campaign_carry jsonb,
  add column maitre_angle text;

create or replace function public.igr_heritage_online_decisions(p_campaign text,p_chapter integer)
returns text[] language sql immutable as $$
 select case
  when p_campaign='cendres' and p_chapter=3 then array['b','source','audio']::text[]
  when p_campaign='kuroi' then array['police_hand','arakida','internal']::text[]
  when p_campaign='maitre' and p_chapter=1 then array['fiscal_only','blindness','active_link']::text[]
  when p_campaign='maitre' and p_chapter=2 then array['deliver','protect','targeted']::text[]
  when p_campaign='maitre' and p_chapter=3 then array['separate','common','fracture']::text[]
  when p_campaign='maitre' and p_chapter=4 then array['narrow','network','insufficient']::text[]
  when p_campaign='maitre' and p_chapter=5 then array['defender','negotiator','name']::text[]
  else array[]::text[] end
$$;

create function public.igr_heritage_online_decide_v55(text,uuid,text)
returns jsonb language sql as $$ select jsonb_build_object('legacy',true) $$;
create function public.igr_heritage_online_decide_v71(text,uuid,text)
returns jsonb language sql as $$ select jsonb_build_object('legacy',true) $$;
grant execute on function public.igr_heritage_online_decide_v55(text,uuid,text) to anon,authenticated;
grant execute on function public.igr_heritage_online_decide_v71(text,uuid,text) to anon,authenticated;
