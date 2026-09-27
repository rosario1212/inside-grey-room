/* Inside Grey Room V12.1 — menu audio stability patch
   Goal: keep the original menu composition and loudness/mix,
   while slowing the menu tempo and preventing tails from one loop
   from piling onto the next loop. Scenario-specific scores remain unchanged.
*/
(() => {
  const baseInitAudio = initAudio;
  const basePlaySlasherPhrase = playSlasherPhrase;

  // The menu composition was running at 132 BPM, which feels too hurried on mobile.
  // Slow only the menu; scenario scores keep their own original tempos.
  if (PROFILES?.menu) PROFILES.menu.bpm = 104;

  function installPeakLimiter() {
    if (!SOUND.ctx || !SOUND.masterGain || SOUND.outputLimiter) return;
    try {
      SOUND.masterGain.disconnect();
      const limiter = SOUND.ctx.createDynamicsCompressor();
      // Only catch very high peaks. Do not squash the original soundtrack.
      limiter.threshold.value = -1;
      limiter.knee.value = 0;
      limiter.ratio.value = 20;
      limiter.attack.value = 0.003;
      limiter.release.value = 0.10;
      SOUND.masterGain.connect(limiter);
      limiter.connect(SOUND.ctx.destination);
      SOUND.outputLimiter = limiter;
    } catch (_) {}
  }

  initAudio = function (...args) {
    const result = baseInitAudio.apply(this, args);
    installPeakLimiter();
    return result;
  };

  // Keep the original updateGains() untouched so the soundtrack has the same
  // presence and balance as before the stability patch.

  playSlasherPhrase = function (preset, step = 0, anchorTime = null) {
    if (preset !== 'menu') return basePlaySlasherPhrase(preset, step, anchorTime);
    if (!SOUND.enabled || !SOUND.ctx) return;

    // Use the original menu composition, notes and instrumentation.
    // Only its tempo is intentionally slower via PROFILES.menu.bpm above.
    const before = new Set(SOUND.sources);
    const result = basePlaySlasherPhrase(preset, step, anchorTime);

    // Trim only tails that would survive beyond the current menu loop.
    try {
      const p = PROFILES.menu;
      const loopDuration = p.pattern.length * ((60 / p.bpm) / 2);
      const anchor = anchorTime ?? (SOUND.ctx.currentTime + 0.012);
      const delayMs = Math.max(0, (anchor + loopDuration + 0.045 - SOUND.ctx.currentTime) * 1000);
      const phraseSources = SOUND.sources.filter(src => !before.has(src));
      const timer = setTimeout(() => {
        phraseSources.forEach(src => {
          if (!SOUND.sources.includes(src)) return;
          try { src.stop?.(); } catch (_) {}
        });
      }, delayMs);
      SOUND.timers.push(timer);
    } catch (_) {}

    return result;
  };

  installPeakLimiter();
})();
