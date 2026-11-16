# KUROI v715 — audit de gameplay et contrat de publication

## Décision de conception
Conserver l'intrigue 040–044, les trois réponses par dossier, les personnages et la progression séquentielle. La différence avec CENDRES est le **poids social des dettes**, la conservation des preuves et le coût politique de la décision finale. Ne pas ajouter des rôles décoratifs.

### Dossiers et fonctions
| Dossier | Question collective | Fonction ludique | Éléments hérités |
|---|---|---|---|
| 040 L'OYABUN | Structure du meurtre | Distinguer celui qui décide de celui qui donne accès | Perception de la police et du clan rival |
| 041 GIRI | Sens et origine de la dette | Éviter la confusion entre ancienne faveur et obligation criminelle | Registre et soupçons contre les intermédiaires |
| 042 LES MAINS SALES | Conservation du registre | Trois protections imparfaites, trois coûts | Existence ou non d'une chaîne de garde indépendante |
| 043 LA DETTE | Chaîne de responsabilité | Séparer l'instruction, la facilitation et le geste | Qualité de la preuve dépend du dossier 042 |
| 044 LE CONSEIL | Destination des preuves et devoirs | Verdict qualitatif : autorité extérieure, arrangement interne ou récit mensonger | Final conditionné par les dossiers 042 et 043 |

### Joueurs et rôles
- 5 : WAKAGASHIRA KUROKAWA, KOBUN KUROKAWA, WAKAGASHIRA ARAKIDA, COMMISSAIRE, INSPECTEUR.
- 6 : les cinq précédents et BENGOSHI.
- 7 : les six précédents et KOBUN ARAKIDA.
- Les annexes des rôles absents se limitent à des faits recoupables, **jamais** à leurs fiches privées intégrales. Une note de l'avocat ne doit pas livrer tout le commandement du meurtre.
- La confrontation des informations et des intérêts est centrale. Le joueur ne doit jamais être obligé de révéler son secret pour que l'enquête ait une issue.

### Autorité collective
- Sur téléphone partagé : chacun vote en privé ; le suivant ne voit pas son choix.
- Sur téléphones individuels : jeton de participant validé par le serveur, y compris celui de l'hôte.
- Quorum intégral des 5–7 participants, majorité absolue (3/5 ; 4/6 ; 4/7). Sans majorité : tour suivant avec urne vide.
- L'hôte contrôle uniquement les transitions de phases, pas le verdict. Déconnexion = place conservée, pas baisse du quorum.

### Registre et sauvegarde
- Une validation durable contient en **une seule écriture** : chapitre, choix, drapeaux, membres des clans, dettes et Chronique.
- Une sauvegarde interrompue ne fait pas avancer la progression ; la validation peut être retentée.
- La confirmation de fin en ligne est reconstituable depuis le verdict signé par le serveur.
- Les replays ne modifient jamais l'état canonique.

### Finale
- **Publication extérieure :** l'enquête est transmise, mais les responsabilités judiciaires ne sont pas automatiquement prononcées. Le résultat distingue la chaîne solidement corroborée, la pièce incomplète et l'absence de preuve suffisante.
- **Arrangement interne :** les personnes peuvent être mises en cause dans le Conseil sans devenir automatiquement détenues.
- **Attribution au clan rival :** le groupe peut choisir ce récit, mais la réponse ne devient jamais une vérité factuelle dans l'Héritage.

### Vérifications
- `scripts/v715-kuroi-playtest-check.mjs` : 5, 6 et 7 joueurs, 3 trajectoires, 9 campagnes, 45 dossiers, 180 phases, vote privé, égalités, replays, panne de sauvegarde, résultat en ligne.
- `supabase/tests/igr_v715_kuroi_majority_integration.sql` : PostgreSQL isolé, votes par jeton, révocation des raccourcis hôte, scrutin complet, relance sans majorité, CENDRES préservé.
- Régressions : CENDRES v713/v714 ; builds iOS, Android, web, affichage, Store.
- Limite : l'intérêt des rôles et le rythme des échanges à 5–7 humains demandent encore un test réel, pas seulement automatisé.
