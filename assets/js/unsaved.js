/* ============================================================
   UNSAVED — "you have unsaved work" before the tab closes.

   Three of the four builders keep everything in memory, so a stray
   Cmd-R or a closed tab throws away an afternoon. Until the property
   library lands, this at least makes the browser ask first.

   It watches for typing and for changed controls anywhere on the page,
   and tools call GVC_UNSAVED.touch() for the changes that never fire an
   input event — a dropped photo, a dragged crop, a shuffled gallery.
   GVC_UNSAVED.clear() is for after a save, once there is such a thing.

   The browser shows its own wording; the message here is ignored by
   every current browser but is still required for the prompt to appear.
   ============================================================ */
(function (global) {
  'use strict';

  var dirty = false;

  function touch() { dirty = true; }
  function clear() { dirty = false; }
  function isDirty() { return dirty; }

  function watch(opts) {
    // typing in the editor, and any select / checkbox / file input
    document.addEventListener('input', touch, true);
    document.addEventListener('change', touch, true);

    // the Showsheet autosaves, so a leave-the-page prompt there would be
    // nagging about work that is not actually at risk
    if (opts && opts.warnOnClose === false) return;

    global.addEventListener('beforeunload', function (e) {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = '';       // required for the prompt in Chrome and Safari
      return '';
    });
  }

  global.GVC_UNSAVED = { watch: watch, touch: touch, clear: clear, isDirty: isDirty };
})(window);
