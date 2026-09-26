# Inside Grey Room — v11.17, candidate consolidée

Version complète fondée sur la v11.16, avec les images et icônes de la dernière archive complète. Lire `V11.17_VALIDATION.md` pour les corrections et les limites.

## Installation

1. Conserver une sauvegarde de la version en ligne.
2. Publier `index.html`, `app-v11.js`, `styles-v11.css`, `manifest-v11.json`, `vercel.json`, `logo-door.svg` et `assets/` dans le projet existant.
3. Appliquer `backend-v11-17.sql` dans le projet Supabase existant au moment de la mise en service. Le script ajuste trois fonctions ; il ne remplace aucun scénario.
4. Vérifier une partie sur des appareils réels avant diffusion large.

Le serveur v4 existant est nécessaire : le correctif SQL n’est pas une installation du serveur à partir de zéro.

## Vérification

- `node --check app-v11.js`
- `node tests/regression.cjs`
- Exécuter `tests/server-regression.sql` après le correctif dans un environnement SQL autorisé. Il termine ses essais par ROLLBACK.
