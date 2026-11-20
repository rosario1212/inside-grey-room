-- v811: Source-guarded, standalone, plain-language general trame corrections.
-- Preserve order, cycle, axes, audience and all other gameplay metadata.
WITH edits(scenario_id,ord,old_title,old_text,new_title,new_text) AS (VALUES
('001',1,'CHRONOLOGIE DU PALIER','À 02 h 11, Maël appelle un ami qui lui doit de l’argent. Cet ami semble partir à 02 h 32. Un autre homme arrive à 02 h 48.','CHRONOLOGIE DU PALIER','À 02 h 11, Maël appelle un ami qui lui doit de l’argent. Cet ami semble partir à 02 h 32. Une autre personne arrive à 02 h 48.'),
('001',2,'DETTE ET ENREGISTREMENT','Des messages confirment la dette de l’ami. Après 02 h 55, un enregistrement capte un ordre d’effacement et une lutte. Les voix restent incertaines.','DETTE ET ENREGISTREMENT','Des messages confirment qu’un ami doit de l’argent à Maël. Après 02 h 55, un enregistrement capte un ordre d’effacer quelque chose et une lutte. Les voix ne sont pas identifiées.'),
('002',4,'DÉTRESSE ANCIENNE','Léon souffrait déjà avant les derniers conflits. Son état s’était récemment aggravé.','DÉTRESSE AVANT LES CONFLITS','Léon allait déjà mal avant les derniers conflits. Sa détresse s’était aggravée récemment.'),
('002',6,'DERNIER REFUGE','Malgré leurs disputes, Léon comptait encore sur ce proche pour le comprendre.','UN PROCHE SUR QUI COMPTER','Malgré leurs disputes, Léon comptait encore sur le proche avec qui il était en conflit.'),
('003',2,'TRANSPORT ANORMAL','Un véhicule quitte Helios hors créneau de transfert autorisé.','TRANSPORT NON AUTORISÉ','Un véhicule quitte le centre Helios à un horaire où aucun transport n’était autorisé.'),
('003',9,'PANIQUE INTERNE','Après l’attaque, des employés cherchent d’abord l’auteur de la fuite plutôt que de protéger les dossiers.','DOSSIERS NON PROTÉGÉS','Après l’attaque, des employés cherchent d’abord qui a divulgué des informations au lieu de protéger les dossiers.'),
('004',3,'PASSAGE DEVANT L''IMMEUBLE','Une caméra montre une voiture ressemblant à celle du proche de Sofia qui habitait le quartier passer devant son immeuble.','PASSAGE DEVANT L’IMMEUBLE','Une caméra montre une voiture semblable à celle d’un proche de Sofia qui habite le quartier, devant son immeuble.'),
('004',9,'TROIS OCCASIONS D’APPELER','Plusieurs appels aux secours restaient possibles avant que l’état de Sofia ne devienne irréversible.','PLUSIEURS OCCASIONS D’ALERTER','Il était encore possible d’appeler les secours à plusieurs moments avant que l’état de Sofia ne devienne irréversible.'),
('005',9,'COPIE DU MASQUE BLANC','La scène de Keller présente trop de différences avec les anciens crimes pour être une copie exacte.','UNE IMITATION DU MASQUE BLANC','La scène du crime ressemble aux anciens meurtres du Masque Blanc, mais plusieurs détails ne correspondent pas.'),
('010',1,'ENFERMÉE VIVANTE','Nora est enfermée vivante derrière le mur. Elle ne peut pas ouvrir seule depuis l’intérieur.','ENFERMÉE DANS LA RÉSERVE','Nora est vivante, enfermée dans une réserve dont la poignée intérieure ne fonctionne pas.'),
('010',4,'NORA RESPIRE ENCORE','À 13 h 54, Nora respire encore. Elle est vivante quand la porte s’ouvre.','NORA CONSCIENTE À 13 H 54','À 13 h 54, Nora est consciente quand la porte de la réserve s’ouvre.'),
('010',5,'PORTE REFERMÉE','La porte est refermée volontairement après l’ouverture. Le mécanisme fonctionne normalement.','PORTE REFERMÉE','La porte se referme après l’ouverture de 13 h 54. La poignée intérieure défectueuse empêche Nora de sortir seule.'),
('010',7,'MORTE APRÈS 13 H 54','Le rapport de secours confirme que Nora est retrouvée consciente à 14 h 26, avec des blessures aux mains.','NORA RETROUVÉE VIVANTE','À 14 h 26, les secours retrouvent Nora consciente, avec des blessures aux mains.'),
('013',1,'ANGLE BALISTIQUE','Le tir depuis le toit n’a pu durer que moins de 90 secondes.','MOINS DE 90 SECONDES POUR TIRER','Depuis le toit, le tireur disposait d’une fenêtre de moins de 90 secondes pour agir.'),
('014',7,'AUDIT INTERNE','Une autre faille de sécurité était connue, mais n’avait pas été signalée.','FAILLE NON SIGNALÉE','Une faille de sécurité était connue lors de l’audit interne, mais personne ne l’avait signalée.'),
('018',2,'TRACE SOUS LA TABLE','Une nappe déplacée cache une trace de lutte sous la table.','TRACES DE LUTTE SOUS LA NAPPE','Des traces de lutte sous la table sont en partie cachées par la nappe déplacée.'),
('019',1,'LE DOSSIER ATTENDU','La victime devait remettre des documents financiers au gala. Les copies trouvées ne correspondent pas toutes.','LES COPIES DU DOSSIER DIFFÈRENT','La victime devait remettre des documents financiers au gala. Les copies retrouvées présentent des différences.'),
('019',2,'LE DISPOSITIF MODIFIÉ','Pendant le gala, des trajets et des accès ont changé. On ignore qui l’a demandé.','ACCÈS MODIFIÉS PENDANT LE GALA','Des accès techniques et des trajets ont été modifiés pendant le gala. On ignore qui a demandé ces changements.'),
('021',1,'LE TRAJET','Le trajet de l’enveloppe comporte 42 minutes sans trace. Deux personnes peuvent expliquer ce délai.','42 MINUTES SANS TRACE','Le trajet de l’enveloppe comporte 42 minutes inexpliquées. Deux personnes pourraient savoir ce qui s’est passé.'),
('033',2,'NOMINATION','Le parent de la famille qui est ministre a maintenu une nomination contestée.','NOMINATION MAINTENUE','Le ministre, membre de la famille Kassar, a maintenu une nomination contestée.'),
('035',2,'RENOUVELLEMENT EXCEPTIONNEL','L’identité M-17 a été renouvelée plusieurs fois sans contrôle biométrique complet.','IDENTITÉ RENOUVELÉE SANS CONTRÔLE','L’identité M-17 a été renouvelée plusieurs fois sans vérification complète de la personne.')
), revised AS (
 SELECT p.scenario_id, jsonb_agg(CASE WHEN ed.scenario_id IS NOT NULL
 THEN jsonb_set(jsonb_set(t.item,'{title}',to_jsonb(ed.new_title),true),'{text}',to_jsonb(ed.new_text),true)
 ELSE t.item END ORDER BY t.ord) trames, count(ed.scenario_id) matched
 FROM public.igr_v4_scenario_packs p
 CROSS JOIN LATERAL jsonb_array_elements(p.pack->'trames') WITH ORDINALITY t(item,ord)
 LEFT JOIN edits ed ON ed.scenario_id=p.scenario_id AND ed.ord=t.ord
 AND ed.old_title=t.item->>'title' AND ed.old_text=t.item->>'text'
 WHERE p.scenario_id IN ('001','002','003','004','005','010','013','014','018','019','021','033','035')
 GROUP BY p.scenario_id
), saved AS (
 UPDATE public.igr_v4_scenario_packs p SET pack=jsonb_set(p.pack,'{trames}',r.trames),updated_at=now()
 FROM revised r WHERE p.scenario_id=r.scenario_id AND r.matched>0
 RETURNING p.scenario_id
)
SELECT (SELECT count(*) FROM saved) changed_scenarios, (SELECT coalesce(sum(matched),0) FROM revised) changed_trames;
