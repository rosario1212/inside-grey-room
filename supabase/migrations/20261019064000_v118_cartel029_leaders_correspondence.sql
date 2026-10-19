-- CARTEL 029 v118 — personnages du Don et de son bras droit, dialogue volontaire.
-- Aucun commandement en texte libre ne déclenche une action, une attaque ou un enlèvement.
create or replace function igr_private.igr_v118_cartel_leaders()
returns trigger language plpgsql security definer set search_path='' as $body$
declare p public.igr_v4_players%rowtype; extra jsonb;
begin
 if new.scenario_id<>'029' or old.status<>'lobby' or new.status<>'playing'
    or not igr_private.igr_v108_029_is_enabled() then return new; end if;
 for p in select * from public.igr_v4_players where room_code=new.code and public_role in ('don','bras_droit') loop
  if p.public_role='don' then
   extra:=jsonb_build_object(
     'place','Don Ismael Salcedo · dirigeant de Los Salcedo',
     'chronology','Tu commandes Los Salcedo et tu connais les membres de ta famille qui administrent ses différents secteurs. Tu n’étais pas physiquement présent à chaque événement de Santa Ceniza.',
     'anchors','Tu connais la structure générale du réseau, le rôle de ton bras droit et plusieurs responsables locaux. Ne prétends pas avoir vu ce que tu n’as pas vu.',
     'hide','Tu protèges ton pouvoir et ne livres pas spontanément les responsabilités que tu connais.',
     'position','Tu peux écrire à ton bras droit ou aux témoins. Tes messages ne provoquent aucune violence automatiquement.',
     'objective_main','Préserver ton autorité et décider toi-même jusqu’où coopérer avec la Grey Room.'
    );
  else
   extra:=jsonb_build_object(
     'place','Bras droit du Don · coordinateur du réseau',
     'chronology','Tu coordonnes certains responsables de Los Salcedo. Tu ne dois pas être confondu avec un des frères du Don ni avec le quatrième témoin.',
     'anchors','Tu connais la chaîne d’instructions et les relais entre plusieurs installations. Tu ne sais pas nécessairement ce que chaque exécutant a réellement fait.',
     'hide','Tu sais que des responsables ont parfois agi sans te rendre compte. Tu as des raisons de cacher certaines instructions.',
     'position','Tu peux écrire au Don ou aux témoins. Tes messages ne déclenchent aucune représaille automatique.',
     'objective_main','Faire face aux accusations, rester loyal au Don ou coopérer selon tes propres décisions.'
    );
  end if;
  update public.igr_v4_players set private_state=coalesce(private_state,'{}'::jsonb)||extra where id=p.id;
 end loop;
 return new;
end $body$;
revoke all on function igr_private.igr_v118_cartel_leaders() from public,anon,authenticated;
drop trigger if exists igr_v118_cartel_leaders on public.igr_v4_rooms;
create trigger igr_v118_cartel_leaders after update of status on public.igr_v4_rooms
for each row execute function igr_private.igr_v118_cartel_leaders();

create or replace function public.igr_v118_cartel_correspondence(
 p_code text,p_player_token uuid,p_target uuid,p_text text)
returns jsonb language plpgsql security definer set search_path='' as $body$
declare actor public.igr_v4_players%rowtype; receiver public.igr_v4_players%rowtype;
 r public.igr_v4_rooms%rowtype; content text;
begin
 perform igr_private.rate_limit('v118_cartel_correspondence',coalesce(p_player_token::text,'none'),8,60);
 select * into actor from public.igr_v4_players
   where room_code=upper(trim(p_code)) and player_token=p_player_token;
 if not found then raise exception 'forbidden'; end if;
 select * into r from public.igr_v4_rooms where code=actor.room_code;
 if not found or r.scenario_id<>'029' or r.status<>'playing'
    or not igr_private.igr_v108_029_is_enabled() or coalesce((r.state->>'cartel029_ready')::boolean,false)=false
    then raise exception '029 correspondence unavailable'; end if;
 select * into receiver from public.igr_v4_players where id=p_target and room_code=r.code and id<>actor.id;
 if not found then raise exception 'invalid recipient'; end if;
 if actor.public_role not in ('don','bras_droit','suspect')
    or receiver.public_role not in ('don','bras_droit','suspect')
    or (actor.public_role='suspect' and receiver.public_role='suspect')
    then raise exception 'invalid 029 correspondence'; end if;
 content:=trim(coalesce(p_text,''));
 if length(content)<1 or length(content)>200 then raise exception 'invalid message length'; end if;
 perform igr_private.assert_ugc(content,200,false);
 insert into public.igr_v4_events(room_code,event_type,visibility,target_player_id,cycle,payload)
 values(r.code,'message','private',receiver.id,r.cycle,
    jsonb_build_object('channel','cartel_contact','author',actor.pseudo,'author_role',actor.public_role,
      'author_id',actor.id,'to',receiver.pseudo,'to_id',receiver.id,'text',content));
 insert into public.igr_v4_events(room_code,event_type,visibility,target_player_id,cycle,payload)
 values(r.code,'message','private',actor.id,r.cycle,
    jsonb_build_object('channel','cartel_contact','author',actor.pseudo,'author_role',actor.public_role,
      'author_id',actor.id,'to',receiver.pseudo,'to_id',receiver.id,'text',content));
 return jsonb_build_object('ok',true);
end $body$;
revoke all on function public.igr_v118_cartel_correspondence(text,uuid,uuid,text) from public,authenticated;
grant execute on function public.igr_v118_cartel_correspondence(text,uuid,uuid,text) to anon;
