-- Public role-card guidance only. No changes to private variants, assigned roles, evidence or scoring.
-- The current 001-010 roster does not permit the Lawyer role.
WITH notes(scenario_id, analyst_anchors) AS (
 VALUES
  ('001', 'Croise les horaires, la dette et les visites de la chambre 222. Distingue une présence d''un acte prouvé.'),
  ('002', 'Sépare ce que chacun savait de la détresse de Léon, ce qu''il pouvait faire et ce qu''il a réellement choisi. N''invente pas de meurtrier.'),
  ('003', 'Croise accès au Centre Helios, mouvements du matériel et alertes cachées. Une négligence, une aide et une dissimulation ne sont pas le même acte.'),
  ('004', 'Reconstitue l''ordre des appels et les informations réellement reçues. Distingue le silence conscient de l''ignorance.'),
  ('005', 'Sépare la connaissance du symbole du Masque Blanc, l''occasion d''agir et la preuve du meurtre. Une imitation n''identifie pas son auteur.'),
  ('006', 'Compare les récits construits en commun cinq ans après les faits aux décisions de chaque personne. Un souvenir partagé n''est pas une responsabilité partagée.'),
  ('007', 'Recoupe dettes, testament et filiation sans confondre intérêt financier, mensonge familial et responsabilité dans le décès.'),
  ('008', 'Établis un tableau des horaires et des témoignages incompatibles. Vérifie qui a vu les faits, qui les rapporte et qui subit une pression.'),
  ('009', 'Sépare les décisions prises avant et après le refus du Sujet 17. La perte de mémoire ultérieure ne modifie pas les actes antérieurs.'),
  ('010', 'Distingue l''enfermement initial, les bruits perçus et l''ouverture de 13 h 54. Pour chaque suspect, évalue séparément présence, connaissance et décision.')
)
UPDATE public.igr_v4_scenario_packs p
SET pack = jsonb_set(
  jsonb_set(p.pack,'{role_notes,analyste,anchors}',to_jsonb(notes.analyst_anchors::text),true),
  '{role_notes,suspect,anchors}',to_jsonb('Hors convocation officielle, tu peux discuter librement avec les autres joueurs disponibles. Pendant l''interrogatoire, défends ta version et réponds aux preuves. Aucun Avocat n''est proposé dans ce dossier.'::text),true
), updated_at=clock_timestamp()
FROM notes
WHERE p.scenario_id=notes.scenario_id;
