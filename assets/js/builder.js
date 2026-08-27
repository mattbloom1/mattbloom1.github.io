/* ============================================================
   GVC PACKAGE BUILDERS — shared shell behaviour
   Paired with assets/css/builder.css.

   Owns the parts every builder shares: rendering N blank 8.5x11
   pages into #pages, fit-to-width vs 100% zoom, and print. Page
   *content* is each builder's own job — pass a `render(page, i)`
   callback to Builder.init() when there's a layout to draw.
   ============================================================ */
(function (global) {
  'use strict';

  const PAGE_W = 8.5, PAGE_H = 11;   // inches — US Letter portrait

  function px(inches) {
    // browser CSS inch is a fixed 96px, but measure rather than assume
    const probe = document.createElement('div');
    probe.style.cssText = 'position:absolute;visibility:hidden;width:1in';
    document.body.appendChild(probe);
    const perInch = probe.getBoundingClientRect().width || 96;
    probe.remove();
    return inches * perInch;
  }

  function init(opts) {
    opts = opts || {};
    const stage = document.getElementById('stage');
    const host = document.getElementById('pages');
    const btnZoom = document.getElementById('btnZoom');
    const btnPrint = document.getElementById('btnPrint');
    const zoomInfo = document.getElementById('zoomInfo');
    const pageInput = document.getElementById('pageCount');
    if (!host) return null;

    const state = {
      pages: opts.pages || 1,
      zoom: 'fit',            // 'fit' | 'full'
      render: opts.render || null,
      label: opts.label || 'Page'
    };

    function build() {
      host.innerHTML = '';
      for (let i = 0; i < state.pages; i++) {
        const col = document.createElement('div');
        col.className = 'pg-col';

        const tag = document.createElement('div');
        tag.className = 'pg-tag';
        tag.textContent = state.label + ' ' + (i + 1) + ' · 8.5 × 11 in';

        const wrap = document.createElement('div');
        wrap.className = 'page-wrap';

        const page = document.createElement('section');
        page.className = 'page';
        page.dataset.index = String(i);
        if (state.render) state.render(page, i);

        wrap.appendChild(page);
        col.appendChild(tag);
        col.appendChild(wrap);
        host.appendChild(col);
      }
      fit();
    }

    function fit() {
      const wIn = px(PAGE_W), hIn = px(PAGE_H);
      let scale = 1;
      if (state.zoom === 'fit' && stage) {
        // room for one page plus the #pages padding and a scrollbar
        const avail = stage.clientWidth - 26 * 2 - 14;
        scale = Math.min(1, avail / wIn);
        if (!isFinite(scale) || scale <= 0) scale = 1;
      }
      host.querySelectorAll('.page').forEach(p => {
        p.style.transform = scale === 1 ? 'none' : 'scale(' + scale + ')';
      });
      host.querySelectorAll('.page-wrap').forEach(w => {
        w.style.width = (wIn * scale) + 'px';
        w.style.height = (hIn * scale) + 'px';
      });
      if (zoomInfo) zoomInfo.textContent = Math.round(scale * 100) + '%';
      if (btnZoom) btnZoom.textContent = state.zoom === 'fit' ? 'Zoom 100%' : 'Fit to width';
    }

    if (btnZoom) btnZoom.addEventListener('click', () => {
      state.zoom = state.zoom === 'fit' ? 'full' : 'fit';
      fit();
    });
    /* The browser's Print → "Save as PDF" offers the page title as the file
       name, so a builder that passes printName() gets its PDF named after the
       property rather than after the tool. The title goes back afterwards, so
       the tab reads normally the rest of the time. Same trick the Showsheet
       has always used. */
    if (btnPrint) btnPrint.addEventListener('click', () => {
      const appTitle = document.title;
      let name = '';
      try { name = opts.printName ? String(opts.printName() || '').trim() : ''; } catch (e) {}
      if (name) {
        document.title = name;
        const restore = () => {
          document.title = appTitle;
          window.removeEventListener('afterprint', restore);
        };
        window.addEventListener('afterprint', restore);
      }
      window.print();
    });
    if (pageInput) pageInput.addEventListener('change', () => {
      const n = Math.max(1, Math.min(40, parseInt(pageInput.value, 10) || 1));
      pageInput.value = String(n);
      state.pages = n;
      build();
    });

    let t;
    window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(fit, 120); });

    build();

    return {
      state,
      rebuild: build,
      fit,
      setPages(n) { state.pages = Math.max(1, n); if (pageInput) pageInput.value = String(state.pages); build(); }
    };
  }

  global.Builder = { init, PAGE_W, PAGE_H };
})(window);
