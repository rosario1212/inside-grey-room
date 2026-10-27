-- OMERTÀ : barrer aussi l'ancien RPC public, pas seulement le client.
-- Migration candidate, jamais exécutée en production dans cette branche.
-- À appliquer dans la MÊME migration transactionnelle que le nouveau
-- igr_omerta_standalone_safe_sync (aucun saut d'état partagé).
--
-- Renommer conserve la fonction historique et son corps exact ; toute salle
-- sans snapshot reçoit la même donnée qu'avant via notre façade.
-- L'ancien corps est rendu non exécutable par anon/authenticated.
alter function public.igr_v4_sync(text,uuid)
 rename to igr_omerta_legacy_sync_core;
revoke all on function public.igr_omerta_legacy_sync_core(text,uuid)
 from public,anon,authenticated;

-- Une demande directe du RPC historique est désormais filtrée du même côté
-- serveur que l'appel de l'application : pas de contournement HTTP possible.
create or replace function public.igr_v4_sync(
 p_code text,p_player_token uuid
) returns jsonb
language plpgsql security definer set search_path=''
as $seal$
begin
 return public.igr_omerta_standalone_safe_sync(p_code,p_player_token);
end;
$seal$;
revoke all on function public.igr_v4_sync(text,uuid)
 from public,anon,authenticated;
-- Le droit antérieur vérifié sur la vraie base : anon=true, authenticated=false.
grant execute on function public.igr_v4_sync(text,uuid) to anon;
