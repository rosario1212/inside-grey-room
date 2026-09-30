-- OMERTÀ v12.26: align selectable Mafia roles with recurring characters.

update public.igr_v4_scenario_packs
set pack=jsonb_set(
          jsonb_set(pack,'{suspects}',(pack->'suspects')||jsonb_build_array(jsonb_build_object(
            'place','Nico Ferrante · associato de la Famiglia Verri.',
            'position','Reste assez utile pour être protégé, assez discret pour ne pas devenir une cible.',
            'chronology','Tu as servi d’intermédiaire sur plusieurs opérations sans jamais entrer dans le cercle dirigeant.',
            'anchors',jsonb_build_array('Ton lien avec le groupe Rinaldi est établi.','Tu n’as jamais reçu d’ordre directement de Vittorio.'),
            'fixed_facts',jsonb_build_array('Lien avec le groupe Rinaldi'),
            'negotiable_facts',jsonb_build_array('Ce que Paolo t’a confié','Les ordres que tu as entendus'),
            'base_sentence',11,
            'hide','Tu sais que Paolo envisage de parler. Le révéler peut te sauver ou te désigner comme celui qui l’a livré.'
          )),true),
          '{truth,levels}',(pack->'truth'->'levels')||'[1]'::jsonb,true),
    updated_at=now()
where scenario_id='024' and jsonb_array_length(pack->'suspects')=7;

update public.igr_v4_scenario_packs
set pack=jsonb_set(
          jsonb_set(pack,'{suspects}',(pack->'suspects')||jsonb_build_array(
            jsonb_build_object(
              'place','Nico Ferrante · associato de la Famiglia Verri.',
              'position','Tu as survécu assez longtemps pour comprendre comment les ordres se déforment en descendant la hiérarchie.',
              'chronology','Tu as servi d’intermédiaire entre plusieurs hommes du groupe sans appartenir au sommet.',
              'anchors',jsonb_build_array('Ton lien avec Rinaldi est établi.','Tu n’as jamais reçu d’ordre directement de Vittorio.'),
              'fixed_facts',jsonb_build_array('Lien avec le groupe Rinaldi'),
              'negotiable_facts',jsonb_build_array('Paroles entendues','Intermédiaires utilisés'),
              'base_sentence',12,
              'hide','Tu peux confirmer qu’un ordre attribué à Vittorio a en réalité été reformulé avant de t’atteindre.'
            ),
            jsonb_build_object(
              'place','Vittorio Verri · Don de la Famiglia.',
              'position','Ne nie pas ce qui est prouvé. Distingue ce que tu as ordonné, ce que tu as toléré et ce que tes hommes ont fait pour toi.',
              'chronology','Pendant des années, les décisions sont remontées jusqu’à toi sans que chaque violence ne soit formulée devant toi.',
              'anchors',jsonb_build_array('Ta position au sommet est établie.','Plusieurs flux financiers remontent à ton cercle.','Aucun document ne résume à lui seul tes ordres.'),
              'fixed_facts',jsonb_build_array('Direction de la Famiglia','Financements autorisés'),
              'negotiable_facts',jsonb_build_array('Ordres explicites','Violences tolérées','Initiatives de tes hommes'),
              'base_sentence',30,
              'hide','Tu as explicitement refusé au moins une violence. Tu sais aussi que certains hommes ont utilisé ton nom sans te consulter.'
            )
          ),true),
          '{truth,levels}',(pack->'truth'->'levels')||'[1,3]'::jsonb,true),
    updated_at=now()
where scenario_id='025' and jsonb_array_length(pack->'suspects')=7;

create or replace function public.igr_omerta_initial_campaign_state()
returns jsonb language sql immutable set search_path='public' as $$
select jsonb_build_object(
  'arc','OMERTA','current_dossier','021','dossiers','{}'::jsonb,'character_status','{}'::jsonb,
  'family_tree',jsonb_build_array(
    jsonb_build_object('id','vittorio','name','Vittorio Verri','rank','DON','parent',null,'blood',true),
    jsonb_build_object('id','matteo','name','Matteo Bellini','rank','CONSIGLIERE','parent','vittorio','blood',false),
    jsonb_build_object('id','adriano','name','Adriano Verri','rank','SOTTOCAPO','parent','vittorio','blood',true),
    jsonb_build_object('id','elena','name','Elena Verri','rank','FAMILLE DE SANG','parent','vittorio','blood',true),
    jsonb_build_object('id','enzo','name','Enzo Rinaldi','rank','CAPOREGIME','parent','vittorio','blood',false),
    jsonb_build_object('id','luca','name','Luca Moretti','rank','UOMO D’ONORE','parent','enzo','blood',false),
    jsonb_build_object('id','paolo','name','Paolo Serra','rank','ASSOCIATO','parent','enzo','blood',false),
    jsonb_build_object('id','nico','name','Nico Ferrante','rank','ASSOCIATO','parent','enzo','blood',false),
    jsonb_build_object('id','salvatore','name','Salvatore Greco','rank','CONTABILE','parent','matteo','blood',false)
  ),
  'links',jsonb_build_array(
    jsonb_build_object('from','vittorio','to','adriano','kind','sang'),jsonb_build_object('from','vittorio','to','elena','kind','sang'),
    jsonb_build_object('from','vittorio','to','matteo','kind','confiance'),jsonb_build_object('from','vittorio','to','enzo','kind','commandement'),
    jsonb_build_object('from','enzo','to','luca','kind','groupe'),jsonb_build_object('from','enzo','to','paolo','kind','groupe'),
    jsonb_build_object('from','enzo','to','nico','kind','groupe'),jsonb_build_object('from','matteo','to','salvatore','kind','finance')
  ),'design_version','12.26');
$$;

update public.igr_omerta_campaigns
set state=jsonb_set((public.igr_omerta_initial_campaign_state()||state),'{family_tree}',public.igr_omerta_initial_campaign_state()->'family_tree',true),updated_at=now()
where status in ('active','completed');

create or replace function public.igr_omerta_start_game(p_code text, p_host_token uuid)
returns jsonb language plpgsql security definer set search_path='public' as $$
declare
  r public.igr_v4_rooms%rowtype; c int; p public.igr_v4_players%rowtype; pack jsonb;
  chosen_enq int; unchosen int; auto_assigned int:=0; role text; roles text[]; idx int; card jsonb; match_no int;
  campaign_id jsonb; campaign_state jsonb; used_slots int[]:=array[]::int[]; chosen_slot int; max_slot int; has_pentito boolean;
begin
  select * into r from public.igr_v4_rooms where code=upper(trim(p_code)) and host_token=p_host_token for update;
  if not found then raise exception 'unauthorized'; end if;
  if r.scenario_id not in ('021','022','023','024','025') then raise exception 'not_omerta_room'; end if;
  if r.status<>'lobby' then raise exception 'already started'; end if;
  select count(*) into c from public.igr_v4_players where room_code=r.code;
  if c<4 then raise exception 'not enough players'; end if;
  if c>8 then raise exception 'too many players'; end if;
  if exists(select 1 from public.igr_v4_players where room_code=r.code and preferred_role is not null and not public.igr_omerta_role_allowed(r.scenario_id,preferred_role)) then raise exception 'invalid role selection'; end if;
  if exists(select preferred_role from public.igr_v4_players where room_code=r.code and preferred_role not in ('suspect') and preferred_role is not null group by preferred_role having count(*)>1) then raise exception 'role already taken'; end if;
  select count(*) into chosen_enq from public.igr_v4_players where room_code=r.code and preferred_role='enqueteur';
  select count(*) into unchosen from public.igr_v4_players where room_code=r.code and preferred_role is null;
  if chosen_enq=0 then
    if unchosen=0 then raise exception 'one investigator required'; end if;
    update public.igr_v4_players set preferred_role='enqueteur' where id=(select id from public.igr_v4_players where room_code=r.code and preferred_role is null order by gen_random_uuid() limit 1);
    auto_assigned:=auto_assigned+1;
  end if;
  roles:=case r.scenario_id
    when '021' then array['analyste','associato','uomo_onore','contabile','caporegime','consigliere','suspect']
    when '022' then array['analyste','associato','uomo_onore','contabile','caporegime','consigliere','suspect']
    when '023' then array['analyste','associato','uomo_onore','contabile','caporegime','consigliere','sottocapo','suspect']
    when '024' then array['analyste','associato','uomo_onore','contabile','caporegime','consigliere','pentito','suspect']
    else array['analyste','associato','uomo_onore','contabile','caporegime','consigliere','sottocapo','pentito','don','suspect'] end;
  for role in select distinct preferred_role from public.igr_v4_players where room_code=r.code and preferred_role is not null and preferred_role<>'suspect' loop roles:=array_remove(roles,role); end loop;
  for p in select * from public.igr_v4_players where room_code=r.code and preferred_role is null order by gen_random_uuid() loop
    if coalesce(array_length(roles,1),0)>0 then idx:=1+floor(random()*array_length(roles,1))::int; role:=roles[idx]; roles:=coalesce(roles[1:idx-1],array[]::text[])||coalesce(roles[idx+1:array_length(roles,1)],array[]::text[]); else role:='suspect'; end if;
    update public.igr_v4_players set preferred_role=role where id=p.id; auto_assigned:=auto_assigned+1;
  end loop;
  update public.igr_v4_players set public_role=case when preferred_role='enqueteur' then 'enqueteur' when preferred_role='analyste' then 'analyste' else 'suspect' end,secret_role=preferred_role,ready=false,internal_slot=null where room_code=r.code;
  select x.pack into pack from public.igr_v4_scenario_packs x where x.scenario_id=r.scenario_id;
  max_slot:=jsonb_array_length(coalesce(pack->'suspects','[]'::jsonb));
  select exists(select 1 from public.igr_v4_players where room_code=r.code and preferred_role='pentito') into has_pentito;
  for p in select * from public.igr_v4_players where room_code=r.code and public_role='suspect' order by case preferred_role when 'pentito' then 1 when 'associato' then 2 when 'caporegime' then 3 when 'consigliere' then 4 when 'sottocapo' then 5 when 'uomo_onore' then 6 when 'contabile' then 7 when 'don' then 8 else 99 end,seat_index loop
    chosen_slot:=case p.preferred_role when 'pentito' then 1 when 'associato' then case when has_pentito and r.scenario_id in ('024','025') then 8 else 1 end when 'caporegime' then 2 when 'consigliere' then 3 when 'sottocapo' then 4 when 'uomo_onore' then 6 when 'contabile' then 7 when 'don' then 9 else null end;
    if chosen_slot is null or chosen_slot>max_slot or chosen_slot=any(used_slots) then select min(gs) into chosen_slot from generate_series(1,max_slot) gs where not (gs=any(used_slots)); end if;
    if chosen_slot is null then raise exception 'no narrative identity available'; end if;
    update public.igr_v4_players set internal_slot=chosen_slot where id=p.id; used_slots:=array_append(used_slots,chosen_slot);
  end loop;
  for p in select * from public.igr_v4_players where room_code=r.code loop
    card:=public.igr_v4_build_private_card(r.code,p.id);
    if p.preferred_role not in ('enqueteur','analyste','suspect') then card:=card||coalesce(pack->'role_notes'->p.preferred_role,'{}'::jsonb); end if;
    card:=card||jsonb_build_object('omerta_preferred_role',p.preferred_role,'omerta_scenario',r.scenario_id);
    update public.igr_v4_players set private_state=card where id=p.id;
  end loop;
  match_no:=greatest(1,coalesce((r.state->>'match_no')::int,1));
  campaign_id:=r.state->'omerta_campaign_id'; campaign_state:=coalesce(r.state->'omerta_campaign',public.igr_omerta_initial_campaign_state());
  update public.igr_v4_rooms set status='playing',cycle=0,phase='briefing',phase_started_at=now(),phase_ends_at=now()+interval '28 seconds',state=jsonb_build_object('match_no',match_no,'heard','[]'::jsonb,'used_trames','{}'::jsonb,'used_news','{}'::jsonb,'annex_queue','[]'::jsonb,'annex_index',0,'video_active',false,'video_cut_until',null,'omerta_campaign_mode',true,'omerta_campaign_id',campaign_id,'omerta_campaign',campaign_state,'omerta',jsonb_build_object('dead','[]'::jsonb)),updated_at=now() where code=r.code;
  insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'context',jsonb_build_object('title','OMERTÀ · CONTEXTE','text',pack->>'context'));
  insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','TÉLÉPHONES POSÉS','text','Lis ta carte. Retiens ton objectif. Puis repose le téléphone. Le reste se joue dans la pièce.','auto_assigned_roles',auto_assigned));
  return jsonb_build_object('ok',true,'auto_assigned_roles',auto_assigned);
end;
$$;

grant execute on function public.igr_omerta_start_game(text,uuid) to anon,authenticated;

update public.igr_v4_rooms r set state=jsonb_set(r.state,'{omerta_campaign}',c.state,true),updated_at=now()
from public.igr_omerta_room_campaigns m join public.igr_omerta_campaigns c on c.id=m.campaign_id
where m.room_code=r.code and r.scenario_id in ('021','022','023','024','025');
