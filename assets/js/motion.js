/* Motion helpers. Everything no-ops under prefers-reduced-motion. */
(function () {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const gsapOk = typeof gsap !== "undefined";

  /* 1 — Monogram self-draw, once per session.
     The GVC mark is fill-based, so: stroke the paths, dash-animate, fade fill in. */
  function drawMonogram() {
    if (reduced || !gsapOk) return;
    if (sessionStorage.getItem("monogram-drawn")) return;
    const svg = document.querySelector("#mast-monogram svg");
    if (!svg) return;
    const paths = svg.querySelectorAll("path");
    paths.forEach(p => {
      const len = p.getTotalLength();
      p.style.fillOpacity = "0";
      p.style.stroke = "currentColor";
      p.style.strokeWidth = "14";
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
    });
    const tl = gsap.timeline({
      onComplete: () => sessionStorage.setItem("monogram-drawn", "1"),
    });
    tl.to(paths, { strokeDashoffset: 0, duration: 1.1, ease: "power2.inOut", stagger: 0.08 })
      .to(paths, { fillOpacity: 1, strokeWidth: 0, duration: 0.4 }, "-=0.3");
  }

  /* Race-note fix: chrome.js's SVG fetch may have already resolved before this
     listener registers. Check immediately; if the SVG is already inlined, run now.
     drawMonogram's guards (svg null-check + sessionStorage flag) make this safe. */
  document.addEventListener("monogram-ready", drawMonogram);
  if (document.querySelector("#mast-monogram svg")) drawMonogram();

  /* 2 — Staggered entrance for elements marked data-enter (used by the bento). */
  function entrances() {
    const els = document.querySelectorAll("[data-enter]");
    if (!els.length || reduced || !gsapOk) return;
    gsap.from(els, {
      opacity: 0, y: 26, duration: 0.7, ease: "power3.out",
      stagger: 0.07, clearProps: "all",
    });
  }

  /* 3 — Reveal-on-scroll for elements marked data-reveal (case studies etc). */
  function reveals() {
    const els = document.querySelectorAll("[data-reveal]");
    if (!els.length || reduced) return;
    els.forEach(el => { el.style.opacity = "0"; el.style.transform = "translateY(18px)"; });
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.style.transition = "opacity .5s var(--ease), transform .5s var(--ease)";
        e.target.style.opacity = "1";
        e.target.style.transform = "none";
        io.unobserve(e.target);
      });
    }, { threshold: 0.15 });
    els.forEach(el => io.observe(el));
  }

  /* 4 — Pointer parallax on tile imagery (pointer:fine only). */
  function parallax() {
    if (reduced || !window.matchMedia("(pointer: fine)").matches) return;
    document.querySelectorAll(".tile .tile-img img").forEach(img => {
      const tile = img.closest(".tile");
      tile.addEventListener("mousemove", e => {
        const r = tile.getBoundingClientRect();
        const dx = (e.clientX - r.left) / r.width - 0.5;
        const dy = (e.clientY - r.top) / r.height - 0.5;
        img.style.transform = `scale(1.07) translate(${dx * -8}px, ${dy * -8}px)`;
      });
      tile.addEventListener("mouseleave", () => { img.style.transform = ""; });
    });
  }

  document.addEventListener("DOMContentLoaded", () => { entrances(); reveals(); parallax(); });
})();
