/* Inside Grey Room — V12 profile dossier
   Replaces the generic recent-history block with a criminal-case dossier
   using only data already stored in the local player profile.
*/
(() => {
  const STYLE_ID = 'igr-profile-dossier-v12-style';
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
.profile-dossier{margin:18px 0 4px;padding:18px;border:1px solid rgba(255,255,255,.09);border-radius:18px;background:linear-gradient(180deg,rgba(255,255,255,.028),rgba(255,255,255,.012));position:relative;overflow:hidden}
.profile-dossier:before{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(110deg,transparent 0 64%,rgba(255,255,255,.018) 64% 65%,transparent 65% 100%)}
.dossier-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;padding-bottom:14px;border-bottom:1px solid rgba(255,255,255,.07)}
.dossier-kicker{font:800 9px 'IBM Plex Mono',monospace;letter-spacing:.18em;text-transform:uppercase;color:#858f99}
.dossier-head h2{margin:5px 0 0;font-size:23px;letter-spacing:-.035em}
.dossier-stamp{flex:0 0 auto;padding:7px 9px;border:1px solid rgba(198,207,215,.28);border-radius:7px;font:800 8px 'IBM Plex Mono',monospace;letter-spacing:.16em;text-transform:uppercase;color:#c6cfd7;transform:rotate(-2deg);background:rgba(255,255,255,.018)}
.dossier-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:14px}
.dossier-stat{min-width:0;padding:13px 10px;border:1px solid rgba(255,255,255,.065);border-radius:13px;background:rgba(0,0,0,.16)}
.dossier-stat b{display:block;font:800 22px 'IBM Plex Mono',monospace;letter-spacing:-.04em;color:#eef1f3}
.dossier-stat span{display:block;margin-top:5px;font:700 8px 'IBM Plex Mono',monospace;line-height:1.4;letter-spacing:.11em;text-transform:uppercase;color:#737e88}
.dossier-intel{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}
.dossier-intel-item{padding:11px 12px;border-left:2px solid #4d5660;background:rgba(255,255,255,.018)}
.dossier-intel-item small{display:block;font:700 8px 'IBM Plex Mono',monospace;letter-spacing:.12em;text-transform:uppercase;color:#6f7a84}
.dossier-intel-item strong{display:block;margin-top:5px;font-size:12px;color:#d5dbe0;font-weight:750}
.dossier-cases{margin-top:18px}
.dossier-case-list{display:grid;gap:8px}
.dossier-case{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:12px 13px;border:1px solid rgba(255,255,255,.065);border-radius:13px;background:rgba(255,255,255,.016)}
.dossier-case-main{min-width:0}
.dossier-case-id{font:800 8px 'IBM Plex Mono',monospace;letter-spacing:.13em;text-transform:uppercase;color:#727d87}
.dossier-case-title{margin-top:4px;font-size:12px;color:#d6dce1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dossier-case-meta{margin-top:5px;font:650 8px 'IBM Plex Mono',monospace;letter-spacing:.07em;text-transform:uppercase;color:#69737d}
.dossier-case-side{text-align:right;display:grid;justify-items:end;gap:5px}
.dossier-status{display:inline-flex;align-items:center;padding:5px 7px;border-radius:6px;border:1px solid rgba(255,255,255,.1);font:800 8px 'IBM Plex Mono',monospace;letter-spacing:.1em;text-transform:uppercase}
.dossier-status.closed{color:#dde4e7;background:rgba(194,207,211,.07);border-color:rgba(194,207,211,.18)}
.dossier-status.open{color:#a8b0b7;background:rgba(255,255,255,.018)}
.dossier-date{font:600 8px 'IBM Plex Mono',monospace;color:#656f79;white-space:nowrap}
.dossier-empty{padding:15px;border:1px dashed rgba(255,255,255,.09);border-radius:12px;color:#727d87;font-size:11px;text-align:center}
@media(max-width:640px){.dossier-stats{grid-template-columns:1fr 1fr}.dossier-intel{grid-template-columns:1fr}.dossier-case{grid-template-columns:minmax(0,1fr) auto}.dossier-stamp{font-size:7px;padding:6px 7px}}
`;
    document.head.appendChild(style);
  }

  const roleLabel = role => role ? publicRoleLabel(role) : 'Non renseigné';

  function profileMetrics(p) {
    const history = Array.isArray(p.history) ? p.history : [];
    const completed = Math.max(Number(p.completed) || 0, history.length);
    const wins = Math.min(completed, Number(p.wins) || history.filter(x => x.won).length);
    const losses = Math.max(0, completed - wins);
    const rate = completed ? Math.round((wins / completed) * 100) : 0;

    const roles = new Map();
    history.forEach(x => {
      const role = x.role || x.publicRole || '';
      if (!role) return;
      roles.set(role, (roles.get(role) || 0) + 1);
    });
    const dominantRole = [...roles.entries()].sort((a,b) => b[1] - a[1])[0]?.[0] || '';

    let streak = 0;
    let streakWon = null;
    for (const item of history) {
      const won = !!item.won;
      if (streakWon === null) streakWon = won;
      if (won !== streakWon) break;
      streak += 1;
    }

    return {history, completed, wins, losses, rate, dominantRole, streak, streakWon};
  }

  function renderDossier(p) {
    const m = profileMetrics(p);
    const streakText = m.streak
      ? `${m.streak} ${m.streakWon ? 'affaire' + (m.streak > 1 ? 's' : '') + ' classée' + (m.streak > 1 ? 's' : '') : 'affaire' + (m.streak > 1 ? 's' : '') + ' non résolue' + (m.streak > 1 ? 's' : '')}`
      : 'Aucune série';
    const recent = m.history.slice(0, 5);

    return `<div class="profile-dossier">
      <div class="dossier-head">
        <div><div class="dossier-kicker">Archive personnelle</div><h2>Dossier du joueur</h2></div>
        <div class="dossier-stamp">Confidentiel</div>
      </div>
      <div class="dossier-stats">
        <div class="dossier-stat"><b>${m.completed}</b><span>Affaires traitées</span></div>
        <div class="dossier-stat"><b>${m.wins}</b><span>Affaires classées</span></div>
        <div class="dossier-stat"><b>${m.losses}</b><span>Non résolues</span></div>
        <div class="dossier-stat"><b>${m.rate}%</b><span>Taux de résolution</span></div>
      </div>
      <div class="dossier-intel">
        <div class="dossier-intel-item"><small>Rôle dominant</small><strong>${h(roleLabel(m.dominantRole))}</strong></div>
        <div class="dossier-intel-item"><small>Série actuelle</small><strong>${h(streakText)}</strong></div>
      </div>
      <div class="dossier-cases">
        <div class="section-title"><h2>Dernières affaires</h2><span>${recent.length ? `${recent.length} dossier${recent.length > 1 ? 's' : ''}` : 'aucune archive'}</span></div>
        <div class="dossier-case-list">
          ${recent.length ? recent.map((x, i) => `<div class="dossier-case">
            <div class="dossier-case-main">
              <div class="dossier-case-id">CASE #${String(m.history.length - i).padStart(3,'0')} · DOSSIER ${h(x.scenario || '—')}</div>
              <div class="dossier-case-title">${h(x.title || 'Affaire sans titre')}</div>
              <div class="dossier-case-meta">Rôle · ${h(roleLabel(x.role || x.publicRole || ''))}</div>
            </div>
            <div class="dossier-case-side">
              <span class="dossier-status ${x.won ? 'closed' : 'open'}">${x.won ? 'Classé' : 'Non résolu'}</span>
              <span class="dossier-date">${h(x.date || '')}</span>
            </div>
          </div>`).join('') : `<div class="dossier-empty">Aucune affaire archivée pour le moment.</div>`}
        </div>
      </div>
    </div>`;
  }

  renderProfile = function() {
    const p = loadProfile();
    p.avatar = safeAvatar(p.avatar);
    const titles = unlockedTitles(p), badges = unlockedBadges(p), equippedTitle = profileTitle(p.equippedTitle,p), equippedBadge = profileBadge(p.equippedBadge,p);
    const titleCards = titles.length ? titles.map(x => {
      const active = equippedTitle.id === x.id;
      return `<button class="reward-card ${active?'active':''}" onclick="equipProfileTitle('${x.id}')"><span class="reward-state">${active?'ÉQUIPÉ':'DÉBLOQUÉ'}</span><b>${h(x.label)}</b><small>${h(x.desc)}</small></button>`;
    }).join('') : `<div class="empty-rewards">Aucun titre débloqué pour le moment.</div>`;
    const badgeCards = badges.length ? badges.map(x => {
      const active = equippedBadge.id === x.id;
      return `<button class="badge-card ${active?'active':''}" onclick="equipProfileBadge('${x.id}')"><span class="badge-glyph">${h(x.glyph)}</span><span><b>${h(x.label)}</b><small>${h(x.desc)}</small></span></button>`;
    }).join('') : `<div class="empty-rewards">Aucun badge débloqué pour le moment.</div>`;

    byId('app').innerHTML = shell(`<main class="page profile-page"><div class="page-head"><div><div class="kicker">Profil joueur</div><h1>Ton identité</h1></div><button class="btn ghost small" onclick="goHome()">← Accueil</button></div><section class="panel profile-panel"><div class="profile-avatar-wrap"><div id="profilePreview">${p.avatar?`<span class="avatar avatar-profile"><img src="${p.avatar}" alt="Photo de profil"></span>`:`<span class="avatar avatar-fallback avatar-profile">${h(initials(p.pseudo||'?'))}</span>`}</div><div><h2>${h(p.pseudo||'Nouveau joueur')}</h2><div class="profile-equipped-line">${equippedBadge.id!=='none'?`<span class="equipped-badge">${h(equippedBadge.glyph)}</span>`:''}<span>${equippedTitle.id!=='none'?h(equippedTitle.label):'Aucun titre équipé'}</span></div><p>Ton profil conserve tes trophées et ton dossier de terrain. Les informations restent hors de l’interface de partie.</p></div></div><div class="field"><label for="profilePseudo">Pseudo</label><input id="profilePseudo" maxlength="22" autocomplete="nickname" autocorrect="off" spellcheck="false" value="${h(p.pseudo)}" placeholder="Votre pseudo"></div><div class="profile-photo-actions"><label class="btn" for="profilePhoto">Choisir une photo</label><input id="profilePhoto" type="file" accept="image/*" hidden onchange="profilePhotoChanged(this.files?.[0])"><button class="btn ghost" onclick="removeProfilePhoto()">Supprimer la photo</button></div>${renderDossier(p)}<div class="reward-section"><div class="section-title"><h2>Titres débloqués</h2><span>${titles.length} disponibles</span></div><div class="reward-grid">${titleCards}</div></div><div class="reward-section"><div class="section-title"><h2>Badges débloqués</h2><span>${badges.length} disponibles</span></div><div class="badge-grid">${badgeCards}</div></div><button class="btn primary block" onclick="saveProfileForm()">Enregistrer le profil</button><div class="profile-privacy-actions"><button class="btn ghost block" onclick="openPrivacy()">Confidentialité et données</button><button class="btn ghost block" onclick="openSupport()">Support</button>${STATE.room&&STATE.token?`<button class="btn ghost block" onclick="openSafety()">Signaler ou bloquer un joueur</button>`:''}</div></section></main>`);
  };
})();
