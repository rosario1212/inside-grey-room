# Scénario 016 — LE DERNIER ÉTAGE · Audit et porte de publication

## Canon public confirmé
Une victime liée à un réseau de narcotiques est droguée, humiliée et filmée, puis retrouvée morte. La vidéo s'arrête avant le geste fatal : la reconstitution doit distinguer ce qui est **visible**, ce qui est **inféré**, et ce qui est **établi indépendamment**. Le film ne prouve pas, à lui seul, l'auteur du décès.

## Contrat de rôles
- 5 joueurs : Enquêteur, Analyste, 3 Suspects.
- 6 joueurs : + Maître (avocat).
- 7 joueurs : + Journaliste.
- 8 joueurs : + Juge.
- Respecter le droit du Suspect de renoncer au Maître et la faculté du Maître de cesser sa représentation selon les règles existantes, sans appliquer les pénalités spécifiques aux scénarios CARTEL 030/031.
- Les rôles additionnels ne doivent pas accéder aux preuves et solutions privées du camp Enquête, sauf disposition explicitement autorisée par leurs règles.
- Aucun joueur ne doit déduire l'identité de la variante depuis les métadonnées, les identifiants publics, l'ordre des affichages ou les erreurs serveur.

## Exigences sur les variantes
Avant activation, inspecter les trois manuscrits privés canoniques A/B/C pour chacune des questions ci-dessous. **Le connecteur Supabase refuse actuellement la lecture de ces manuscrits : leur exact contenu n'a pas été vérifié.** Ne pas inventer leur vérité ou remplacer le contenu par des hypothèses.

1. **Actes avant la fin de la vidéo** : auteur, témoin et participant ; établir le consentement absent et ne jamais confondre participation à l'humiliation et responsabilité homicide.
2. **Événements après la coupure** : départs, interventions tardives, découverte du décès, connaissances partielles et contradictions entre suspects.
3. **Cause du décès** : ne déduire ni homicide volontaire ni causalité exacte de la seule vidéo, ni de la seule consommation de substance ; exiger une preuve distincte ou laisser explicitement l'incertitude.
4. **Abandon et non-assistance** : qui savait quoi, quand et avec quelle capacité d'action ; ne pas transformer une simple présence en causalité établie.
5. **Fiches privées complémentaires** : les trois Suspects doivent disposer de fragments utiles, certains corroborables, d'autres contradictoires. Inclure une chronologie personnelle, le fait su, le fait tu, l'objectif et trois accroches d'interrogatoire.
6. **Rejouabilité** : A/B/C doivent différer réellement par la chronologie post-vidéo, le degré de savoir et les responsabilités, pas seulement par les noms.

## Contrat d'enquête
- Une pièce d'enquête documentaire **garantie** par cycle (3 cycles), même si les enquêteurs ne choisissent aucune action.
- Trois recherches facultatives par cycle, une seule déclenchée par cycle et par camp ; résultats d'enquête accessibles uniquement aux rôles autorisés.
- Chaque document fictif doit avoir un titre, un texte clair, une source vérifiable **dans le cadre de la fiction**, le cycle, l'effet narratif et un lien à l'une des hypothèses.
- Le dossier commun peut contenir les annonces du Journaliste, pas les fiches privées ou la vérité du moteur.
- Verdict final à **trois axes documentés** à concevoir après lecture du canon privé et validation stricte côté serveur ; le scoring doit comparer au snapshot du salon et distinguer vrai, faux et incertain selon le scénario canonique.

## Sécurité/production — non négociables
- Garder le manuscrit, les réponses et la variante épinglée dans `igr_private`, hors du client et du dépôt GitHub.
- A/B/C tirées aléatoirement au démarrage, fixées pour toute la partie, et jamais partagées avec d'autres salons.
- Tester 5/6/7/8 joueurs, 3 cycles, accès par rôle/jeton, doublons d'investigation, cartes et révélations.
- Tester que la disparition éventuelle du Maître n'interrompt pas la partie et n'active pas par erreur les sanctions du DLC cartel.
- QA uniquement transactionnelle (BEGIN/ROLLBACK) : aucune partie fictive persistante.
- Vérifier 5 CI (web/Cloudflare, Android, iOS, Store et interface), déploiement du **SHA exact** sur Cloudflare, puis et seulement puis approuver le contenu privé et activer le statut `eligible=true`.
- Vérifier que les scénarios 001 à 015 restent utilisables.
- Une partie humaine à 5–8 joueurs reste nécessaire avant de déclarer le scénario parfait.

## Statut
**En préparation ; non publié dans ce chantier.** Accès de lecture au contenu privé refusé par les contrôles du connecteur. Aucun manuscrit 016, aucun garde serveur, aucune fonction centrale, aucun scénario antérieur ni aucun déploiement de production n'a été modifié au titre du dossier 016.
