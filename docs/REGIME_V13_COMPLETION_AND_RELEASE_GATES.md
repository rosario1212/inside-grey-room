# LE RÉGIME — bilan de fin de développement candidat v13 (15 novembre 2026)

**Conclusion vérifiée : les neuf variantes privées, la logique serveur candidate et l'interface de procès sont écrites et testées de manière synthétique. La publication n'est PAS autorisée.** Le jeu public reste sur l'ancien moteur. Le verrou de publication est intentionnellement fermé. Les tests SQL ci-dessous ont tous été exécutés à l'intérieur de transactions **BEGIN/ROLLBACK**, sans installation des fonctions ou modification des salons réels.

## Contenu réalisé

| Dossier | Variantes privées réécrites | Traque / tribunal | Statut |
| --- | --- | --- | --- |
| 032 — Les Archives du Palais | A La directive détournée ; B L'ordre du ministre ; C La liste recomposée | Directeur de Vahran + ministre Intérieur recherchés ; secrétaire du palais | Candidat privé écrit |
| 033 — La Dynastie | A Les ordres de la famille ; B La signature sans témoin ; C Le pacte des comptes | Héritier + ministre Défense recherchés ; ancien financier | Candidat privé écrit |
| 034 — Les Noms qu'ils portaient | A La dernière instruction ; B La signature empruntée ; C Les trois circuits | Président + gendre sécurité recherchés ; communications ; LA TÊTE / LE SCEAU / LA TOUR | Candidat privé écrit |

**Chacun des neuf candidats contient** trois fiches privées, quatre actes à reconstituer, trois pièces garanties, douze investigations facultatives (quatre/cycle, une activable collectivement), huit pistes de capture (quatre par fugitif), douze décisions de fugitifs (deux par fugitif/cycle), deux voies d'alliance, une mission du troisième suspect, les règles de tribunal et des communiqués du Journal de Karsane.

**Correction de dernière minute :** les preuves de capture des cycles 2 et 3 ont été reliées à des investigations réelles, pour les deux fugitifs de chaque variante. Une décision de protection d'un contact au C1 peut créer une exposition vérifiable au C2 ; le coût n'est plus purement textuel.

## Fichiers du code candidat (branche uniquement)

- `supabase/candidates/igr_regime_v13_private_runtime.sql` — tables privées RLS, drapeau release désactivé, pin privé, état joueur filtré, actions rôle/autorisations/idempotence.
- `supabase/candidates/igr_regime_v13_judicial_runtime.sql` — mandats sur deux preuves indépendantes, examen Juge, capture, édition spéciale de Darsen, tribunal 14/8, voix encadrées, quatre actes, saut des discours de l'audience v52 doublonnée.
- `supabase/candidates/igr_regime_v13_final_scoring.sql` — déclaration finale du troisième suspect, score tactique et judiciaire sur les vrais packs A/B/C, résultats individuels et vote historique 0–2 préservé.
- `supabase/candidates/igr_regime_v13_court_exchanges.sql` — questions, objections, réponses et décisions du Juge, limitées à la fenêtre de cinq minutes ; impossible pour un fugitif encore libre de comparaître.
- `supabase/candidates/igr_regime_v13_lifecycle_patch.sql` — huit fonctions historiques v4/v52 conservées avec branche de Régime strictement derrière drapeau release ; rôles minimum 6, Juge, cartes réécrites, trames, transition de tribunal, révélation finale.
- `regime-live-v13.js`, `regime-live-v13.css` — salle commune sombre, places, barre, horloges, décisions de traque, preuves, interrogations et reconstitution. Formulaires conservés lors des synchronisations ; affichage uniquement quand le serveur indique `regime_v13_active=true`. Intégrés au build de la branche, non déployés.
- `.github/workflows/regime-candidate-qa.yml` — vérification du prototype Node, de l'interface et des verrous de diffusion, **sans déclenchement de publication**.

## QA effectuée

1. **153/153 assertions SQL privées passées** pour les neuf variantes (sans divulguer leurs faits scellés).
2. **576 combinaisons d'investigations** parcourues (9 variantes × 64 choix) : par variante, 56/64 combinaisons ouvrent des sources suffisantes pour au moins trois actes, 18/64 pour quatre actes, 8/64 pour deux actes. L'interprétation humaine n'est pas simulée par cette matrice.
3. **66 scénarios synthétiques de règles** sur les neuf variantes, les deux alliances, les captations de preuves C1 et le troisième suspect ; dernière vérification validée avant les adaptations SQL v13.
4. **25/25 tests unitaires** du noyau générique, avant intégration au nouveau serveur.
5. **Cinq familles de tests SQL transactionnels réussies** sur le vrai PostgreSQL : rôles et mandats, démarrage natif du 034 à six joueurs avec Juge et vote v52, objections/réponses et fenêtre de cinq minutes, captures aux C2 et C3, coût différé de la protection d'un contact. *Chaque exécution incluait ROLLBACK.*
6. Les bugs découverts pendant les tests (impossible d'enregistrer la reconstitution dans un objet JSON absent, problème de nom réservé SQL, prise de parole accélérée, absence de pistes C2/C3, authentification de la pièce du troisième suspect) ont été corrigés sur la branche.

## Publication : dernières conditions NON remplies

- **0/9 manuscrits privés approuvés** : les nouvelles fiches `regime_vnext` sont `draft`, les anciens canons restent actifs et en `review`. Les preuves C3 n'ont pas l'attestation de source humaine `verified`.
- **0 module v13 installé sur la base active** : la requête de contrôle `to_regclass('igr_private.igr_regime_v13_rooms')` et l'URL SQL `to_regprocedure('public.igr_regime_v13_warrant(...)')` retournent NULL. C'est voulu : les tests des migrations n'ont pas été appliqués hors transaction.
- **Aucune partie multijoueur réelle en conditions normales** avec les nouvelles variantes, ni test web/iOS/Android complet, interruption réseau, latence, 6–9 joueurs et transitions de longue durée. Les tests transactionnels ne les remplacent pas.
- **CI de la tête de PR non confirmée** ; les seuls workflows vus dans l'historique sont antérieurs au nouveau code. Les 8 fonctions historiques de la migration candidate sont des instantanés : les comparer à nouveau au code de production au moment du déploiement, pour ne pas écraser d'autres modifications.
- Certaines décisions de fuite secondaires `shift_network`/`delay_lead` ont un résultat narratif tracé mais nécessitent encore un test de conséquence tactique effective (ne pas affirmer qu'elles modifient une cache sans preuve).
- **Les protocoles d'audience d'autres scénarios avec Juge** restent au stade de conception v8. Ce jalon est consacré au DLC Régime.

## Critères de publication réellement vérifiables

1. Relecture humaine et validation éditoriale des neuf variantes (responsabilité juridique, causalité, motifs, crédibilité et équilibre), plus preuve de C3 garantie.
2. Test multijoueur avec les neuf variantes : 0/2, 1/2, 2/2 captures, toutes les fenêtres C1–C3, alliance ensemble/séparés, déconnexion/reconnexion, juge présent/absent, acteurs à 6/7/8/9 et les deux missions du troisième suspect.
3. Confirmer les conséquences tactiques des **douze décisions** par variante, pas seulement leur présence comme texte.
4. CI complète sur la PR, audit des changements à `igr_v4_*`/v52 à partir du moteur de production du jour.
5. Installation contrôlée des migrations, permission de sortie limitée aux canons réellement approuvés, déploiement Cloudflare sur le SHA approuvé, puis smoke-tests de production.
6. Conserver le drapeau de release à **FALSE** jusqu'à ces validations. Ne pas déclarer « publié » avant d'avoir vérifié le serveur, la version du client et les données privées.

**Évaluation :** fiction et proto de gameplay complet en branche de travail, avec preuves fortes de compatibilité en SQL simulé ; sortie publique toujours bloquée volontairement par les contrôles de sécurité et de qualité.
