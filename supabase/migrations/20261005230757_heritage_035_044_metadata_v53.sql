-- v53: make the canonical 035-044 <-> Heritage chapter mapping explicit.
-- Gameplay content, truth, roles and witness configuration are intentionally unchanged.
with metadata(scenario_id,title,campaign,chapter) as (
  values
    ('035','PERSONNE N’EXISTE','cendres',1),
    ('036','04:17','cendres',2),
    ('037','LA CHAMBRE','cendres',3),
    ('038','CENDRES','cendres',4),
    ('039','POINT ZÉRO','cendres',5),
    ('040','L’OYABUN','kuroi',1),
    ('041','GIRI','kuroi',2),
    ('042','LES MAINS SALES','kuroi',3),
    ('043','LA DETTE','kuroi',4),
    ('044','LE CONSEIL','kuroi',5)
)
update public.igr_v4_scenario_packs p
set pack = p.pack || jsonb_build_object(
  'title', m.title,
  'collection', 'heritage',
  'heritage_campaign', m.campaign,
  'heritage_chapter', m.chapter
)
from metadata m
where p.scenario_id = m.scenario_id;
