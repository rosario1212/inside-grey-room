/* Inside Grey Room v12.18 — constrain only the v12.14 foreground heartbeat.
   gameplay-clean-v12 asks for 300 ms; five clients can exceed the room-wide
   Supabase rate budget. This shim turns that one heartbeat into 900 ms and is
   restored immediately after gameplay-clean loads. */
(() => {
  if (window.__igrNativeSetInterval) return;
  const nativeSetInterval = window.setInterval;
  window.__igrNativeSetInterval = nativeSetInterval;
  window.setInterval = function(fn, delay, ...args) {
    const safeDelay = Number(delay) === 300 ? 900 : delay;
    return nativeSetInterval.call(window, fn, safeDelay, ...args);
  };
})();
