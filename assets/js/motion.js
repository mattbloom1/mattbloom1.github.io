/* Motion helpers. Everything no-ops under prefers-reduced-motion. */
(function () {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const gsapOk = typeof gsap !== "undefined";

  /* 1 — Monogram self-draw on every page load.
     The GVC mark is fill-based, so: stroke the paths, dash-animate, fade fill in. */
  function drawMonogram() {
    if (reduced || !gsapOk) return;
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
    const tl = gsap.timeline();
    tl.to(paths, { strokeDashoffset: 0, duration: 1.1, ease: "power2.inOut", stagger: 0.08 })
      .to(paths, { fillOpacity: 1, strokeWidth: 0, duration: 0.4 }, "-=0.3");
  }

  /* Race-note: chrome.js dispatches "monogram-ready" synchronously right after
     inlining the SVG. If motion.js loads after that dispatch the listener below
     won't fire, but the immediate querySelector check will. The two paths are
     mutually exclusive — { once: true } is belt-and-suspenders. */
  document.addEventListener("monogram-ready", drawMonogram, { once: true });
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
        e.target.style.transition =
          "opacity var(--dur-2) var(--ease), transform var(--dur-2) var(--ease)";
        e.target.style.opacity = "1";
        e.target.style.transform = "";
        /* Clean up inline styles after the transition completes so CSS transforms
           (e.g. hover effects) aren't permanently blocked by inline overrides. */
        e.target.addEventListener("transitionend", function cleanup(ev) {
          if (ev.target !== e.target || ev.propertyName !== "opacity") return;
          e.target.removeEventListener("transitionend", cleanup);
          e.target.style.transition = "";
          e.target.style.opacity = "";
        });
        io.unobserve(e.target);
      });
    /* threshold: 0 + rootMargin -10% bottom fires when the element top enters
       the bottom 90% of the viewport; avoids the threshold-never-fires bug for
       elements taller than ~6.7 viewports. */
    }, { threshold: 0, rootMargin: "0px 0px -10% 0px" });
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

  /* 5 — Print: snap all [data-reveal] elements visible so below-fold sections
     don't print blank (they may still have inline opacity:0 / translateY). */
  window.addEventListener("beforeprint", () => {
    document.querySelectorAll("[data-reveal]").forEach(el => {
      el.style.opacity = "";
      el.style.transform = "";
      el.style.transition = "";
    });
  });

  document.addEventListener("DOMContentLoaded", () => { entrances(); reveals(); parallax(); });
})();
