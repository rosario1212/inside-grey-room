-- v780: Sofia A/B/C, edit only the authored trame copy by exact ID/title/source text.
-- Recalculate manuscript integrity MD5; leave private cards, truth and all other keys intact.
WITH edits (variant_id, id, old_title, old_text, new_title, new_text) AS (
 VALUES
('A', '004-A-1', 'APPEL REÇU', 'Le journal confirme un appel de Sofia à l''ex-partenaire avant tous les autres échanges. Son contenu n''est pas publié à ce stade.', 'APPEL À L’EX-PARTENAIRE', 'Le téléphone de Sofia confirme qu’elle a appelé son ex-partenaire avant les autres échanges. On ignore ce qu’ils se sont dit.'),
('A', '004-A-2', 'TROIS NIVEAUX D''INFORMATION', 'Le message reçu par l''ami est moins explicite que le témoignage sur le premier appel. Aucun échange ne confirme qu''un relais était organisé.', 'MESSAGES DIFFÉRENTS', 'Sofia envoie à son ami un message moins alarmant que son premier appel. Rien ne montre qu’un proche devait prévenir l’autre.'),
('A', '004-A-3', 'LA QUESTION NON ENVOYÉE', 'Une question non expédiée apparaît dans le téléphone de l''ami. La trace du passage dans la rue ne comporte aucun avis transmis au proche. L''enquête doit établir ce que chacun pouvait savoir, sans inférer une issue médicale certaine.', 'QUESTION NON ENVOYÉE', 'L’ami de Sofia a rédigé une question sans l’envoyer. Aucun message ne montre que le proche passé dans la rue avait été prévenu.'),
('B', '004-B-1', 'DEUX ALERTES DISTINCTES', 'Deux messages adressés à des destinataires différents arrivent après la rupture du premier suspect. Le contenu exact de leur conversation n''est pas encore connu.', 'DEUX MESSAGES DIFFÉRENTS', 'Après une dispute avec son ex-partenaire, Sofia envoie deux messages différents : un à son ami proche, l’autre au proche du quartier.'),
('B', '004-B-2', 'L''APPEL ENTRE PROCHES', 'Le journal prouve une conversation entre les deux destinataires des alertes. Aucune trace de contact avec Sofia ou un service d''aide ne suit cet échange.', 'APPEL ENTRE LES PROCHES', 'L’ami proche de Sofia et le proche du quartier se sont appelés après ses messages. Aucun appel aux secours n’apparaît ensuite.'),
('B', '004-B-3', 'UN RELAIS SANS ACCORD', 'La comparaison des messages et des témoignages ne permet d''identifier aucune attribution explicite de la prise en charge. Les deux proches connaissaient l''inquiétude de l''autre. L''enquête doit déterminer la part de chacun.', 'PERSONNE NE SE CHARGE DES SECOURS', 'Les messages ne disent pas lequel des deux proches devait aller aider Sofia ou appeler les secours.'),
('C', '004-C-1', 'LE PREMIER TÉMOIN', 'Un proche est aperçu dans la rue et nie d''abord sa présence. La seule présence ne permet pas encore d''établir ce qu''il savait.', 'PRÉSENCE DANS LA RUE', 'Le proche de Sofia qui habite le quartier est vu dans la rue. Il avait d’abord nié être passé. On ignore ce qu’il savait.'),
('C', '004-C-2', 'UN DÉCALAGE ENTRE LES HEURES', 'Les journaux montrent que l''appel à l''ex-partenaire et le message à l''ami précèdent le passage rapporté. Aucun relais au troisième proche n''est documenté.', 'MESSAGES AVANT LE PASSAGE', 'Sofia a appelé son ex-partenaire et écrit à son ami avant le passage du proche du quartier. Rien ne montre qu’il avait été prévenu.'),
('C', '004-C-3', 'LA RUMEUR N''ÉTAIT PAS UNE ALERTE', 'L''horodatage du passage est authentifié mais postérieur aux messages. La rumeur inverse cet ordre. Le silence du troisième proche sur sa présence n''efface pas les choix antérieurs des deux premiers.', 'LA CAMÉRA CONTREDIT LA RUMEUR', 'La caméra situe le passage du proche du quartier après les messages. Une rumeur disait l’inverse. Les deux autres proches avaient reçu leurs alertes avant.')
), rebuilt AS (
 SELECT m.variant_id,
 jsonb_agg(
   CASE WHEN x.id IS NOT NULL THEN
    jsonb_set(jsonb_set(t.item,'{text}',to_jsonb(x.new_text),true),'{title}',to_jsonb(x.new_title),true)
   ELSE t.item END
 ORDER BY t.ord) new_trames, count(x.id) changed_count
 FROM igr_private.igr_v99_variant_manuscripts m
 CROSS JOIN LATERAL jsonb_array_elements(m.manuscript->'v230_runtime_trames') WITH ORDINALITY t(item,ord)
 LEFT JOIN edits x ON x.variant_id=m.variant_id
   AND x.id=t.item->>'id'
   AND x.old_title=t.item->>'title'
   AND x.old_text=t.item->>'text'
 WHERE m.scenario_id='004'
 GROUP BY m.variant_id
), updated AS (
 SELECT m.scenario_id,m.variant_id,b.changed_count,
 jsonb_set(m.manuscript,'{v230_runtime_trames}',b.new_trames,true) new_manuscript
 FROM igr_private.igr_v99_variant_manuscripts m JOIN rebuilt b ON b.variant_id=m.variant_id
 WHERE m.scenario_id='004' AND b.changed_count>0
)
UPDATE igr_private.igr_v99_variant_manuscripts m SET
 manuscript=u.new_manuscript,content_md5=md5(u.new_manuscript::text),updated_at=now()
FROM updated u WHERE m.scenario_id=u.scenario_id AND m.variant_id=u.variant_id
RETURNING m.scenario_id,m.variant_id,u.changed_count;
