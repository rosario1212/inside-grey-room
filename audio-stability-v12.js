/* Inside Grey Room V12.1 — stable menu audio patch
   Keeps the menu score musically stable over long sessions:
   - no accumulating long tails between loops
   - no step-dependent drums/bells/static on the menu
   - controlled loudness without flattening the mix
   Scenario-specific scores remain unchanged for now.
*/
(() => {
  const baseInitAudio = initAudio;
  const baseUpdateGains = updateGains;
  const basePlaySlasherPhrase = playSlasherPhrase;

  function installOutputLimiter() {
    if (!SOUND.ctx || !SOUND.masterGain || SOUND.outputLimiter) return;
    try {
      SOUND.masterGain.disconnect();
      const limiter = SOUND.ctx.createDynamicsCompressor();
      limiter.threshold.value = -10;
      limiter.knee.value = 12;
      limiter.ratio.value = 2.5;
      limiter.attack.value = 0.01;
      limiter.release.value = 0.18;
      SOUND.masterGain.connect(limiter);
      limiter.connect(SOUND.ctx.destination);
      SOUND.outputLimiter = limiter;
    } catch (_) {}
  }

  initAudio = function (...args) {
    const result = baseInitAudio.apply(this, args);
    installOutputLimiter();
    return result;
  };

  updateGains = function (...args) {
    baseUpdateGains.apply(this, args);
    if (!SOUND.masterGain) return;
    SOUND.masterGain.gain.value = SOUND.enabled ? Math.min(1.16, SOUND.master * 1.10) : 0;
    if (SOUND.melodyGain) SOUND.melodyGain.gain.value = Math.min(1.15, SOUND.ambience * 1.05);
    if (SOUND.ambGain) SOUND.ambGain.gain.value = Math.min(0.70, SOUND.ambience * 0.62);
    if (SOUND.fxGain) SOUND.fxGain.gain.value = Math.min(0.78, SOUND.effects * 0.60);
  };

  playSlasherPhrase = function (preset, step = 0, anchorTime = null) {
    if (preset !== 'menu') return basePlaySlasherPhrase(preset, step, anchorTime);
    if (!SOUND.enabled || !SOUND.ctx) return;

    SOUND.lastPhraseAt = performance.now();
    const p = PROFILES.menu;
    const previousAnchor = SOUND.scheduleAnchor;
    SOUND.scheduleAnchor = anchorTime ?? (SOUND.ctx.currentTime + 0.012);

    const eighth = (60 / p.bpm) / 2;
    const loopDuration = p.pattern.length * eighth;

    // Fixed, sparse minor figure. Identical on every loop: no progressive layering.
    const notes = [0, 3, 7, 3, 0, 5, 7, 3];
    notes.forEach((semi, i) => {
      const grid = i * 2;
      const freq = noteFreq(p.root, semi, 2.02);
      const pan = i % 2 === 0 ? -0.035 : 0.035;
      withAudioTarget(SOUND.melodyGain || SOUND.ambGain, () => {
        playPiano(freq, i % 4 === 0 ? 0.092 : 0.074, grid * eighth, pan, Math.min(0.25, eighth * 0.95));
      });
    });

    // Two short low anchors. Their tails end well before the next loop begins.
    playPiano(noteFreq(p.root, 0, 0.92), 0.032, 0.01, -0.04, 0.46);
    playPiano(noteFreq(p.root, 7, 0.92), 0.028, 8 * eighth + 0.01, 0.04, 0.46);

    // Very short chord beds, deliberately shorter than half a loop to prevent overlap buildup.
    [[0, 3, 7], [7, 10, 14]].forEach((chord, ci) => {
      const when = ci * 8 * eighth + 0.035;
      chord.forEach((semi, vi) => {
        playString(noteFreq(p.root, semi, 0.78), 0.017, when + vi * 0.012, (vi - 1) * 0.10, 1.05);
      });
    });

    SOUND.scheduleAnchor = previousAnchor;
    return loopDuration;
  };

  installOutputLimiter();
  updateGains();
})();
