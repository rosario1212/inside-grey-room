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
