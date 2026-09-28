/* Inside Grey Room v12.14 Apple/PWA stability guard.
   Prevents a self-triggering MutationObserver render loop from freezing WebKit
   while the lobby role UI is being decorated. The native constructor is restored
   immediately after the synchronous runtime scripts finish loading. */
(() => {
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
