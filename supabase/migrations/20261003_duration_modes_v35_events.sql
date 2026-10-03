-- Keep event-option durations/hints aligned without duplicating the v34 option engine.
alter function public.igr_v13_event_options(text) rename to igr_v13_event_options_v34;

create function public.igr_v13_event_options(p_room text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare
  q jsonb;
  s_inter integer:=public.igr_v35_room_seconds(p_room,'interrogation');
  s_confront integer:=public.igr_v35_room_seconds(p_room,'confrontation');
  s_assembly integer:=public.igr_v35_room_seconds(p_room,'assembly');
  s_witness integer:=public.igr_v35_room_seconds(p_room,'witness');
  s_judicial_short integer:=public.igr_v35_room_seconds(p_room,'judicial_short');
  s_judicial_long integer:=public.igr_v35_room_seconds(p_room,'judicial_long');
begin
  select coalesce(jsonb_agg(
    case item->>'key'
      when 'interrogation' then jsonb_set(jsonb_set(item,'{seconds}',to_jsonb(s_inter),true),'{hint}',to_jsonb(public.igr_v35_seconds_label(s_inter)||regexp_replace(coalesce(item->>'hint',''),'^[^.]*\.','')),true)
      when 'confrontation' then jsonb_set(jsonb_set(item,'{seconds}',to_jsonb(s_confront),true),'{hint}',to_jsonb(public.igr_v35_seconds_label(s_confront)||'. Deux personnes. Les versions sont mises face à face.'),true)
      when 'assembly' then jsonb_set(jsonb_set(item,'{seconds}',to_jsonb(s_assembly),true),'{hint}',to_jsonb(public.igr_v35_seconds_label(s_assembly)||' de mise en commun. Au cycle 3, l’Enquêteur peut restreindre les participants.'),true)
      when 'temoin' then jsonb_set(jsonb_set(item,'{seconds}',to_jsonb(s_witness),true),'{hint}',to_jsonb(public.igr_v35_seconds_label(s_witness)||' de fenêtre globale.'),true)
      when 'juge' then jsonb_set(jsonb_set(item,'{seconds}',to_jsonb(s_judicial_long),true),'{hint}',to_jsonb(public.igr_v35_seconds_label(s_judicial_long)||'. Information protégée ou arbitrage.'),true)
      when 'requete' then jsonb_set(jsonb_set(item,'{seconds}',to_jsonb(s_judicial_short),true),'{hint}',to_jsonb(public.igr_v35_seconds_label(s_judicial_short)||'. Avocat et Juge.'),true)
      when 'saisine' then jsonb_set(jsonb_set(item,'{seconds}',to_jsonb(s_judicial_short),true),'{hint}',to_jsonb(public.igr_v35_seconds_label(s_judicial_short)||'. Procureur et Juge.'),true)
      else item
    end
  ),'[]'::jsonb) into q
  from jsonb_array_elements(public.igr_v13_event_options_v34(p_room)) item;
  return q;
end
$$;
