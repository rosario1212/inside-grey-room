/* Inside Grey Room v12.16 Apple/PWA stability guard.
   Keeps the app shell fixed against iOS multi-touch pinch/pan gestures while
   preserving normal one-finger scrolling and controls. Also prevents a
   self-triggering MutationObserver render loop from freezing WebKit while the
   lobby role UI is being decorated. */
(() => {
  if (!window.__igrPinchLock) {
    window.__igrPinchLock = true;

    const blockMultiTouch = (event) => {
      if (event.touches && event.touches.length > 1) event.preventDefault();
    };
    const blockGesture = (event) => event.preventDefault();

    document.addEventListener('touchstart', blockMultiTouch, { passive: false });
    document.addEventListener('touchmove', blockMultiTouch, { passive: false });
    document.addEventListener('gesturestart', blockGesture, { passive: false });
    document.addEventListener('gesturechange', blockGesture, { passive: false });
    document.addEventListener('gestureend', blockGesture, { passive: false });
  }

  const NativeMutationObserver = window.MutationObserver;
  if (!NativeMutationObserver || window.__igrAppleUiGuard) return;
  window.__igrAppleUiGuard = true;

  window.MutationObserver = class IGRGuardedMutationObserver extends NativeMutationObserver {
    constructor(callback) {
      let delivering = false;
      super((records, observer) => {
        if (delivering) return;
        delivering = true;
        try {
          callback(records, observer);
        } finally {
          setTimeout(() => { delivering = false; }, 0);
        }
      });
    }
  };

  setTimeout(() => {
    window.MutationObserver = NativeMutationObserver;
    window.__igrAppleUiGuard = false;
  }, 0);
})();

/* v30 — rear-camera capture hardening.
   Prefer the rear camera strictly, then relax to a preference, and only use
   the browser default camera when the device/browser cannot satisfy either
   rear-camera constraint. Permission and hardware-busy errors are never
   swallowed or retried as another camera choice. */
(() => {
  if (typeof ensureLocalVideo !== 'function' || typeof VIDEO === 'undefined') return;

  const CAMERA_CAPTURE_BUILD = 'v30-rear-camera-exact-fallback-20261002-1';
  const liveVideoStream = stream =>
    !!stream && stream.getVideoTracks?.().some(track => track.readyState === 'live');
  const liveAudioTrack = stream =>
    !!stream && stream.getAudioTracks?.().some(track => track.readyState === 'live');

  const baseVideoConstraints = {
    width: {ideal:540, max:720},
    height: {ideal:960, max:1280},
    frameRate: {ideal:24, max:30}
  };
  const audioConstraints = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    channelCount: 1
  };
  const fallbackErrors = new Set([
    'OverconstrainedError',
    'ConstraintNotSatisfiedError',
    'NotFoundError',
    'TypeError'
  ]);

  async function requestRearCamera() {
    const attempts = [
      {
        mode: 'environment-exact',
        constraints: {
          video: {...baseVideoConstraints, facingMode: {exact:'environment'}},
          audio: audioConstraints
        }
      },
      {
        mode: 'environment-ideal',
        constraints: {
          video: {...baseVideoConstraints, facingMode: {ideal:'environment'}},
          audio: audioConstraints
        }
      },
      {
        mode: 'default',
        constraints: {
          video: {...baseVideoConstraints},
          audio: audioConstraints
        }
      }
    ];

    let lastError = null;
    for (let index = 0; index < attempts.length; index += 1) {
      const attempt = attempts[index];
      try {
        const stream = await navigator.mediaDevices.getUserMedia(attempt.constraints);
        const videoTrack = stream.getVideoTracks?.()[0];
        if (!videoTrack) {
          try { stream.getTracks?.().forEach(track => track.stop()); } catch (_) {}
          throw new DOMException('No video track returned', 'NotFoundError');
        }
        const actualFacingMode = videoTrack.getSettings?.().facingMode || null;
        VIDEO.cameraCapture = {
          build: CAMERA_CAPTURE_BUILD,
          requested: attempt.mode,
          actualFacingMode
        };
        return stream;
      } catch (error) {
        lastError = error;
        const mayFallback = index < attempts.length - 1 && fallbackErrors.has(error?.name);
        if (!mayFallback) throw error;
      }
    }
    throw lastError || new Error('Camera unavailable');
  }

  ensureLocalVideo = async function() {
    if (liveVideoStream(VIDEO.localStream) && liveAudioTrack(VIDEO.localStream)) {
      return VIDEO.localStream;
    }
    if (VIDEO.capturePromise) return VIDEO.capturePromise;
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera unavailable');

    VIDEO.capturePromise = (async () => {
      if (VIDEO.localStream) {
        try { VIDEO.localStream.getTracks().forEach(track => track.stop()); } catch (_) {}
        VIDEO.localStream = null;
      }

      const stream = await requestRearCamera();
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];
      try { if (videoTrack && 'contentHint' in videoTrack) videoTrack.contentHint = 'motion'; } catch (_) {}
      try { if (audioTrack && 'contentHint' in audioTrack) audioTrack.contentHint = 'speech'; } catch (_) {}

      if (videoTrack) {
        videoTrack.onended = () => {
          if (STATE.sync?.player?.public_role !== 'enqueteur') return;
          if (!videoState()?.video_active) return;
          setTimeout(() => {
            if (!liveVideoStream(VIDEO.localStream) && videoState()?.video_active) {
              rpc('igr_v4_video_set', {
                p_code: STATE.room,
                p_player_token: STATE.token,
                p_active: false,
                p_confidential_cut: false
              }).then(() => syncNow(true)).catch(() => {});
            }
          }, 500);
        };
      }

      VIDEO.localStream = stream;
      const localVideo = document.getElementById('localVideo');
      if (localVideo) {
        localVideo.muted = true;
        localVideo.playsInline = true;
        localVideo.autoplay = true;
        if (localVideo.srcObject !== stream) localVideo.srcObject = stream;
        if (localVideo.paused) {
          try { await localVideo.play(); } catch (_) {}
        }
      }
      return stream;
    })();

    try {
      return await VIDEO.capturePromise;
    } finally {
      VIDEO.capturePromise = null;
    }
  };
})();
