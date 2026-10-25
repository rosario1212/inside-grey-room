# Rôles facultatifs — 003, 008, 009, 011 (25 octobre 2026)

| Dossier | Mode de base | Sixième joueur facultatif | Justification |
|---|---|---|---|
| 003 — Le Dernier Protocole | 4 : Enquêteur + 3 Suspects ; 5 : ajout de l'Analyste | Expert | Expertise documentaire de l'attaque biologique, sans attribuer une culpabilité non prouvée |
| 008 — Sous Serment | Enquêteur + Analyste + 3 Suspects | Juge | Arbitrage de pièces protégées et procédure contradictoire |
| 009 — Le Sujet 17 | Enquêteur + Analyste + 3 Suspects | Expert | Portée neuropsychologique de l'amnésie et du consentement |
| 011 — 36 Heures | Enquêteur + Analyste + 3 Suspects | Procureur | Coopérations vérifiables et chaîne de commandement |

- Aucune substitution d'un rôle de base ; le sixième rôle apparaît seulement lorsqu'un sixième participant rejoint.
- Les Expert disposent d'actions techniques sans divulgation des solutions A/B/C. Le Juge du 008 peut arbitrer trois éléments de procédure non secrets. Le Procureur du 011 dispose des outils généraux de négociation du moteur.
- Les autorisations des investigations spécifiques aux dossiers restent limitées à l'Enquêteur et à l'Analyste.
- Le serveur verrouille les variantes privées au début de la partie. L'éligibilité de publication est ajustée dans la même migration que les capacités.
- Migration : `supabase/migrations/20261025040000_igr_optional_roles_003_008_009_011.sql`.
- Contrôle structurel ajouté à Cloudflare Build Check et Production Deploy : `scripts/optional-roles-003-008-009-011-check.mjs`.
- QA serveur : quatre parties de six joueurs (une par scénario) démarrées, rôles et fiches validés, instantanés privés présents, transaction annulée. Pas de playtest humain réel certifié.
