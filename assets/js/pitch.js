/* ============================================================
   GVC PITCH DECKS — shared behaviour
   Paired with assets/css/pitch.css. Used by the Seller Pitch & CMA
   and the Buyer Package.

   Everything here is deck-agnostic: page furniture, the cover, agent
   cards, the roster picker, image drops, money formatting and the
   overflow warnings. Each deck supplies its own page list and its own
   editor fields.
   ============================================================ */
(function (global) {
  'use strict';

  const MONO = '../../assets/logos/monogram-white.svg';
  const MONO_NAVY = '../../assets/logos/monogram.svg';

  /* ---------- text ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => (
      {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]
    ));
  }
  function lines(s) { return esc(s).replace(/\n/g, '<br>'); }

  /* ---------- money ---------- */
  function money(v) {
    const n = Number(String(v).replace(/[^0-9.\-]/g, ''));
    if (!isFinite(n) || !n) return '';
    return '$' + Math.round(n).toLocaleString('en-US');
  }
  function moneyShort(v) {
    const n = Number(String(v).replace(/[^0-9.\-]/g, ''));
    if (!isFinite(n) || !n) return '';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(n >= 1e7 ? 0 : 2).replace(/\.00$/, '') + 'M';
    if (n >= 1e3) return '$' + Math.round(n / 1e3) + 'K';
    return '$' + Math.round(n);
  }
  function num(v) {
    const n = Number(String(v).replace(/[^0-9.\-]/g, ''));
    return isFinite(n) ? n : 0;
  }

  /* ---------- page furniture ---------- */
  function heading(title) {
    return '<div class="pg-h"><h2>' + esc(title) + '</h2></div>';
  }
  /* Footer: site left, monogram dead-center, page number bottom right.
     The monogram is centered against the full footer width regardless of
     how long the site text or page number run, so it stays put page to page. */
  function foot(site, reversed, n, of) {
    return '<div class="pg-foot"><span class="site">' + esc(site || '') + '</span>' +
           '<img class="pg-mono" src="' + (reversed ? MONO : MONO_NAVY) + '" alt="">' +
           '<span class="pg-n">' + n + ' / ' + of + '</span></div>';
  }

  /* Standard interior page: title, body, footer.
     `key` lands on the wrapper so overflow rules can name a page and give
     a specific warning rather than a generic "something is too tall". */
  function page(o) {
    return '<div class="pg' + (o.reversed ? ' rev' : '') + '"' +
             (o.key ? ' data-key="' + esc(o.key) + '"' : '') + '>' +
      heading(o.title) +
      '<div class="pg-body">' + o.body + '</div>' +
      foot(o.site, o.reversed, o.n, o.of) +
    '</div>';
  }

  /* One or two agents, one on each side of the bar, monogram fixed dead-
     center regardless of which (or how many) sides have content — it is
     positioned against the bar itself, not flexed between the agent blocks. */
  function agentBlock(a, align) {
    if (!a) return '<div class="cb-side ' + align + '"></div>';
    return '<div class="cb-side ' + align + '">' +
      '<div class="cb-nm">' + esc(a.name) + '</div>' +
      '<div class="cb-ct">' + [a.phone, a.email].filter(Boolean).map(esc).join(' &nbsp;·&nbsp; ') + '</div>' +
    '</div>';
  }
  function cover(o) {
    const a1 = o.agents && o.agents[0], a2 = o.agents && o.agents[1];
    return '<div class="cv"' + (o.image ? ' data-pos="cover"' : '') + '>' +
      (o.image ? '<img class="cv-img" src="' + o.image + '" alt="" style="object-position:' +
                   (o.pos ? o.pos.x : 50) + '% ' + (o.pos ? o.pos.y : 50) + '%">'
               : '<div class="empty-note">Drop a cover photo<br>in the Photos panel</div>') +
      '<div class="cv-mask"></div>' +
      '<div class="cv-kind">' + esc(o.kind) + '</div>' +
      '<div class="cv-head">' +
        '<div class="cv-ttl">' + esc(o.title) + '</div>' +
        (o.subtitle ? '<div class="cv-sub">' + esc(o.subtitle) + '</div>' : '') +
        (o.preparedFor ? '<div class="cv-for">Prepared for ' + esc(o.preparedFor) +
            (o.date ? '<br>' + esc(o.date) : '') + '</div>' : '') +
      '</div>' +
      '<div class="cv-bar">' +
        agentBlock(a1, 'l') +
        '<img class="cb-mono" src="' + MONO + '" alt="">' +
        agentBlock(a2, 'r') +
      '</div>' +
    '</div>';
  }

  function agentCards(list, headshotFor) {
    if (!list.length) {
      return '<div class="ag-row"><div class="ag-c"><div class="shot">' +
             '<div class="empty-note">Pick an agent<br>in the Agents panel</div></div></div></div>';
    }
    return '<div class="ag-row">' + list.map(a =>
      '<div class="ag-c">' +
        '<div class="shot"><img src="' + headshotFor(a) + '" alt=""></div>' +
        '<div class="nm">' + esc(a.name) + '</div>' +
        '<div class="tt">' + esc(a.title) + '</div>' +
        '<div class="ct">' + [a.phone, a.email].filter(Boolean).map(esc).join('<br>') + '</div>' +
      '</div>').join('') + '</div>';
  }

  /* ---------- table of contents ---------- */
  function toc(entries) {
    return '<ol class="toc">' + entries.map(e =>
      '<li><span class="n">' + String(e.page).padStart(2, '0') + '</span>' +
      '<span class="t">' + esc(e.title) + '</span>' +
      '<span class="d"></span><span class="p">' + e.page + '</span></li>').join('') + '</ol>';
  }

  /* ---------- overflow warnings ----------
     Content that runs past its box is silently clipped by overflow:hidden,
     so each deck registers the selectors that must not overflow and gets a
     plain-English warning instead of a surprise at the printer.
     Note the scrollWidth check: multi-column blocks overflow sideways, so
     scrollHeight alone never grows. */
  function overflowing(el) {
    return !!el && (el.scrollHeight > el.clientHeight + 1 ||
                    el.scrollWidth  > el.clientWidth  + 1);
  }
  /* rules: [{ key, msg, box }] -- `key` is a page key set by page(), `box`
     the id of the warning element in the editor. Anything overflowing that
     has no rule falls back to `fallback`. */
  function checkOverflow(root, rules, fallback) {
    const bucket = {};
    const add = (box, msg) => {
      if (!box) return;
      (bucket[box] = bucket[box] || []).indexOf(msg) === -1 && bucket[box].push(msg);
    };
    const seen = {};
    rules.forEach(r => { seen[r.key] = 1; });

    root.querySelectorAll('.pg[data-key]').forEach(pg => {
      const body = pg.querySelector('.pg-body');
      if (!overflowing(body) && !overflowing(pg)) return;
      const key = pg.dataset.key;
      const rule = rules.filter(r => r.key === key)[0];
      if (rule) add(rule.box, rule.msg);
      else if (fallback) add(fallback, 'Page ' + (pg.dataset.n || '') +
        ' has more content than fits. Trim it, or it will be cut off in print.');
    });

    const boxes = {};
    rules.forEach(r => { boxes[r.box] = 1; });
    if (fallback) boxes[fallback] = 1;
    Object.keys(boxes).forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const msgs = bucket[id] || [];
      el.innerHTML = msgs.map(m => '<div class="warn-item">' + esc(m) + '</div>').join('');
      el.hidden = !msgs.length;
    });
  }

  /* ---------- image drop ----------
     Reads straight to a data URL: nothing is uploaded, and the printed
     PDF stays self-contained. */
  function wireDrop(box, input, onFiles) {
    if (!box) return;
    const take = files => {
      const imgs = [...files].filter(f => /^image\//.test(f.type));
      if (!imgs.length) return;
      let pending = imgs.length;
      const outs = new Array(imgs.length);
      imgs.forEach((f, i) => {
        const r = new FileReader();
        r.onload = e => {
          outs[i] = { name: f.name, url: e.target.result };
          if (--pending === 0) onFiles(outs.filter(Boolean));
        };
        r.readAsDataURL(f);
      });
    };
    box.addEventListener('click', () => input && input.click());
    box.addEventListener('dragover', e => { e.preventDefault(); box.classList.add('over'); });
    box.addEventListener('dragleave', () => box.classList.remove('over'));
    box.addEventListener('drop', e => {
      e.preventDefault(); box.classList.remove('over');
      take(e.dataTransfer.files);
    });
    if (input) input.addEventListener('change', () => { take(input.files); input.value = ''; });
  }

  /* ---------- photo roles ----------
     Same idea as the brochure: every photo has a role. 'auto' lets the deck
     fill slots in order; anything else is an explicit pin that the auto
     pass will not touch or steal. 'exclude' keeps a photo out entirely. */
  function assignRoles(photos, slots) {
    const res = {}, taken = {};
    photos.forEach(p => {
      const r = p.role;
      if (!r || r === 'auto') return;
      taken[p.id] = 1;
      if (r !== 'exclude' && !res[r]) res[r] = p;
    });
    const pool = photos.filter(p => !taken[p.id]);
    slots.forEach(s => { if (!res[s] && pool.length) res[s] = pool.shift(); });
    res._spare = pool;
    return res;
  }

  /* The label shown under an auto photo, so the agent can see where it
     actually landed without having to pin it. */
  function autoLabelFor(img, assign, roles) {
    if (img.role && img.role !== 'auto') return null;
    const hit = Object.keys(assign).filter(k => k !== '_spare' && assign[k] === img)[0];
    if (!hit) return 'Unused';
    const row = roles.filter(r => r[0] === hit)[0];
    return row ? row[1] : hit;
  }

  function renderPhotoList(host, photos, roles, assign, handlers) {
    host.innerHTML = '';
    photos.forEach(img => {
      const row = document.createElement('div');
      row.className = 'img-row';

      const thumb = document.createElement('img');
      thumb.className = 'img-thumb'; thumb.src = img.url; thumb.alt = '';

      const mid = document.createElement('div');
      mid.className = 'img-mid';
      const name = document.createElement('div');
      name.className = 'img-name'; name.textContent = img.name;
      const auto = document.createElement('div');
      auto.className = 'img-auto';
      const lab = autoLabelFor(img, assign, roles);
      auto.textContent = lab ? 'auto → ' + lab
                        : (img.role === 'exclude' ? 'not used' : 'pinned');
      mid.appendChild(name); mid.appendChild(auto);

      const sel = document.createElement('select');
      sel.className = 'img-role';
      roles.forEach(r => {
        const o = document.createElement('option');
        o.value = r[0]; o.textContent = r[1];
        sel.appendChild(o);
      });
      sel.value = img.role || 'auto';
      sel.addEventListener('change', () => { img.role = sel.value; handlers.onChange(); });

      const del = document.createElement('button');
      del.type = 'button'; del.className = 'img-x'; del.innerHTML = '&#10005;'; del.title = 'Remove';
      del.addEventListener('click', () => handlers.onRemove(img));

      row.appendChild(thumb); row.appendChild(mid);
      row.appendChild(sel); row.appendChild(del);
      host.appendChild(row);
    });
  }

  /* ---------- reframe a photo inside its crop ----------
     Mirrors the brochure's drag-to-reposition: object-position p% puts the
     image's overflow at -(overflow * p/100), so moving it by d px means
     changing p by -d/overflow*100. Pointer deltas are in screen px, so
     they're divided by the preview's scale first. */
  function beginPhotoDrag(e, box, pos) {
    const img = box.querySelector('img');
    if (!img || !img.naturalWidth) return;
    e.preventDefault();
    const page = box.closest('.pg, .cv');
    const scale = page ? page.getBoundingClientRect().width / (8.5 * 96) : 1;
    const bw = box.clientWidth, bh = box.clientHeight;
    const cover = Math.max(bw / img.naturalWidth, bh / img.naturalHeight);
    const overX = img.naturalWidth * cover - bw, overY = img.naturalHeight * cover - bh;
    const start = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y };
    box.classList.add('is-moving');
    try { box.setPointerCapture(e.pointerId); } catch (_) {}

    const move = ev => {
      const dx = (ev.clientX - start.x) / scale, dy = (ev.clientY - start.y) / scale;
      if (overX > 0.5) pos.x = Math.max(0, Math.min(100, start.px - (dx / overX) * 100));
      if (overY > 0.5) pos.y = Math.max(0, Math.min(100, start.py - (dy / overY) * 100));
      img.style.objectPosition = pos.x + '% ' + pos.y + '%';
    };
    const done = ev => {
      box.removeEventListener('pointermove', move);
      box.removeEventListener('pointerup', done);
      box.removeEventListener('pointercancel', done);
      try { box.releasePointerCapture(ev.pointerId); } catch (_) {}
      box.classList.remove('is-moving');
    };
    box.addEventListener('pointermove', move);
    box.addEventListener('pointerup', done);
    box.addEventListener('pointercancel', done);
  }

  /* Call once per redraw, on the container holding the freshly-rendered
     pages. Any element carrying data-pos="<key>" gets drag-to-reframe
     wired against posStore[key] (created on first touch if missing). */
  function wirePhotoDrag(root, posStore) {
    root.querySelectorAll('[data-pos]').forEach(box => {
      const key = box.dataset.pos;
      if (!posStore[key]) posStore[key] = { x: 50, y: 50 };
      box.addEventListener('pointerdown', e => beginPhotoDrag(e, box, posStore[key]));
    });
  }

  /* ---------- roster picker ---------- */
  function wireRoster(host, state, max, redraw) {
    function paint() {
      host.innerHTML = '';
      (global.GVC_ROSTER || []).forEach(a => {
        const on = state.agents.indexOf(a.id) > -1;
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'ros' + (on ? ' on' : '');
        b.innerHTML = '<span class="ros-nm">' + esc(a.name) + '</span>' +
                      '<span class="ros-tt">' + esc(a.phone || a.email) + '</span>';
        b.addEventListener('click', () => {
          const i = state.agents.indexOf(a.id);
          if (i > -1) state.agents.splice(i, 1);
          else {
            state.agents.push(a.id);
            while (state.agents.length > max) state.agents.shift();
          }
          paint(); redraw();
        });
        host.appendChild(b);
      });
    }
    paint();
    return paint;
  }

  function agentsOf(state) {
    return state.agents.map(id => global.GVC_AGENT(id)).filter(Boolean);
  }

  global.Pitch = {
    MONO, MONO_NAVY,
    esc, lines, money, moneyShort, num,
    page, cover, heading, foot, toc, agentCards,
    checkOverflow, overflowing, wireDrop, wireRoster, agentsOf,
    assignRoles, renderPhotoList, autoLabelFor,
    beginPhotoDrag, wirePhotoDrag
  };
})(window);
