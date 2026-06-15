/* Photo-gallery viewer: raw/edited swap + lightbox.
   The grid is server-rendered; this only wires interaction. No-ops on the index page. */
(function () {
  const grid = document.getElementById("grid");
  if (!grid) return;

  const els = Array.from(grid.querySelectorAll(".photo"));
  const PHOTOS = els.map((el) => ({
    el,
    label: el.dataset.label || "",
    raw: el.dataset.raw || null,     // full-size raw
    edit: el.dataset.edit || null,   // full-size edited
    hasBoth: !!(el.dataset.raw && el.dataset.edit),
  }));

  /* ---- per-photo swap + global toggle ---- */
  function setPhoto(p, showRaw) {
    if (showRaw && !p.raw) showRaw = false;
    if (!showRaw && !p.edit) showRaw = true; // edited-missing: stay on raw
    p.el.classList.toggle("show-raw", showRaw);
    const tag = p.el.querySelector(".tag");
    if (tag) tag.textContent = showRaw ? "Raw" : "Edited";
  }

  PHOTOS.forEach((p, i) => {
    const swap = p.el.querySelector(".swap");
    if (swap && p.hasBoth) {
      swap.addEventListener("click", (e) => {
        e.stopPropagation();
        setPhoto(p, !p.el.classList.contains("show-raw"));
      });
    }
    p.el.addEventListener("click", () => openLb(i));
    p.el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLb(i); }
    });
  });

  const toggle = document.getElementById("gal-toggle");
  if (toggle) {
    toggle.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-mode]");
      if (!btn) return;
      const mode = btn.dataset.mode;
      toggle.querySelectorAll("button").forEach((b) =>
        b.classList.toggle("active", b.dataset.mode === mode));
      PHOTOS.forEach((p) => setPhoto(p, mode === "raw"));
    });
  }

  /* ---- lightbox ---- */
  const lb = document.getElementById("lb");
  const lbImg = document.getElementById("lb-img");
  const lbLabel = document.getElementById("lb-label");
  const lbEd = document.getElementById("lb-ed");
  const lbRw = document.getElementById("lb-rw");
  let idx = 0, lbMode = "edited";

  function updateLb() {
    const p = PHOTOS[idx];
    const src = lbMode === "raw" ? (p.raw || p.edit) : (p.edit || p.raw);
    lbImg.src = src;
    lbImg.alt = p.label + " — " + (lbMode === "raw" ? "raw" : "edited");
    lbLabel.textContent = p.label + " / " + (idx + 1) + " / " + PHOTOS.length;
    lbEd.classList.toggle("active", lbMode === "edited");
    lbRw.classList.toggle("active", lbMode === "raw");
    lbEd.style.opacity = p.edit ? "1" : "0.3";
    lbRw.style.opacity = p.raw ? "1" : "0.3";
  }
  function openLb(i) {
    idx = i;
    const p = PHOTOS[i];
    lbMode = p.el.classList.contains("show-raw") && p.raw ? "raw" : (p.edit ? "edited" : "raw");
    updateLb();
    lb.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeLb() {
    lb.classList.remove("open");
    document.body.style.overflow = "";
  }
  function navLb(d) {
    idx = (idx + d + PHOTOS.length) % PHOTOS.length;
    const p = PHOTOS[idx];
    lbMode = p.edit ? "edited" : "raw";
    updateLb();
  }
  function setLbMode(m) {
    const p = PHOTOS[idx];
    if (m === "raw" && !p.raw) return;
    if (m === "edited" && !p.edit) return;
    lbMode = m; updateLb();
  }

  if (lb) {
    lb.addEventListener("click", (e) => {
      // click on the dark backdrop (not the image or controls) closes
      if (!e.target.closest(".lb-wrap,.lb-ctrls,.lb-label,.lb-hints") || e.target.id === "lb-close")
        closeLb();
    });
    document.getElementById("lb-close").addEventListener("click", closeLb);
    lb.querySelectorAll(".lb-btn[data-dir]").forEach((b) =>
      b.addEventListener("click", (e) => { e.stopPropagation(); navLb(Number(b.dataset.dir)); }));
    lbEd.addEventListener("click", (e) => { e.stopPropagation(); setLbMode("edited"); });
    lbRw.addEventListener("click", (e) => { e.stopPropagation(); setLbMode("raw"); });

    window.addEventListener("keydown", (e) => {
      if (!lb.classList.contains("open")) return;
      if (e.key === "ArrowRight") { e.preventDefault(); navLb(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); navLb(-1); }
      else if (e.key === "Escape") closeLb();
      else if (e.key === " " || e.key === "r" || e.key === "R") {
        e.preventDefault(); setLbMode(lbMode === "raw" ? "edited" : "raw");
      }
    });

    /* touch: tap = toggle raw/edited, horizontal swipe = navigate, swipe down = close */
    const wrap = document.getElementById("lb-wrap");
    let sx = 0, sy = 0, t0 = 0, tracking = false, moved = false;
    const TH_X = 40, TH_Y = 80, TAP_MAX = 12, TAP_MS = 350;
    wrap.addEventListener("touchstart", (e) => {
      if (e.touches.length !== 1) { tracking = false; return; }
      sx = e.touches[0].clientX; sy = e.touches[0].clientY; t0 = Date.now();
      tracking = true; moved = false;
    }, { passive: true });
    wrap.addEventListener("touchmove", (e) => {
      if (!tracking || e.touches.length !== 1) return;
      if (Math.abs(e.touches[0].clientX - sx) > TAP_MAX || Math.abs(e.touches[0].clientY - sy) > TAP_MAX) moved = true;
    }, { passive: true });
    wrap.addEventListener("touchend", (e) => {
      if (!tracking) return;
      tracking = false;
      const tc = e.changedTouches && e.changedTouches[0];
      if (!tc) return;
      const dx = tc.clientX - sx, dy = tc.clientY - sy, dt = Date.now() - t0;
      const adx = Math.abs(dx), ady = Math.abs(dy);
      if (!moved && dt < TAP_MS) {
        const p = PHOTOS[idx];
        if (p.hasBoth) setLbMode(lbMode === "raw" ? "edited" : "raw");
        return;
      }
      if (ady > TH_Y && ady > adx) { if (dy > 0) closeLb(); return; }
      if (adx > TH_X && adx > ady) navLb(dx < 0 ? 1 : -1);
    }, { passive: true });
  }
})();
