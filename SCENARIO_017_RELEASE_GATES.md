# Dossier 017 — Le Prix du silence · Audit de refonte privée

État du 24 octobre 2026 : refonte narrative de conception, **non publiée**. L’ancien scénario public reste inchangé.

## Invariants de jeu
- 7 joueurs : Enquêteur, Analyste, Procureur, trois Suspects et un Témoin.
- 8 joueurs : mêmes rôles et un second Témoin.
- Le Procureur conserve jusqu'à deux entretiens réussis, avec interlocuteurs distincts, dans la phase annexe correspondante.
- Les trois variantes A/B/C doivent être tirées aléatoirement et figées par salon avant diffusion de cartes privées.

## Travail intégré en privé
- Trois variantes, chacune avec une chaîne causale indépendante et trois conclusions différentes.
- Une révélation obligatoire par cycle, avec provenance documentaire, sans indice facultatif indispensable à la conclusion.
- Neuf investigations facultatives par variante (trois choix à chaque cycle).
- Deux positions de témoins réellement distinctes : survivant de la séquestration et conducteur des trajets, adaptées séparément à chaque variante.
- Trois responsabilités et un verdict à trois axes : acte, décision qui détermine le prolongement, dissimulation.
- Relations dirigées entre trois suspects préservées.
- Constructeur privé `igr_private.igr_v320_017_build_pack(variant_id)` installé dans Supabase, sans accès direct aux rôles `anon` ni `authenticated`.

## Audit structurel réalisé
Les packs A, B et C produisent chacun 3 suspects, 2 témoins, 3 trames, 9 investigations, 3 degrés de responsabilité, 3 sources de relations et un verdict à 3 axes.

## Ce qui manque
- Revue approfondie des cartes privées de suspects et des contradictions croisées.
- Tirage aléatoire figé dans un instantané par salon, avec versions A/B/C effectivement diffusées dans le moteur public.
- Vérification des restrictions par rôle (Enquête, Procureur, témoins, suspects) et de la visibilité des preuves.
- Reconstruction finale privée dans l'interface et correction du verdict.
- Tests de parties à 7 et 8 joueurs, reconnexion, fin, révélations et non-régression des autres dossiers.
- Approbation éditoriale et activation seulement après passage des contrôles.

Aucun texte de révélation ou solution privée n'est stocké dans GitHub.
