/* Inside Grey Room V12.1 — native audio entrance guard */
(() => {
  const entryComplete = () => !!INTRO.done && !INTRO.active && !INTRO.playing;
  if (!entryComplete() && SOUND.started) stopAmbient();

  const baseStartAmbient = startAmbient;
  startAmbient = function(preset = 'menu') {
    if (!entryComplete()) return;
    return baseStartAmbient(preset);
  };

  const baseEnsureAmbient = ensureAmbient;
  ensureAmbient = function(preset = 'menu') {
    if (!entryComplete()) return;
    return baseEnsureAmbient(preset);
  };

  const baseEnsureLiveAudio = ensureLiveAudio;
  ensureLiveAudio = function() {
    if (!entryComplete()) return;
    return baseEnsureLiveAudio();
  };

  const baseWakeAudioFromGesture = wakeAudioFromGesture;
  wakeAudioFromGesture = async function() {
    if (entryComplete()) return baseWakeAudioFromGesture();
    if (!SOUND.enabled) return true;
    let ctx;
    const resumeOnly = async () => {
      initAudio();
      ctx = SOUND.ctx;
      if (!ctx) return false;
      if (ctx.state !== 'running') await ctx.resume();
      if (ctx.state !== 'running') return false;
      primeAudioOutput();
      updateGains();
      return true;
    };
    try {
      return await resumeOnly();
    } catch (err) {
      console.warn('Audio entrance wake retry', err);
      disposeAudioEngine();
      try { return await resumeOnly(); }
      catch (err2) { console.warn('Audio entrance wake failed', err2); return false; }
    }
  };

  startIntroSequence = function(audioWake) {
    if (INTRO.playing || INTRO.done) return;
    const gate = byId('introGate'), btn = byId('introEnterBtn');
    if (!gate) return;
    INTRO.playing = true;
    if (btn) { btn.disabled = true; btn.setAttribute('aria-busy', 'true'); }
    setIntroHint('ENTRÉE…');
    gate.classList.remove('audio-error', 'boot-waiting');
    requestAnimationFrame(() => gate.classList.add('opening'));

    const wake = audioWake && typeof audioWake.then === 'function'
      ? audioWake
      : wakeAudioFromGesture();
    void Promise.resolve(wake).then(awake => {
      if (awake && INTRO.playing) playDoorOpenFx();
    }).catch(() => {});

    const finishDoorEntry = () => {
      if (!INTRO.playing) return;
      if (!BOOT.ready) {
        INTRO.playing = false;
        INTRO.waitingForBoot = true;
        gate.classList.remove('opening');
        gate.classList.add('boot-waiting');
        gate.setAttribute('aria-busy', 'true');
        return;
      }
      completeIntroEntry();
    };
    setTimeout(finishDoorEntry, 650);
  };
})();
