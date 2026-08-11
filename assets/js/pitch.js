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
  function runningHead(deckName, n, of) {
    return '<div class="rh"><span class="rh-t">' + esc(deckName) + '</span>' +
           '<span class="rh-n">' + n + ' / ' + of + '</span></div>';
  }
  function heading(title, sub) {
    return '<div class="pg-h"><h2>' + esc(title) + '</h2>' +
           (sub ? '<div class="sub">' + esc(sub) + '</div>' : '') + '</div>';
  }
  function foot(site, reversed) {
    return '<div class="pg-foot"><span class="site">' + esc(site || '') + '</span>' +
           '<img src="' + (reversed ? MONO : MONO_NAVY) + '" alt=""></div>';
  }

  /* Standard interior page: running head, title, body, footer.
     `key` lands on the wrapper so overflow rules can name a page and give
     a specific warning rather than a generic "something is too tall". */
  function page(o) {
    return '<div class="pg' + (o.reversed ? ' rev' : '') + '"' +
             (o.key ? ' data-key="' + esc(o.key) + '"' : '') + '>' +
      runningHead(o.deck, o.n, o.of) +
      heading(o.title, o.sub) +
      '<div class="pg-body">' + o.body + '</div>' +
      foot(o.site, o.reversed) +
    '</div>';
  }

  function cover(o) {
    const a = o.agent;
    return '<div class="cv">' +
      (o.image ? '<img class="cv-img" src="' + o.image + '" alt="">'
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
        '<div class="cb-l">' +
          '<div class="cb-nm">' + esc(a ? a.name : 'The GVC Team') + '</div>' +
          '<div class="cb-ct">' + (a ? [a.phone, a.email].filter(Boolean).map(esc).join(' &nbsp;·&nbsp; ')
                                     : 'Douglas Elliman Real Estate') + '</div>' +
        '</div>' +
        '<img src="' + MONO + '" alt="">' +
        '<div class="cb-r">' + esc(o.site || '') + '</div>' +
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
    page, cover, heading, runningHead, foot, toc, agentCards,
    checkOverflow, overflowing, wireDrop, wireRoster, agentsOf
  };
})(window);
