# V720 — fiabilité des scénarios de base et des DLC (16 novembre 2026)

## Périmètre
Les vingt dossiers classiques (001–020) et les quatorze dossiers des quatre DLC (021–034).
Aucune intrigue, vérité privée, identité de variante, score ou règle de majorité n'est modifiée.

## Correctifs confirmés
1. **Entrée dans une cellule** : si la création / l'arrivée est acceptée par le serveur mais que la première lecture d'état échoue, les clés restent enregistrées, un écran neutre permet de relancer la lecture du même salon et aucun nouveau salon n'est créé.
2. **Choix de rôle** : en cas de refus serveur, le choix optimiste revient au dernier rôle confirmé même lorsque la synchronisation suivante ne répond pas. Les modifications successives restent sérialisées.
3. **Démarrage hôte** : si la réponse du serveur a été perdue, une lecture de l'état fait foi avant de signaler une erreur. Les véritables problèmes de composition, de taille et de disponibilité ont des messages distincts.
4. **Régressions** : scénario 007, rôles et vote collectif, Terreur, Cartel 031, Omertà et Régime gardent leurs tests dédiés et le build complet.

## État de la base de production observé avant cette correction (lecture seule)
- Les 34 dossiers 001–034 ont une base de contenu structurée et un contexte public.
- Les 20 dossiers 001–020 ont leur release gate actif et trois variantes validées.
- Les 29 dossiers non-Omertà ont une distribution générique de rôles conforme aux capacités sur toutes les tailles de groupes annoncées ; Omertà utilise intentionnellement **son propre démarrage** et son propre casting, non les rôles du moteur générique.
- Omertà (contrôle standalone), Régime et le dossier 029 disposent d'un contrôle d'activation positif ; 007 est autorisé.
- **Réserve Cartel 029 :** le contrôle historique `passed_end_to_end_testing` demeure `false`, et les quinze vérifications de signature éditoriale du prévol v135 ne sont pas renseignées (`signed = 0`). Le prévol structurel est présent/approuvé pour 15 variantes et le contrôle opérationnel renvoie actif. Ces marqueurs **ne sont pas assimilés à une certification réussie** et ne doivent jamais être passés à `true` sans preuve de vérifications effectives. La publication existante n'est pas désactivée arbitrairement.

## Tests humains restant nécessaires
Passage réel Wi-Fi / 4G / 5G, perte de réponse du lancement, doubles tentatives, contrôle des rôles et décisions sur plusieurs appareils, dossiers de 4 à 16 joueurs, DLC à 6–11 joueurs, verdicts et reconnections. Les tests de compilation ou de contrat n'équivalent pas à ces essais.
