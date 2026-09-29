/* Inside Grey Room v12.20 — cold, direct language pass
   Copy only. No phase, timing, scoring, role, evidence or gameplay rule is changed.
   Principle: the mystery stays complex; the language stays simple, human and brutal.
*/
(() => {
  const REV = 'v12.20-cold-copy-20260929';

  const COPY = {
    '001': {
      short: 'Maël Sénéchal est retrouvé mort, poignardé, dans la chambre 222. Trois personnes étaient là cette nuit. Leurs versions se contredisent.',
      context: 'Maël Sénéchal est retrouvé mort, poignardé, dans la chambre 222. Trois personnes ont croisé sa route cette nuit-là. Les horaires, les traces et leurs mensonges ne racontent pas la même histoire.'
    },
    '002': {
      short: 'Léon s’est suicidé. Personne ne l’a tué de ses mains. Mais plusieurs personnes ont joué un rôle dans les jours qui ont précédé sa mort.',
      context: 'Léon s’est suicidé. Avant sa mort, il a été humilié, repoussé et laissé seul à plusieurs moments. Il faut comprendre ce que chacun a réellement fait.'
    },
    '003': {
      short: 'Une attaque biologique frappe une gare. Plus de cent morts. La piste mène au Centre Helios.',
      context: 'Une attaque biologique frappe une gare et fait plus de cent morts. La piste remonte au Centre Helios. Plusieurs décisions ont rendu l’attaque possible.'
    },
    '004': {
      short: 'Sofia meurt d’une overdose après avoir appelé trois personnes à l’aide. Toutes ont reçu son appel. Aucune n’est intervenue à temps.',
      context: 'Sofia mélange alcool et médicaments puis appelle trois proches à l’aide. Elle meurt d’une overdose. Chacun avait encore une occasion d’agir.'
    },
    '005': {
      short: 'Une victime est retrouvée morte avec un masque blanc. Tout fait penser à un meurtre rituel. Mais certains détails ne collent pas.',
      context: 'Keller est retrouvé mort avec un masque blanc. La scène ressemble aux anciens crimes du Masque Blanc. Pourtant, plusieurs détails montrent que quelqu’un a peut-être copié sa méthode.'
    },
    '006': {
      short: 'Cinq ans après la mort de Noé dans un chalet isolé, l’affaire est rouverte. Ses anciens amis ont tous gardé le silence. Aujourd’hui, leurs versions ne concordent plus.',
      context: 'Noé est mort cinq ans plus tôt dans un chalet isolé. Ses trois anciens amis ont gardé la même histoire pendant des années. Maintenant, leur silence commence à se fissurer.'
    },
    '007': {
      short: 'Un héritage déchire une famille. Puis l’un d’eux meurt. Chacun avait quelque chose à gagner.',
      context: 'Une famille se déchire autour d’un héritage. Pressions, dettes et secrets s’accumulent. Puis un membre de la famille meurt.'
    },
    '008': {
      short: 'Plusieurs témoins jurent de dire la vérité. Leurs versions se contredisent. Quelqu’un ment. Reste à savoir ce que chacun cherche à cacher.',
      context: 'Plusieurs témoins parlent sous serment. Leurs horaires et leurs versions ne peuvent pas tous être vrais. Chacun a une raison différente de mentir.'
    },
    '009': {
      short: 'Le Sujet 17 retire son consentement. L’expérience continue quand même. Après une chute, il perd une partie de sa mémoire. Qui a décidé de continuer ?',
      context: 'Le Sujet 17 demande clairement l’arrêt du programme ORPHÉE. La procédure continue malgré son refus. Après une chute, une amnésie réelle brouille une partie des faits.'
    },
    '010': {
      short: 'Nora Weiss est retrouvée morte derrière un mur. Quelqu’un l’y a enfermée vivante. Et quelqu’un savait peut-être qu’elle était encore là.',
      context: 'Nora Weiss est retrouvée morte derrière un mur. Elle avait été enfermée vivante. Les horaires, les bruits et une ouverture à 13 h 54 vont montrer qui savait quoi.'
    },
    '011': {
      short: '36 heures d’opération. Des villages détruits, des morts et des disparus. Des ordres ont été donnés, exécutés et certains faits falsifiés. Qui a décidé, qui a obéi et qui a couvert les faits ?',
      context: 'Une opération militaire fictive laisse des villages détruits, des morts et des disparus. Un ordre a été donné. Sur le terrain, il a été dépassé. Après les faits, certains rapports ont été réécrits.'
    },
    '012': {
      short: 'Sacha veut quitter une communauté. Il est battu, retenu et isolé pendant près de vingt heures avant de s’échapper. Qui a ordonné ça, qui l’a fait et qui a laissé faire ?',
      context: 'Sacha annonce qu’il veut partir. Son téléphone est confisqué. Il est frappé puis enfermé contre son gré pendant près de vingt heures avant de réussir à fuir.'
    },
    '013': {
      short: 'Le président Kessler est assassiné par un tueur payé. Le tireur est connu. Reste à découvrir qui a commandité, financé et préparé l’assassinat.',
      context: 'Le président Kessler est abattu par un tireur payé. Le meurtrier a reçu de l’aide : accès, argent, matériel et informations. Il faut remonter toute la chaîne.'
    },
    '014': {
      short: 'Une fuite expose onze informateurs et leurs familles. Quelqu’un a sorti l’information. Quelqu’un l’a exploitée.',
      context: 'Les identités de onze informateurs sont compromises avec leurs familles. Plusieurs personnes ont ouvert des brèches. L’une d’elles a reconstitué et vendu la liste.'
    },
    '015': {
      short: 'Une médecin est retrouvée morte alors qu’elle enquêtait sur ÉLIGIBLES. Dans son hôpital, des patients encore sauvables ont été considérés comme perdus. Après sa mort, certains dossiers ont été retouchés.',
      context: 'Une médecin est retrouvée morte alors qu’elle enquêtait sur ÉLIGIBLES. Des alertes médicales avaient été ignorées et des patients encore récupérables avaient été maintenus dans un dispositif dangereux. Après la mort, des notes ont été modifiées.'
    },
    '016': {
      short: 'Une victime est droguée, humiliée et filmée. Plus tard, elle est retrouvée morte. La vidéo s’arrête avant le meurtre.',
      context: 'Une victime est enlevée, droguée, humiliée et filmée. La caméra s’arrête. Après, quelqu’un décide de la tuer. Le meurtre n’apparaît sur aucune image.'
    },
    '017': {
      short: 'Deux personnes sont enlevées. L’une meurt. L’autre ressort vivante. Ce qui s’est passé entre les deux, personne ne veut vraiment l’expliquer.',
      context: 'Deux personnes sont enlevées et retenues. L’une meurt pendant la séquestration. L’autre est libérée sous menace. Après la mort, des messages disparaissent et de l’argent circule.'
    },
    '018': {
      short: 'L’ancien directeur d’un foyer abusif est retrouvé mort devant neuf assiettes. Sur chacune, le nom d’un ancien résident. Quelqu’un a voulu laisser un message.',
      context: 'L’ancien directeur d’un foyer abusif est retrouvé mort devant neuf assiettes portant les noms d’anciens résidents. Mais la mise en scène n’a peut-être pas été faite par le meurtrier.'
    },
    '019': {
      short: 'Un lanceur d’alerte est retrouvé mort pendant un gala, quelques minutes avant de révéler un détournement de fonds. Plusieurs personnes avaient intérêt à l’empêcher de parler.',
      context: 'Pendant un gala d’élite, un lanceur d’alerte est tué avant de pouvoir rendre son dossier public. Quelqu’un voulait le faire taire. Quelqu’un d’autre a choisi de le tuer.'
    },
    '020': {
      short: '327 personnes meurent dans l’incendie du Bal des Fondateurs. Certaines portes auraient encore pu être ouvertes. Il faut comprendre quelles décisions ont transformé un départ de feu en 327 morts.',
      context: '327 personnes meurent dans l’incendie du Bal des Fondateurs. Des sorties restent fermées, l’alarme tarde et des systèmes de sécurité sont défaillants. Aucun de ces faits, seul, n’explique le massacre.'
    }
  };

  try {
    for (const sc of SCENARIOS) {
      const copy = COPY[sc.id];
      if (!copy) continue;
      sc.short = copy.short;
      sc.context = copy.context;
      if (typeof PUBLIC_LOBBY_SUMMARIES !== 'undefined') PUBLIC_LOBBY_SUMMARIES[sc.id] = copy.short;
    }
    publicScenarioSummary = id => COPY[id]?.short || scenario(id).short;
    canonicalBriefingText = id => COPY[id]?.short || publicScenarioSummary(id);
  } catch (e) { console.warn('cold copy scenarios', e); }

  try {
    if (ROLE_INFO?.enqueteur) ROLE_INFO.enqueteur.body = 'Tu diriges les interrogatoires. À la fin, tu dois dire ce que chaque suspect a réellement fait.';
    if (ROLE_INFO?.analyste) ROLE_INFO.analyste.body = 'Tu écoutes, compares les versions et aides l’Enquêteur à reconstruire les faits.';
    if (ROLE_INFO?.suspect) ROLE_INFO.suspect.body = 'Tu es au cœur du dossier. Défends ta version, mais ne change jamais les faits écrits sur ta carte.';
  } catch (_) {}

  try {
    privateCardHtml = function() {
      const d=STATE.sync,p=d?.player,ps=p?.private_state||{},pub=p?.public_role||STATE.role,secret=p?.secret_role;
      const secretInfo=secret==='espion'?valueBlock('MISSION SECRÈTE',ps.secret_mission||'Ta couverture publique reste Suspect.','secret-alert'):'';
      return `<div class="private-card-v11"><div class="kicker">CARTE PRIVÉE · NE LA MONTRE À PERSONNE</div><h2>${h(displayRole(pub,p?.pseudo||STATE.playerPseudo))}</h2><div class="role-summary"><b>TON OBJECTIF</b><span>${h(roleInfo(secret==='espion'?'espion':pub).win)}</span></div>${valueBlock('QUI TU ES',ps.place)}${valueBlock('CE QUE TU AS FAIT',ps.chronology)}${valueBlock('CE QUE TU CACHES',ps.hide,'danger-soft')}${valueBlock('CE QUE TU SAIS',ps.anchors)}${valueBlock('TES LIENS',ps.relations)}${valueBlock('TES CLIENTS',ps.clients)}${valueBlock('TA LIGNE DE DÉFENSE',ps.position)}${secretInfo}<div class="private-foot">Cette carte dit ce qui est vrai. Tu peux mentir à l’oral si ton rôle le permet. Tu ne peux jamais inventer de nouveaux faits, changer les horaires, les preuves ou les lieux.</div></div>`;
    };
    if (typeof renderRole === 'function') {
      const baseRenderRole = renderRole;
      renderRole = function(...args) {
        const out = baseRenderRole.apply(this,args);
        const btn = document.querySelector('.role-card-v11 .btn.primary.block');
        if (btn && /J’ai compris/.test(btn.textContent||'')) btn.textContent = 'J’ai lu ma carte';
        return out;
      };
    }
  } catch (e) { console.warn('cold copy cards', e); }

  try {
    phaseLabel = ph => ({
      briefing:'OUVERTURE DU DOSSIER',
      role_reading:'VOTRE DOSSIER',
      initial_debrief:'PREMIERS SOUPÇONS',
      interrogation_select:'QUI INTERROGER ?',
      interrogation:'INTERROGATOIRE',
      cycle_debrief:'POINT D’ENQUÊTE',
      annex_inspecteur:'ENTRETIEN INSPECTEUR',
      annex_procureur:'ENTRETIEN PROCUREUR',
      annex_juge:'ENTRETIEN JUGE',
      annex_temoin:'TÉMOINS',
      annex_journaliste:'ENTRETIEN JOURNALISTE',
      annex_expert:'ENTRETIEN EXPERT',
      trame:'NOUVEL ÉLÉMENT',
      closed:'PLUS AUCUN INDICE',
      provisional_orals:'PREMIÈRES CONCLUSIONS',
      provisional_lock:'VOTRE PREMIER VERDICT',
      defense:'DERNIÈRE DÉFENSE',
      final_debrief:'DERNIÈRE DISCUSSION',
      locking:'VERDICT FINAL',
      reveal:'LA VÉRITÉ'
    })[ph] || ph?.toUpperCase() || 'PARTIE';
  } catch (_) {}

  try {
    const basePhaseInstruction = typeof phaseInstruction === 'function' ? phaseInstruction : null;
    if (basePhaseInstruction) phaseInstruction = function(role, ph, target) {
      const name = target?.pseudo ? h(target.pseudo) : 'la personne appelée';
      if (ph === 'role_reading') return `<p>Lis ta carte seul. Ne montre ton écran à personne.</p>`;
      if (ph === 'initial_debrief') return ['enqueteur','analyste'].includes(role)
        ? `<p>3 min · Dites ce qui vous paraît déjà suspect.</p>`
        : `<p>Prépare ta version. Tu vas bientôt devoir la défendre.</p>`;
      if (ph === 'interrogation_select') return role === 'enqueteur'
        ? `<p>Choisis la prochaine personne à interroger.</p>`
        : `<p>L’Enquêteur choisit qui va parler.</p>`;
      if (ph === 'interrogation') {
        if (target?.id === STATE?.sync?.player?.id) return `<p>8 min · C’est ton tour. Réponds et défends ta version.</p>`;
        if (role === 'enqueteur') return `<p>8 min · Interroge ${name}. Cherche les contradictions.</p>`;
        if (role === 'analyste') return `<p>Écoute. Note ce qui change, ce qui manque et ce qui ne colle pas.</p>`;
        return `<p>Interrogatoire en cours. Écoute ce qui est dit — et ce qui est évité.</p>`;
      }
      if (ph === 'cycle_debrief') return ['enqueteur','analyste'].includes(role)
        ? `<p>Réponds aux 2 questions. Elles règlent seulement la pression du prochain élément.</p>`
        : `<p>L’enquête fait le point. Prépare la suite de ta version.</p>`;
      if (ph === 'trame') {
        const e = typeof latestEvent === 'function' ? latestEvent('trame') : null;
        const card = e && typeof canInvestigationChannel === 'function' && canInvestigationChannel(role)
          ? `<div class="trame-focus"><b>${h(e.payload?.title || 'NOUVEL ÉLÉMENT')}</b><span>${h(e.payload?.text || '')}</span></div>` : '';
        return `<p>Un nouveau fait entre dans le dossier. À vous de décider ce qu’il prouve.</p>${card}`;
      }
      if (ph === 'provisional_orals') return `<p>Donnez maintenant vos premières conclusions.</p>`;
      if (ph === 'provisional_lock') return role === 'enqueteur'
        ? `<p>Attribue maintenant un niveau de responsabilité à chaque suspect.</p>`
        : `<p>L’Enquêteur fixe son premier verdict.</p>`;
      if (ph === 'defense') return `<p>C’est la dernière défense. Après ça, aucune nouvelle explication ne sera ajoutée.</p>`;
      if (ph === 'final_debrief') return ['enqueteur','analyste','procureur'].includes(role)
        ? `<p>Dernière discussion. Après ça, vous devrez trancher.</p>`
        : `<p>Il n’y aura plus aucun nouvel indice.</p>`;
      if (ph === 'locking') return `<p>Le dossier est terminé. Fais ton choix final.</p>`;
      if (ph === 'reveal') return `<p>Le verdict est verrouillé. Voici maintenant ce qu’il s’est vraiment passé.</p>`;
      return basePhaseInstruction.call(this,role,ph,target);
    };
  } catch (_) {}

  try {
    renderDebriefForm = function() {
      if (typeof myAction === 'function' && myAction('debrief')) return `<div class="locked-state">Réponse envoyée.</div>`;
      return `<div class="qcm-v11 narrative-debrief gameplay-simple-debrief">
        <div class="narrative-debrief-intro"><b>POINT D’ENQUÊTE · 2 QUESTIONS</b><span>Ces réponses changent seulement la pression du prochain élément. Elles ne choisissent jamais votre piste.</span></div>
        <div class="field"><label for="qConvergence">Vous pensez déjà tous à la même explication ?</label><select id="qConvergence"><option value="0">Non</option><option value="1">Un peu</option><option value="2">Oui</option></select></div>
        <div class="field"><label for="qConfusion">Des faits importants restent difficiles à relier ?</label><select id="qConfusion"><option value="0">Non</option><option value="1">Un peu</option><option value="2">Oui</option></select></div>
        <button class="btn primary block" onclick="submitDebrief()">Envoyer</button>
      </div>`;
    };
  } catch (_) {}

  try {
    rolePhaseNotice = function(d) {
      const ph=d?.room?.phase,role=d?.player?.public_role,st=d?.room?.state||{};
      if(!ph||!role)return null;
      const active=(title,text)=>({title,text});
      if(ph==='briefing')return active('Le dossier s’ouvre','Le briefing public commence.');
      if(ph==='role_reading'&&!d.player.ready)return active('Ta carte est prête','Lis-la seul, puis confirme quand tu as terminé.');
      if(ph==='initial_debrief')return ['enqueteur','analyste'].includes(role)?active('Premiers soupçons','Échangez ce qui vous paraît déjà suspect.'):active('Prépare ta version','L’enquête prépare le premier interrogatoire.');
      if(ph==='interrogation_select')return role==='enqueteur'?active('Choisis qui parlera','Sélectionne la prochaine personne à interroger.'):active('Quelqu’un va être appelé','L’Enquêteur choisit la prochaine personne.');
      if(ph==='interrogation'){
        const target=st.current_target;
        if(target===d.player.id)return active('C’est ton tour','Ton interrogatoire commence maintenant.');
        if(role==='enqueteur')return active('Interrogatoire','Conduis l’échange. Cherche ce qui ne colle pas.');
        if(role==='analyste')return active('Observe','Note les contradictions, les silences et les changements de version.');
        return active('Interrogatoire','Un joueur est entendu maintenant.');
      }
      if(ph==='cycle_debrief')return ['enqueteur','analyste'].includes(role)?active('Point d’enquête','Réponds aux 2 questions courtes.'):active('L’enquête fait le point','Aucune action requise pour toi.');
      if(ph?.startsWith('annex_'))return active('Entretien ciblé',`${phaseLabel(ph)} est en cours.`);
      if(ph==='trame')return typeof canInvestigationChannel==='function'&&canInvestigationChannel(role)?active('Nouveau fait','Un nouvel élément vient d’entrer dans le dossier.'):active('Nouveau fait','Le camp d’enquête vient de recevoir un nouvel élément.');
      if(ph==='provisional_orals')return active('Premières conclusions','Écoute la personne appelée.');
      if(ph==='provisional_lock')return role==='enqueteur'?active('Ton premier verdict','Attribue un niveau de responsabilité à chaque suspect.'):active('Premier verdict','L’Enquêteur fixe son premier verdict.');
      if(ph==='defense')return active('Dernière défense','Après cette phase, personne ne pourra ajouter de nouvelle explication.');
      if(ph==='final_debrief')return ['enqueteur','analyste','procureur'].includes(role)?active('Dernière discussion','Après ça, vous devrez trancher.'):active('Plus aucun indice','Le dossier ne recevra plus de nouvelle preuve.');
      if(ph==='locking')return ['enqueteur','analyste','procureur','juge','journaliste'].includes(role)?active('Verdict final','Fais maintenant ton choix final.'):active('Verdict final','Les derniers choix sont en cours.');
      if(ph==='reveal')return active('La vérité','Voici ce qu’il s’est vraiment passé.');
      return null;
    };
  } catch (_) {}

  try {
    if (typeof renderReveal === 'function') {
      const baseRenderReveal = renderReveal;
      renderReveal = function(...args) {
        let html = String(baseRenderReveal.apply(this,args) || '');
        const replacements = [
          ['La vérité ne tombe pas d’un bloc.','Voici ce qu’il s’est vraiment passé.'],
          ['Elle se reconstruit dans l’ordre des faits.','Les faits. Dans l’ordre.'],
          ['Avant la vérité, voici ce que la cellule a verrouillé.','Voici ce que vous aviez décidé.'],
          ['Ce qui s’est réellement passé','Ce qui s’est passé'],
          ['La chronologie réelle','Les faits, dans l’ordre'],
          ['CE QUI ÉTAIT CACHÉ','LE SECRET'],
          ['SA CHRONOLOGIE RÉELLE','SES ACTES'],
          ['CE QUE CELA CHANGE','CE QUE ÇA PROUVE'],
          ['CE QUE LES FAITS CHANGEAIENT DE SENS','POURQUOI LES INDICES TROMPAIENT'],
          ['Le basculement','La vraie explication'],
          ['DERNIÈRE RECONTEXTUALISATION','CE QUI CHANGE TOUT'],
          ['Révéler la vérité','Voir la vérité'],
          ['Reconstruire les faits','Voir les faits'],
          ['Ouvrir les zones cachées','Voir ce que chacun cachait'],
          ['Dernière recontextualisation','Voir la vraie explication'],
          ['Responsabilités évaluées exactement','Responsabilités trouvées exactement'],
          ['RÉALITÉ CANONIQUE','LA RÉALITÉ'],
          ['VERDICT DE L’ENQUÊTEUR','VOTRE VERDICT'],
          ['Lecture des responsabilités','Votre verdict face aux faits']
        ];
        for (const [from,to] of replacements) html = html.split(from).join(to);
        return html;
      };
    }
  } catch (e) { console.warn('cold copy reveal', e); }

  try {
    const style=document.createElement('style');
    style.dataset.igrColdCopy=REV;
    style.textContent=`.private-card-v11 .private-block h4{letter-spacing:.095em}.cinema-opening h2{max-width:24ch}.cinema-character p,.cinema-timeline-row p{line-height:1.52}`;
    document.head.appendChild(style);
  } catch (_) {}
})();
