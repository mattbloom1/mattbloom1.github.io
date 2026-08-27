/* ============================================================
   UNSAVED — "you have unsaved work" before the tab closes.

   All four builders keep everything in memory — saving means saving to
   the property library. So a stray Cmd-R or a closed tab still throws away
   an afternoon, and this makes the browser ask first.

   It watches for typing and for changed controls anywhere on the page,
   and tools call GVC_UNSAVED.touch() for the changes that never fire an
   input event — a dropped photo, a dragged crop, a shuffled gallery.
   property-bar.js calls GVC_UNSAVED.clear() after a save and after a load.

   The browser shows its own wording; the message here is ignored by
   every current browser but is still required for the prompt to appear.
   ============================================================ */
(function (global) {
  'use strict';

  var dirty = false;

  function touch() { dirty = true; }
  function clear() { dirty = false; }
  function isDirty() { return dirty; }

  function watch() {
    // typing in the editor, and any select / checkbox / file input
    document.addEventListener('input', touch, true);
    document.addEventListener('change', touch, true);

    global.addEventListener('beforeunload', function (e) {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = '';       // required for the prompt in Chrome and Safari
      return '';
    });
  }

  global.GVC_UNSAVED = { watch: watch, touch: touch, clear: clear, isDirty: isDirty };
})(window);
