-- OMERTÀ v12.26: cold copy, role-selection hardening and campaign backfill

update public.igr_v4_scenario_packs
set pack = replace(pack::text, 'crew', 'groupe')::jsonb,
    updated_at = now()
where scenario_id in ('021','022','023','024','025');

update public.igr_v4_scenario_packs set pack=jsonb_set(pack,'{context}',to_jsonb('Une enveloppe issue des rackets disparaît avant d’atteindre Enzo Rinaldi. Certains faits sont déjà prouvés. Il reste à savoir qui parlera pour sauver des années de prison — et qui le découvrira.'::text),true),updated_at=now() where scenario_id='021';
update public.igr_v4_scenario_packs set pack=jsonb_set(pack,'{context}',to_jsonb('Un meurtre interne fissure la Famiglia Verri. Chacun détient une partie de la vérité. Chacun a une raison de se taire. Une phrase peut faire tomber un homme — ou désigner celui qui l’a prononcée.'::text),true),updated_at=now() where scenario_id='022';
update public.igr_v4_scenario_packs set pack=jsonb_set(pack,'{context}',to_jsonb('Une réunion doit empêcher une guerre. Un siège reste vide. Pouvoir, territoire et succession se négocient à voix basse. Puis un appel tombe : Adriano Verri a été touché.'::text),true),updated_at=now() where scenario_id='023';
update public.igr_v4_scenario_packs set pack=jsonb_set(pack,'{context}',to_jsonb('Un membre arrêté risque des décennies de prison. Il peut réduire sa peine, livrer des noms et demander une protection. Plus il parle, plus la justice l’aide. Plus il parle, plus la Famiglia se rapproche.'::text),true),updated_at=now() where scenario_id='024';
update public.igr_v4_scenario_packs set pack=jsonb_set(pack,'{context}',to_jsonb('Quatre dossiers ont laissé des morts, des dettes et des trahisons. Vittorio Verri accepte enfin de parler. La question n’est plus de savoir qui est le Don. Elle est de savoir ce qu’il a réellement ordonné — et ce que ses hommes ont fait en son nom.'::text),true),updated_at=now() where scenario_id='025';

with notes as (
  select jsonb_build_object(
    'associato',jsonb_build_object('omerta_role','Associato','omerta_power','Tu peux parler, mentir ou rester loyal. Chaque mot peut te coûter.','omerta_objective','Reste utile. Reste vivant.'),
    'uomo_onore',jsonb_build_object('omerta_role','Uomo d’Onore','omerta_power','Tu peux dire vrai. Une vérité de trop suffit.','omerta_objective','Tiens l’omertà.'),
    'contabile',jsonb_build_object('omerta_role','Contabile','omerta_power','Les chiffres sont des preuves. Celui qui les explique devient visible.','omerta_objective','Fais parler les comptes sans te désigner.'),
    'pentito',jsonb_build_object('omerta_role','Pentito','omerta_power','Après avoir parlé, confirme seulement ce que tu assumes de rendre irréversible.','omerta_objective','Réduis ta peine. Obtiens une protection. Survis.'),
    'caporegime',jsonb_build_object('omerta_role','Caporegime','omerta_power','Interroge. Surveille. Puis décide. Une sanction aveugle te condamne.','omerta_objective','Trouve celui qui parle. Ne tue pas un loyal.'),
    'consigliere',jsonb_build_object('omerta_role','Consigliere','omerta_power','Lis les silences. Distingue la peur, le mensonge et la trahison.','omerta_objective','Protège le sommet sans frapper à l’aveugle.'),
    'sottocapo',jsonb_build_object('omerta_role','Sottocapo','omerta_power','Le Don ne voit pas tout. Une mauvaise décision peut ouvrir une guerre.','omerta_objective','Garde la Famiglia debout.'),
    'don',jsonb_build_object('omerta_role','Don','omerta_power','Tu donnes peu d’ordres. Tes hommes comprennent le reste. Convoque avant de condamner.','omerta_objective','Découvre qui reste loyal et ce qui a été fait en ton nom.')
  ) value
)
update public.igr_v4_scenario_packs p
set pack=jsonb_set(p.pack,'{role_notes}',coalesce(p.pack->'role_notes','{}'::jsonb)||(select value from notes),true)||jsonb_build_object('omerta_version','12.26'),
    updated_at=now()
where p.scenario_id in ('021','022','023','024','025');

update public.igr_omerta_campaigns
set state = public.igr_omerta_initial_campaign_state() || coalesce(state,'{}'::jsonb) || jsonb_build_object('design_version','12.26'),
    updated_at=now()
where status in ('active','completed');

update public.igr_v4_rooms r
set state=jsonb_set(r.state,'{omerta_campaign}',c.state,true),updated_at=now()
from public.igr_omerta_room_campaigns m
join public.igr_omerta_campaigns c on c.id=m.campaign_id
where m.room_code=r.code and r.scenario_id in ('021','022','023','024','025');

create or replace function public.igr_omerta_choose_role(p_code text,p_player_token uuid,p_role text)
returns jsonb language plpgsql security definer set search_path='public' as $$
declare
 p public.igr_v4_players%rowtype;
 r public.igr_v4_rooms%rowtype;
 role text:=lower(trim(coalesce(p_role,'')));
 cap int:=1;
 taken int:=0;
begin
 select * into p from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token;
 if not found then raise exception 'unauthorized'; end if;
 select * into r from public.igr_v4_rooms where code=p.room_code for update;
 if not found or r.scenario_id not in ('021','022','023','024','025') then raise exception 'not_omerta_room'; end if;
 if r.status<>'lobby' then raise exception 'game already started'; end if;
 if role in ('','none','annuler','cancel') then
   update public.igr_v4_players set preferred_role=null where id=p.id;
   return jsonb_build_object('ok',true,'role',null,'cleared',true);
 end if;
 if not public.igr_omerta_role_allowed(r.scenario_id,role) then raise exception 'role unavailable'; end if;
 cap:=case when role='suspect' then 7 else 1 end;
 select count(*) into taken from public.igr_v4_players where room_code=r.code and id<>p.id and preferred_role=role;
 if taken>=cap then raise exception 'role already taken'; end if;
 update public.igr_v4_players set preferred_role=role where id=p.id;
 return jsonb_build_object('ok',true,'role',role,'cleared',false,'scenario_id',r.scenario_id);
end;
$$;

grant execute on function public.igr_omerta_choose_role(text,uuid,text) to anon,authenticated;
