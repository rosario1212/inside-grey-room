# Tribunal libre v707 — proposition, non publiée

## Décision de design
Le Tribunal ne doit plus être une série de monologues minutés. Lorsqu'un Juge joue, tous sont réunis en même temps ; le Juge dirige librement les débats. **Aucun chronomètre** ne gouverne les défenses, questions ou confrontations, ni en COURT ni en LONG. Le choix COURT/LONG conserve son sens dans les autres phases.

### Déroulement
1. Après l'Audience du camp Enquête (qui reste chronométrée et inchangée), le Juge appelle le premier Suspect et ouvre sa comparution.
2. Le Suspect et son Avocat officiel, s'il en a un, exposent la version des faits. Le Juge laisse les membres du camp Enquête poser des questions et confronte des déclarations. Il peut rappeler à la discussion n'importe quel Suspect déjà entendu, sans commande spéciale ni nouveau compteur.
3. Le Suspect confirme explicitement **« J’ai terminé ma défense / je garde le silence »**. Cette action ne termine pas le tribunal : le Juge peut encore lui poser des questions, mais le Suspect a renoncé à poursuivre sa défense principale.
4. Le Juge peut alors clore la comparution et appeler le suivant. Il ne peut pas clôturer tant que le Suspect n'a pas confirmé. Cette garantie est contrôlée côté serveur, non seulement par le bouton.
5. Après la dernière comparution, chaque rôle habilité vote secrètement, individuellement, sans concertation. Les règles de score et de révélation restent inchangées.

### Délimitation
- **Avec Juge :** Tribunal libre sans minuteur et Audience chronométrée, réservée au camp Enquête.
- **Sans Juge :** Audience et défenses **exactement** selon le format antérieur, avec leurs minuteurs.
- **Dossier 029 :** rapport des témoins, sans culpabilité 0/1/2 imposée.

### Simulation
L'Enquêteur accuse B. Le Juge appelle A. A se défend ; l'Avocat oppose une contradiction à l'Enquêteur. Le Juge invite B à répondre, puis redonne la parole à A. A confirme qu'il a terminé ; le Juge peut questionner encore, puis clôt cette comparution. Les autres Suspects sont entendus. L'Enquêteur révise son hypothèse et vote individuellement seulement après les débats.

### Validation
- Test SQL transactionnel des modes COURT et LONG : **OK**, aucune modification persistée pendant ce test.
- Test SQL des audiences et défenses sans Juge : **OK**.
- Test statique JS des invariants et contrôles de syntaxe : **OK**.
- Contrôles CI GitHub requis avant publication.

### Risque restant à tester
Un Suspect déconnecté pendant une comparution active peut empêcher de clôturer. Le mécanisme actuel de récupération d'un absent est limité aux tours en attente et au vote final ; son extension, sans introduire une fermeture arbitraire par le Juge, doit être vérifiée avant publication. Il ne faut pas affirmer qu'un tribunal illimité est exempt de blocages tant que cette situation n'a pas été testée.

**Statut : proposition isolée dans une branche, non déployée.**
