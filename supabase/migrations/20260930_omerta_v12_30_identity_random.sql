-- Inside Grey Room — OMERTÀ v12.30
-- 1) Atomic server-side random role draw, aware of live players/capacities.
-- 2) Narrative character != gameplay role. A campaign character is projected onto a player.
-- 3) Once cast, the character's history/rank/consequences are displayed under the player's pseudo.

create or replace function public.igr_v4_choose_random_role(p_code text, p_player_token uuid)
returns jsonb
language plpgsql
security definer
set search_path='public'
as $$
declare
  p public.igr_v4_players%rowtype;
  r public.igr_v4_rooms%rowtype;
  player_count int;
  picked text;
begin
  select * into p
  from public.igr_v4_players
  where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found then raise exception 'unauthorized'; end if;

  -- One room lock serializes all simultaneous draws/selections.
  select * into r from public.igr_v4_rooms where code=p.room_code for update;
  if not found then raise exception 'room not found'; end if;
  if r.status<>'lobby' then raise exception 'game already started'; end if;

  select count(*) into player_count from public.igr_v4_players where room_code=r.code;

  if r.scenario_id in ('021','022','023','024','025') then
    select q.role into picked
    from (values
      ('enqueteur'),('analyste'),('suspect'),('associato'),('uomo_onore'),('contabile'),
      ('caporegime'),('consigliere'),('pentito'),('sottocapo'),('don')
    ) as q(role)
    where public.igr_omerta_role_allowed(r.scenario_id,q.role)
      and (select count(*) from public.igr_v4_players x
           where x.room_code=r.code and x.id<>p.id and x.preferred_role=q.role)
          < case when q.role='suspect' then 7 else 1 end
    order by gen_random_uuid()
    limit 1;
  else
    select q.role into picked
    from (values
      ('enqueteur'),('analyste'),('suspect'),('procureur'),('juge'),('journaliste'),
      ('maitre'),('inspecteur'),('expert'),('temoin')
    ) as q(role)
    cross join lateral (
      select case q.role
        when 'enqueteur' then 1
        when 'analyste' then case when r.scenario_id in ('001','003','004','005','006') and player_count=4 then 0 else 1 end
        when 'suspect' then case when r.scenario_id='002' then 4 when r.scenario_id='020' then 4 else 3 end
        when 'procureur' then case when r.scenario_id in ('017','019','020') then 1 when r.scenario_id='013' and player_count>=6 then 1 else 0 end
        when 'juge' then case when r.scenario_id in ('019','020') then 1 when r.scenario_id='014' and player_count>=6 then 1 when r.scenario_id='015' and player_count>=7 then 1 when r.scenario_id='016' and player_count>=8 then 1 else 0 end
        when 'journaliste' then case when r.scenario_id='019' then 1 when r.scenario_id='020' then case when player_count>=15 then 2 else 1 end when r.scenario_id='015' and player_count>=6 then 1 when r.scenario_id='016' and player_count>=7 then 1 else 0 end
        when 'maitre' then case when r.scenario_id='019' then 1 when r.scenario_id='020' then case when player_count>=14 then 2 else 1 end when r.scenario_id='016' and player_count>=6 then 1 else 0 end
        when 'inspecteur' then case when r.scenario_id in ('018','020') then 1 else 0 end
        when 'expert' then case when r.scenario_id='020' then 1 else 0 end
        when 'temoin' then case when r.scenario_id='017' then case when player_count>=8 then 2 else 1 end when r.scenario_id='020' then case when player_count>=16 then 2 else 1 end else 0 end
        else 0 end as cap
    ) c
    where c.cap>0
      and (select count(*) from public.igr_v4_players x
           where x.room_code=r.code and x.id<>p.id and x.preferred_role=q.role) < c.cap
    order by gen_random_uuid()
    limit 1;
  end if;

  if picked is null then raise exception 'no role available'; end if;
  update public.igr_v4_players set preferred_role=picked where id=p.id;
  return jsonb_build_object('ok',true,'role',picked,'scenario_id',r.scenario_id,'player_count',player_count);
end;
$$;

grant execute on function public.igr_v4_choose_random_role(text,uuid) to anon,authenticated;

-- Cast campaign characters independently from the gameplay role selected in the lobby.
-- This runs inside the same transaction in which an OMERTÀ room moves from lobby -> playing.
create or replace function public.igr_omerta_cast_players_v1230()
returns trigger
language plpgsql
security definer
set search_path='public'
as $$
declare
  pack jsonb;
  campaign jsonb;
  tree jsonb;
  used_slots int[]:=array[]::int[];
  p record;
  existing_name text;
  canonical_name text;
  chosen_slot int;
  max_slot int;
  card jsonb;
begin
  if old.status is distinct from 'lobby' or new.status is distinct from 'playing'
     or new.scenario_id not in ('021','022','023','024','025') then
    return new;
  end if;

  select x.pack into pack from public.igr_v4_scenario_packs x where x.scenario_id=new.scenario_id;
  if pack is null then return new; end if;
  max_slot:=jsonb_array_length(coalesce(pack->'suspects','[]'::jsonb));
  campaign:=coalesce(new.state->'omerta_campaign',public.igr_omerta_initial_campaign_state());
  tree:=coalesce(campaign->'family_tree','[]'::jsonb);

  -- The old starter may have aligned a slot with a Mafia role. Clear it: identity and role are separate axes.
  update public.igr_v4_players set internal_slot=null
  where room_code=new.code and public_role='suspect';

  for p in
    select id,pseudo,preferred_role
    from public.igr_v4_players
    where room_code=new.code and public_role='suspect'
    order by gen_random_uuid()
  loop
    chosen_slot:=null;
    existing_name:=null;

    -- Preserve the player's campaign character whenever that character exists in this dossier.
    select e->>'name' into existing_name
    from jsonb_array_elements(tree) e
    where lower(coalesce(e->>'player',''))=lower(p.pseudo)
    limit 1;

    if existing_name is not null then
      select ord::int into chosen_slot
      from jsonb_array_elements(pack->'suspects') with ordinality s(item,ord)
      where split_part(item->>'place',' ·',1)=existing_name
        and not (ord::int=any(used_slots))
      limit 1;
    end if;

    -- Prefer a character that is not already fused with another campaign player.
    if chosen_slot is null then
      select s.ord::int into chosen_slot
      from jsonb_array_elements(pack->'suspects') with ordinality s(item,ord)
      left join lateral (
        select e
        from jsonb_array_elements(tree) e
        where e->>'name'=split_part(s.item->>'place',' ·',1)
        limit 1
      ) n on true
      where not (s.ord::int=any(used_slots))
        and coalesce(n.e->>'player','') in ('',p.pseudo)
      order by gen_random_uuid()
      limit 1;
    end if;

    -- Only if every suitable character is already bound, use any remaining scenario identity.
    if chosen_slot is null then
      select s.ord::int into chosen_slot
      from jsonb_array_elements(pack->'suspects') with ordinality s(item,ord)
      where not (s.ord::int=any(used_slots))
      order by gen_random_uuid()
      limit 1;
    end if;

    if chosen_slot is null or chosen_slot<1 or chosen_slot>max_slot then
      raise exception 'no narrative identity available';
    end if;

    update public.igr_v4_players set internal_slot=chosen_slot where id=p.id;
    used_slots:=array_append(used_slots,chosen_slot);
    canonical_name:=split_part((pack->'suspects'->(chosen_slot-1)->>'place'),' ·',1);

    -- A character becomes the player: the canonical name remains an internal story key,
    -- while the public tree receives the player's pseudo.
    select jsonb_agg(
      case
        when e->>'name'=canonical_name then jsonb_set(e,'{player}',to_jsonb(p.pseudo),true)
        when lower(coalesce(e->>'player',''))=lower(p.pseudo) then e-'player'
        else e
      end order by ord
    ) into tree
    from jsonb_array_elements(tree) with ordinality j(e,ord);
  end loop;

  campaign:=jsonb_set(campaign,'{family_tree}',coalesce(tree,'[]'::jsonb),true)
            ||jsonb_build_object('design_version','12.30','identity_model','character_becomes_player');

  -- Rebuild every private card after the independent character casting.
  for p in
    select id,pseudo,preferred_role,public_role,internal_slot
    from public.igr_v4_players
    where room_code=new.code
  loop
    card:=public.igr_v4_build_private_card(new.code,p.id);
    if p.preferred_role not in ('enqueteur','analyste','suspect') then
      card:=card||coalesce(pack->'role_notes'->p.preferred_role,'{}'::jsonb);
    end if;
    card:=card||jsonb_build_object(
      'omerta_preferred_role',p.preferred_role,
      'omerta_scenario',new.scenario_id,
      'omerta_player_identity',p.pseudo
    );
    if p.public_role='suspect' and p.internal_slot is not null then
      canonical_name:=split_part((pack->'suspects'->(p.internal_slot-1)->>'place'),' ·',1);
      card:=card||jsonb_build_object('omerta_character_source',canonical_name);
    end if;
    update public.igr_v4_players set private_state=card where id=p.id;
  end loop;

  update public.igr_v4_rooms
  set state=jsonb_set(new.state,'{omerta_campaign}',campaign,true),updated_at=now()
  where code=new.code;

  update public.igr_omerta_campaigns c
  set state=(coalesce(c.state,'{}'::jsonb)||campaign),updated_at=now()
  from public.igr_omerta_room_campaigns m
  where m.room_code=new.code and m.campaign_id=c.id;

  return new;
end;
$$;

drop trigger if exists igr_omerta_cast_players_v1230 on public.igr_v4_rooms;
create trigger igr_omerta_cast_players_v1230
after update of status on public.igr_v4_rooms
for each row
when (old.status is distinct from new.status)
execute function public.igr_omerta_cast_players_v1230();

-- Existing campaigns keep their history; only the model/version metadata is upgraded.
update public.igr_omerta_campaigns
set state=coalesce(state,'{}'::jsonb)||jsonb_build_object('design_version','12.30','identity_model','character_becomes_player'),
    updated_at=now()
where status in ('active','completed');

update public.igr_v4_rooms
set state=jsonb_set(
      state,
      '{omerta_campaign}',
      coalesce(state->'omerta_campaign','{}'::jsonb)||jsonb_build_object('design_version','12.30','identity_model','character_becomes_player'),
      true
    ),
    updated_at=now()
where scenario_id in ('021','022','023','024','025') and state ? 'omerta_campaign';
