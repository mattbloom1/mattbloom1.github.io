/* ============================================================
   QR — one vector QR code, shared by every builder.

   Was four near-identical copies, one per tool. SVG rather than canvas so
   the code stays crisp at any print size, and '' rather than a broken
   image when there is nothing to encode or the CDN script did not load —
   callers print their own placeholder in that case.

   Needs qrcode-generator on the page (the tools load it from the CDN).
   ============================================================ */
(function (global) {
  'use strict';

  function qrSvg(text) {
    try {
      if (!text || typeof global.qrcode === 'undefined') return '';
      var qr = global.qrcode(0, 'M');
      qr.addData(String(text));
      qr.make();
      var n = qr.getModuleCount(), d = '';
      for (var r = 0; r < n; r++) {
        for (var c = 0; c < n; c++) {
          if (qr.isDark(r, c)) d += 'M' + c + ' ' + r + 'h1v1h-1z';
        }
      }
      return '<svg viewBox="0 0 ' + n + ' ' + n + '" shape-rendering="crispEdges" ' +
             'xmlns="http://www.w3.org/2000/svg"><path d="' + d + '" fill="#00273A"/></svg>';
    } catch (e) { return ''; }
  }

  /* A bare domain still has to scan as a link. */
  function withScheme(url) {
    var u = String(url || '').trim();
    if (!u) return '';
    return /^[a-z][a-z0-9+.-]*:\/\//i.test(u) ? u : 'https://' + u;
  }

  global.GVC_QR = qrSvg;
  global.GVC_QR_URL = function (url) { return qrSvg(withScheme(url)); };
})(window);
