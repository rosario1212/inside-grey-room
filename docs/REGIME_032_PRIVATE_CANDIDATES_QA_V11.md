# LE RÉGIME — 032, trois variantes privées réécrites (jalon v11)

**Statut : nouveaux brouillons PRIVÉS enregistrés dans Supabase, non approuvés, non activés, sans remplacement des anciennes vérités de jeu.**

## Modification réelle des manuscrits

Les variantes A/B/C du **032 — Les Archives du Palais** possèdent une nouvelle section privée `manuscript.regime_vnext`. Les manuscrits historiques, leur `canonical_truth` ancien et leur statut `review` restent intacts : l’application n’utilise donc pas le nouveau récit par accident.

Personnages incarnés par les pseudonymes de joueurs : **directeur de Vahran** (fugitif 1), **ministre de l’Intérieur** (fugitif 2) et **secrétaire général du palais** (troisième suspect interrogeable). Enquêteur, Analyste et Juge constituent les trois autres rôles fondamentaux ; Procureur éventuellement facultatif après adaptation du serveur.

| Variante | Tension dramatique (sans dévoiler la solution) | Troisième suspect |
| --- | --- | --- |
| A — La directive détournée | Consigne de surveillance et détentions illégales dont l’origine doit être distinguée des autorisations ultérieures | Voie coopération |
| B — L’ordre du ministre | Ordre venu du pouvoir et actes supplémentaires dont la responsabilité propre de la prison doit être établie | Voie protection |
| C — La liste recomposée | Modifications des listes, prolongations et rôles des trois administrations | Voie coopération |

Chaque candidat possède **3 fiches privées, 4 actes criminels scellés distincts, 3 pièces garanties (C1/C2/C3), 12 investigations facultatives (4 choix à chaque cycle, une activable collectivement), 8 indices de traque (4 par fugitif), 12 contre-décisions de fugitifs (2 par fugitif et par cycle)**, un objectif personnel du troisième suspect, deux configurations d'alliance possibles, des dépêches de Karsane et une description des quatre actes à débattre au tribunal.

### C1 : action risquée contre décision moins exposante

Pour chaque fugitif, la première option de C1 peut créer une contradiction publique qui ouvre une **deuxième source indépendante de capture** ; la seconde offre un autre avantage au prix d'une protection affaiblie sans livrer directement la même piste C1. Le camp Enquête peut également rechercher les preuves pertinentes via une investigation adaptée. Aucune capture n'est gratuite : le Juge contrôle le mandat, les preuves appartiennent au dossier et chaque personne requiert sa propre justification.

**Important :** les déclencheurs précis et les vérités A/B/C sont stockés uniquement dans la zone privée. Le lien entre événements de décision et publication effective d'indices sera à connecter via RPC serveur et transactions sûres ; la présence de la donnée ne suffit pas à faire fonctionner le bouton.

## Vérifications effectuées

- **63 contrôles structurels privés / 63 passés**, par `supabase/tests/igr_regime_032_candidate_drafts_qa.sql`. Ils vérifient notamment les trois rôles, quatre actes, origine indépendante des pièces, trois cycles, contreparties des décisions, missions du troisième suspect, compatibilité du tribunal, existence du choix prudent et **verrou de publication maintenu**.
- **64 × 3 = 192 sélections possibles d'investigation** parcourues en SQL, par `supabase/tests/igr_regime_032_playability_matrix.sql` :
  - pour chacune des variantes, **56/64** combinaisons donnent matériellement assez de pièces indépendantes pour reconstituer **au moins 3 actes sur 4**, sous réserve d'identifier correctement les responsables ;
  - **18/64** permettent de corroborer les quatre actes, **8/64** n'en corroborent que deux ;
  - ce résultat mesure l'**accessibilité des sources**, pas la difficulté psychologique d'une partie humaine.
- Contrat de règles générique `scripts/regime-rules-v10.mjs` avec **25 tests synthétiques passés** au dernier audit ; aucun secret des variantes dans le code GitHub.
- `igr_private.igr_v100_preflight('032')` renvoie **`release_eligible=false` et `approved=0`**. Les deux autres scénarios sont également verrouillés.
- Les tables des manuscrits restent dans `igr_private`, avec RLS et sans lecture accordée aux rôles `anon` et `authenticated`.

## Corrections de cohérence intégrées

- La mission **PROTECTION** du troisième suspect utilise le **vote général 0/1/2 existant sur sa responsabilité**, et non un faux sous-vote judiciaire par acte. L'acte ciblé sert à sa défense et à la confrontation.
- Les pièces garanties peuvent corroborer deux actes distincts, ce qui rend atteignable une réussite de 3/4 sans ouvrir mécaniquement tous les secrets.
- La pièce remise par le troisième suspect en mode coopération est définie comme document authentique mais n'est rendue publique **que lorsqu'il décide de la remettre** ; la défense du troisième suspect en mode protection reste une déclaration contestable, jamais une preuve créée de toutes pièces.

## Pourquoi le 032 n'est pas encore publié

**Bloqueurs techniques réels** : le runtime actuel du 032 exige encore le Procureur parmi ses rôles de base et n'impose pas le Juge à six joueurs. Aucun RPC serveur ne gère encore les mandats, les décisions secrètes, les captures et ces variantes. L'interface de la salle commune et la suppression de l'audience doublonnée ne sont pas développées. Les cartes exigent une relecture narrative humaine et de vrais tests multijoueurs.

**Prochaine livraison utile** : adaptateur serveur sécurisé entre `regime_vnext` et les jetons des joueurs, puis salon-test à six joueurs (les deux fugitifs, le troisième suspect, Juge, Enquêteur, Analyste) avec mandat C1, interrogatoires, preuves et vote final. Ensuite seulement transposer le moteur à 033–034, valider les neuf packs et publier.
