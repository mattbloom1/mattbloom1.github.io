# Portfolio Foundation Implementation Plan (Plan 1 of 6)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the live portfolio site — repo, design system, shared chrome, bento homepage, two case studies — deployed to GitHub Pages.

**Architecture:** Build-less static site served from `main` of `mattbloom1/mattbloom1.github.io`. Shared CSS tokens/components and a `chrome.js` that injects masthead/footer on every page. Homepage is a 4-column bento grid; tiles for tools not yet built render the navy color-block fallback and get wired up by Plans 2–6.

**Tech Stack:** HTML/CSS/vanilla JS, GSAP 3 (CDN) for entrance/parallax/monogram animation, IntersectionObserver for scroll reveals, Python (miniconda, Pillow) for one-off image prep, Playwright CLI for site screenshots, `gh` CLI for deploy.

**Spec:** `docs/superpowers/specs/2026-06-10-portfolio-site-design.md`

**Plan series:** 1 Foundation (this) → 2 Calculator + Showsheet restyles → 3 Photo galleries → 4 Icon library → 5 Map Studio merge → 6 Floorplan port. Plans 2–6 are written after the preceding plan lands, referencing as-built classes/APIs.

**Verification model:** No JS test framework (build-less site). Every task ends with a browser verification step against a local server (`python -m http.server 8080` from repo root) with explicit pass criteria, then a commit.

---

## File structure (created by this plan)

```
Portfolio/
├── .nojekyll                      GitHub Pages: serve files verbatim
├── README.md                      what this repo is, how to run/deploy
├── index.html                     homepage (bento)
├── assets/
│   ├── css/
│   │   ├── tokens.css             design tokens only (no rules beyond :root + media)
│   │   ├── base.css               reset, typography, masthead/footer, page scaffold
│   │   └── components.css         bento tiles, color-block, buttons, case-study layout
│   ├── js/
│   │   ├── chrome.js              masthead/footer injection + NAV config
│   │   └── motion.js              reduced-motion gate, monogram draw, entrances, parallax
│   ├── logos/
│   │   ├── monogram.svg           copy of "Logo Only Dark Blue.svg"
│   │   ├── monogram-white.svg     copy of "Logo Only White.svg"
│   │   └── lockup.svg             copy of "Name and Logo Dark Blue.svg"
│   └── img/
│       ├── tile-photo.jpg         one edited property photo, ≤1200px
│       ├── tile-casa.webp         Casa Avenida screenshot
│       ├── tile-lereve.webp       Le Rêve screenshot
│       └── icon-strip/            8 SVGs copied from Icons/output
├── projects/
│   ├── casa-avenida/index.html
│   └── le-reve/index.html
└── tools/ , photos/ , icons/ , scripts/   empty dirs reserved (added by later plans; git ignores empty dirs — create when used)
```

Pages link assets with **relative paths** (`assets/...` from root pages, `../../assets/...` from `projects/*/`) so the site also works when previewed from a subfolder.

---

### Task 1: Repo scaffold

**Files:**
- Create: `.nojekyll`, `README.md`

- [ ] **Step 1: Create files**

`.nojekyll` — empty file.

`README.md`:

```markdown
# mattbloom1.github.io

Portfolio + tool hub. Matt Bloomfield, for The GVC Team (Douglas Elliman).

Static site, no build step. GSAP via CDN.

## Local preview

    python -m http.server 8080
    # open http://localhost:8080

## Deploy

Push to `main`. GitHub Pages serves the repo root.

## Content updates (added by later plans)

- `scripts/build_photos.py` — regenerate web-optimized property photos
- `scripts/build_icons.py` — regenerate the icon library from the scan pipeline

## Docs

- Spec: `docs/superpowers/specs/2026-06-10-portfolio-site-design.md`
- Plans: `docs/superpowers/plans/`
```

- [ ] **Step 2: Verify and commit**

Run from `C:\Users\Matthew Bloomdield\Desktop\Portfolio` (all later commands too):

```bash
git add .nojekyll README.md && git commit -m "chore: scaffold repo"
```

---

### Task 2: Design tokens

**Files:**
- Create: `assets/css/tokens.css`

- [ ] **Step 1: Write tokens.css**

```css
/* GVC Editorial design tokens — single source of truth.
   Brand: GVC Brand Guideline FINAL JAN 2025. */
:root {
  /* color */
  --paper: #EFEDE8;
  --paper-2: #E7E4DC;
  --ink: #00273A;        /* GVC Navy — all text on paper */
  --sky: #53C7DC;        /* hairlines, hovers, active states. Never body text */
  --cyan: #00A1C4;       /* mono meta text, links. Sparingly */
  --bone: #E5E5E5;       /* text/elements on navy */
  --rule: #D3D4D0;       /* hairline borders */
  --ink-soft: #33525F;   /* secondary text on paper (ink at ~80%) */

  /* type */
  --serif: 'Fraunces', Georgia, serif;
  --sans-display: 'Nunito Sans', system-ui, sans-serif; /* 800/900, caps, tracked */
  --sans-body: 'Raleway', system-ui, sans-serif;
  --mono: 'JetBrains Mono', ui-monospace, monospace;

  /* motion */
  --ease: cubic-bezier(0.2, 0.8, 0.2, 1);
  --dur-1: 180ms;   /* hovers */
  --dur-2: 360ms;   /* reveals */
  --dur-3: 700ms;   /* entrances */

  /* layout */
  --pad-x: 40px;
  --mast-h: 64px;
}
@media (max-width: 640px) {
  :root { --pad-x: 16px; }
}
```

- [ ] **Step 2: Commit**

```bash
git add assets/css/tokens.css && git commit -m "feat: design tokens"
```

---

### Task 3: Base stylesheet (reset, typography, chrome)

**Files:**
- Create: `assets/css/base.css`

- [ ] **Step 1: Write base.css**

```css
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
body{
  font-family:var(--sans-body);
  background:var(--paper);
  color:var(--ink);
  line-height:1.55;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
  min-height:100vh;
  display:flex;flex-direction:column;
  animation:page-in var(--dur-2) var(--ease);
}
@keyframes page-in{from{opacity:0}to{opacity:1}}
main{flex:1}
a{color:inherit;text-decoration:none}
img,svg{display:block;max-width:100%}

h1,h2,h3{font-weight:300;font-family:var(--serif);letter-spacing:-0.02em}

/* type utilities */
.t-serif{font-family:var(--serif);font-weight:300}
.t-label{
  font-family:var(--sans-display);font-weight:800;
  font-size:11px;letter-spacing:0.22em;text-transform:uppercase;
}
.t-mono{
  font-family:var(--mono);font-size:11px;
  letter-spacing:0.1em;text-transform:uppercase;color:var(--ink-soft);
  /* --cyan fails AA on paper (2.6:1); components recolor .t-mono to --sky on navy */
}

/* ---------- masthead (injected by chrome.js) ---------- */
.masthead{
  position:sticky;top:0;z-index:50;
  display:flex;align-items:center;justify-content:space-between;gap:16px;
  min-height:var(--mast-h);padding:0 var(--pad-x);
  background:var(--paper);border-bottom:1px solid var(--rule);
}
.mast-lockup{display:flex;align-items:center;gap:14px;min-width:0}
.mast-lockup .monogram{width:34px;height:34px;flex-shrink:0}
.mast-lockup .names{display:flex;flex-direction:column;line-height:1.15}
.mast-lockup .who{font-family:var(--serif);font-size:17px;white-space:nowrap}
.mast-lockup .for{font-family:var(--mono);font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:var(--ink-soft)}
.mast-nav{display:flex;gap:22px;align-items:baseline}
.mast-nav a{
  font-family:var(--sans-display);font-weight:800;font-size:11px;
  letter-spacing:0.18em;text-transform:uppercase;
  padding-bottom:3px;border-bottom:2px solid transparent;
  transition:border-color var(--dur-1);
}
.mast-nav a:hover{border-color:var(--sky)}
.mast-nav a[aria-current="page"]{border-color:var(--sky)}
@media (max-width:640px){
  .mast-lockup .who{font-size:14px}
  .mast-lockup .for{display:none}
  .mast-nav{gap:14px}
  .mast-nav a{font-size:10px;letter-spacing:0.12em}
}

/* ---------- footer (injected by chrome.js) ---------- */
.site-foot{
  margin-top:96px;padding:32px var(--pad-x);
  border-top:1px solid var(--rule);
  display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:12px;
}
.site-foot .left{font-family:var(--serif);font-size:14px}
.site-foot .right{display:flex;gap:18px}
.site-foot .right a{font-family:var(--mono);font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:var(--ink-soft);border-bottom:1px solid transparent;transition:border-color var(--dur-1)}
.site-foot .right a:hover{border-color:var(--ink)}

/* ---------- page scaffold ---------- */
.page{padding:0 var(--pad-x)}
.page-head{padding:56px 0 28px;border-bottom:1px solid var(--rule)}
.page-head h1{font-size:clamp(36px,5vw,64px);line-height:1}
.page-head .t-mono{margin-top:14px;display:block}

@media (prefers-reduced-motion: reduce){
  html{scroll-behavior:auto}
  body{animation:none}
  *,*::before,*::after{transition-duration:0.01ms!important;animation-duration:0.01ms!important}
}
```

- [ ] **Step 2: Commit**

```bash
git add assets/css/base.css && git commit -m "feat: base styles and shared chrome CSS"
```

---

### Task 4: Logo assets and components stylesheet

**Files:**
- Create: `assets/logos/monogram.svg`, `assets/logos/monogram-white.svg`, `assets/logos/lockup.svg`, `assets/css/components.css`

- [ ] **Step 1: Copy logos**

```bash
mkdir -p assets/logos
cp "/c/Users/Matthew Bloomdield/Desktop/Showsheet Generator/GVC_SVG_LOGO COLLECTION/Logo Only Dark Blue.svg" assets/logos/monogram.svg
cp "/c/Users/Matthew Bloomdield/Desktop/Showsheet Generator/GVC_SVG_LOGO COLLECTION/Logo Only White.svg" assets/logos/monogram-white.svg
cp "/c/Users/Matthew Bloomdield/Desktop/Showsheet Generator/GVC_SVG_LOGO COLLECTION/Name and Logo Dark Blue.svg" assets/logos/lockup.svg
```

- [ ] **Step 2: Write components.css**

```css
/* ---------- bento ---------- */
.bento{
  display:grid;gap:14px;
  grid-template-columns:repeat(4,1fr);
  grid-auto-rows:190px;
  grid-auto-flow:dense;
  padding:32px 0 0;
}
.tile{
  position:relative;overflow:hidden;border-radius:8px;
  background:var(--paper-2);border:1px solid var(--rule);
  display:flex;flex-direction:column;justify-content:flex-end;
  padding:18px;cursor:pointer;
  transition:transform var(--dur-1) var(--ease), box-shadow var(--dur-1) var(--ease);
}
.tile:hover{transform:translateY(-3px);box-shadow:0 10px 30px rgba(0,39,58,0.10)}
.tile:focus-visible{outline:2px solid var(--sky);outline-offset:2px}
.tile.w2{grid-column:span 2}
.tile.h2{grid-row:span 2}

/* navy color-block tile (fallback + websites) — the GVC color-block accent */
.tile.navy{background:var(--ink);border:none;color:var(--bone)}
.tile.navy::before{
  content:"";position:absolute;left:0;top:18px;bottom:18px;width:3px;background:var(--sky);
}
.tile.navy .t-mono{color:var(--sky)}

.tile .tile-img{
  position:absolute;inset:0;z-index:0;
}
.tile .tile-img img{
  width:100%;height:100%;object-fit:cover;
  transform:scale(1.04);            /* headroom for pointer parallax */
  transition:transform var(--dur-2) var(--ease);
}
.tile .tile-cap{
  position:relative;z-index:1;
  display:flex;flex-direction:column;gap:4px;
}
.tile.has-img .tile-cap{
  background:linear-gradient(transparent, rgba(0,39,58,0.78) 30%);
  margin:-18px;padding:34px 18px 16px;color:var(--bone);
}
.tile.has-img .tile-cap .t-mono{color:var(--sky)}
.tile .tile-name{font-family:var(--serif);font-size:22px;line-height:1.1}
.tile.h2 .tile-name{font-size:30px}

/* icon strip inside the Icon Library tile */
.tile .icon-strip{
  position:relative;z-index:1;flex:1;
  display:flex;align-items:center;gap:14px;flex-wrap:wrap;align-content:center;
}
.tile .icon-strip img{width:34px;height:34px;opacity:0.9}

@media (max-width:980px){ .bento{grid-template-columns:repeat(2,1fr)} }
@media (max-width:560px){
  .bento{grid-template-columns:1fr;grid-auto-rows:150px}
  .tile.w2,.tile.h2{grid-column:span 1;grid-row:span 1}
  .tile.h2.feature{grid-row:span 2}
}

/* ---------- buttons ---------- */
.btn{
  display:inline-flex;align-items:center;gap:8px;
  font-family:var(--sans-display);font-weight:800;font-size:11px;
  letter-spacing:0.18em;text-transform:uppercase;
  border:1px solid var(--ink);border-radius:999px;
  padding:10px 20px;transition:background var(--dur-1),color var(--dur-1);
}
.btn:hover{background:var(--ink);color:var(--bone)}
.btn.on-navy{border-color:var(--bone)}
.btn.on-navy:hover{background:var(--bone);color:var(--ink)}

/* ---------- case study ---------- */
.case-hero{margin:32px 0 0;border:1px solid var(--rule);border-radius:8px;overflow:hidden}
.case-hero img{width:100%;height:auto}
.case-grid{
  display:grid;grid-template-columns:2fr 1fr;gap:48px;padding:40px 0;
}
.case-grid .body p{max-width:62ch;margin-bottom:1em;font-weight:400}
.case-meta{display:flex;flex-direction:column;gap:20px}
.case-meta h3{font-family:var(--sans-display);font-weight:800;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;margin-bottom:8px}
.case-meta ul{list-style:none}
.case-meta li{font-family:var(--mono);font-size:11px;letter-spacing:0.06em;color:var(--ink-soft);padding:6px 0;border-bottom:1px solid var(--rule)}
@media (max-width:780px){ .case-grid{grid-template-columns:1fr;gap:28px} }

/* reveal-on-scroll initial state is set by motion.js (not CSS) so content
   is visible when JS is disabled */
```

- [ ] **Step 3: Commit**

```bash
git add assets/logos assets/css/components.css && git commit -m "feat: logos and component styles"
```

---

### Task 5: chrome.js — masthead/footer injection

**Files:**
- Create: `assets/js/chrome.js`

- [ ] **Step 1: Write chrome.js**

Every page sets `<body data-root="">` (root pages) or `data-root="../../"` (pages two levels deep), and optionally `data-nav="projects"` to mark the active section.

```js
/* Injects shared masthead + footer. NAV grows as sections ship (Plans 2-6). */
(function () {
  const root = document.body.dataset.root || "";
  const active = document.body.dataset.nav || "";

  // Add entries here as sections ship: ["tools","Tools","tools/"], ["photos","Photos","photos/"], ["icons","Icons","icons/"]
  const NAV = [
    ["home", "Home", ""],
    ["projects", "Projects", "projects/casa-avenida/"],
  ];

  const navLinks = NAV.map(([id, label, href]) =>
    `<a href="${root}${href || "."}" ${id === active ? 'aria-current="page"' : ""}>${label}</a>`
  ).join("");

  const mast = document.createElement("header");
  mast.className = "masthead";
  mast.innerHTML = `
    <a class="mast-lockup" href="${root}.">
      <span class="monogram" id="mast-monogram"></span>
      <span class="names">
        <span class="who">Matt Bloomfield</span>
        <span class="for">for The GVC Team</span>
      </span>
    </a>
    <nav class="mast-nav">${navLinks}</nav>`;
  document.body.prepend(mast);

  // Inline the monogram SVG so motion.js can animate its paths.
  fetch(root + "assets/logos/monogram.svg")
    .then(r => r.text())
    .then(svg => {
      const slot = document.getElementById("mast-monogram");
      if (slot) { slot.innerHTML = svg; document.dispatchEvent(new Event("monogram-ready")); }
    })
    .catch(() => {}); // masthead works without the mark

  const foot = document.createElement("footer");
  foot.className = "site-foot";
  foot.innerHTML = `
    <span class="left">Matt Bloomfield — The GVC Team, Douglas Elliman</span>
    <span class="right">
      <a href="mailto:matthew@gvcrealestateteam.com">matthew@gvcrealestateteam.com</a>
      <a href="https://github.com/mattbloom1" target="_blank" rel="noopener">github/mattbloom1</a>
      <a href="https://github.com/matthewGVC" target="_blank" rel="noopener">github/matthewGVC</a>
      <a href="https://gvcrealestateteam.com" target="_blank" rel="noopener">gvcrealestateteam.com</a>
    </span>`;
  document.body.append(foot);
})();
```

- [ ] **Step 2: Verify**

Create a throwaway `_chrome-test.html` in repo root:

```html
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>chrome test</title>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400&family=Nunito+Sans:wght@800;900&family=Raleway:wght@300;400;500&family=JetBrains+Mono&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/tokens.css">
<link rel="stylesheet" href="assets/css/base.css">
<link rel="stylesheet" href="assets/css/components.css">
</head><body data-root="" data-nav="home">
<main class="page"><h1 style="padding:60px 0">chrome test</h1></main>
<script src="assets/js/chrome.js"></script>
</body></html>
```

Run `python -m http.server 8080`, open `http://localhost:8080/_chrome-test.html`.
Pass: masthead with monogram + "Matt Bloomfield / for The GVC Team" lockup and Home/Projects nav; footer with the four real links; "Home" has a sky underline; no console errors.

- [ ] **Step 3: Delete test file and commit**

```bash
rm _chrome-test.html
git add assets/js/chrome.js && git commit -m "feat: shared chrome injection"
```

---

### Task 6: motion.js — reduced-motion gate, monogram draw, entrances, parallax

**Files:**
- Create: `assets/js/motion.js`

- [ ] **Step 1: Write motion.js**

Pages load GSAP from CDN *before* this file. All initial hidden states are set from JS so no-JS users see full content.

> **Race note:** chrome.js can dispatch `monogram-ready` before motion.js runs (the SVG fetch may resolve while the parser is still blocked fetching motion.js). In addition to `document.addEventListener("monogram-ready", drawMonogram)`, check whether the SVG is already inlined — `if (document.querySelector("#mast-monogram svg")) drawMonogram();` — so the draw still happens when the event has already fired.

```js
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
  document.addEventListener("monogram-ready", drawMonogram);

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
```

- [ ] **Step 2: Commit**

```bash
git add assets/js/motion.js && git commit -m "feat: motion helpers"
```

(Verified live in Task 8's homepage check.)

---

### Task 7: Tile assets (photo, icon strip)

**Files:**
- Create: `assets/img/tile-photo.jpg`, `assets/img/icon-strip/*.svg` (8 files)

- [ ] **Step 1: Pick and resize one property photo**

List candidates, pick any **landscape interior** JPG (executor's judgment — a wide living room or kitchen reads best at tile size):

```bash
ls "/c/Users/Matthew Bloomdield/Desktop/Personal Photo Editing Project/120 East 75th/"
```

Resize with the miniconda Python (Pillow is installed per the Icons project):

```python
# one-off, run via: python resize_tile.py (then delete the script)
from PIL import Image
src = r"C:\Users\Matthew Bloomdield\Desktop\Personal Photo Editing Project\120 East 75th\<CHOSEN>.jpg"
img = Image.open(src); img.thumbnail((1200, 1200))
img.convert("RGB").save(r"assets\img\tile-photo.jpg", quality=82, optimize=True)
```

Pass: `assets/img/tile-photo.jpg` exists and is under 250 KB.

- [ ] **Step 2: Copy 8 icons for the strip**

```bash
ls "/c/Users/Matthew Bloomdield/Desktop/Icons/output/"*.svg | head -40
mkdir -p assets/img/icon-strip
# pick 8 visually distinct, recognizable names from the listing, e.g.:
cp "/c/Users/Matthew Bloomdield/Desktop/Icons/output/fish.svg" assets/img/icon-strip/
cp "/c/Users/Matthew Bloomdield/Desktop/Icons/output/gear.svg" assets/img/icon-strip/
# ... 6 more (substitute actual filenames from the ls output)
```

Pass: 8 SVGs in `assets/img/icon-strip/`.

- [ ] **Step 3: Commit**

```bash
git add assets/img && git commit -m "feat: homepage tile assets (photo, icon strip)"
```

---

### Task 8: Homepage bento

**Files:**
- Create: `index.html`

- [ ] **Step 1: Write index.html**

16-cell layout (4 cols): Photo 2×2 · Icons 2×1 · Map Studio 2×1 · Showsheet 1 · Floorplan 1 · Calculator 1 · GitHub 1 · Casa 2×1 · Le Rêve 2×1. Tool tiles point at their future routes but render the navy fallback until their plans land — **keep `href` removed (use `<div>`) until the target exists; convert to `<a>` in the plan that ships each tool.** Photo/Icons tiles also stay `<div>` until Plans 3/4. Only the case studies and GitHub are live links in Plan 1.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Matt Bloomfield — Portfolio</title>
<meta name="description" content="Design tools, photo galleries, and property websites built for The GVC Team at Douglas Elliman.">
<link rel="icon" href="assets/logos/monogram.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300&family=Nunito+Sans:wght@800;900&family=Raleway:wght@300;400;500&family=JetBrains+Mono&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/tokens.css">
<link rel="stylesheet" href="assets/css/base.css">
<link rel="stylesheet" href="assets/css/components.css">
</head>
<body data-root="" data-nav="home">
<main class="page">
  <section class="bento" aria-label="Projects">

    <div class="tile h2 w2 has-img feature" data-enter>
      <div class="tile-img"><img src="assets/img/tile-photo.jpg" alt="Edited interior photo, 120 East 75th"></div>
      <div class="tile-cap">
        <span class="t-mono">13 property galleries</span>
        <span class="tile-name">Photo Editing</span>
      </div>
    </div>

    <div class="tile w2" data-enter>
      <div class="icon-strip">
        <!-- list the 8 copied files explicitly -->
        <img src="assets/img/icon-strip/fish.svg" alt=""><img src="assets/img/icon-strip/gear.svg" alt="">
        <!-- ... remaining 6 -->
      </div>
      <div class="tile-cap"><span class="tile-name">Icon Library</span></div>
    </div>

    <div class="tile navy w2" data-enter>
      <div class="tile-cap">
        <span class="t-mono">Address list → 3D map → export</span>
        <span class="tile-name">Map Studio</span>
      </div>
    </div>

    <div class="tile navy" data-enter>
      <div class="tile-cap"><span class="t-mono">Tool</span><span class="tile-name">Showsheet Generator</span></div>
    </div>

    <div class="tile navy" data-enter>
      <div class="tile-cap"><span class="t-mono">Tool</span><span class="tile-name">Floorplan Converter</span></div>
    </div>

    <div class="tile navy" data-enter>
      <div class="tile-cap"><span class="t-mono">Tool</span><span class="tile-name">Feet &amp; Inches Calculator</span></div>
    </div>

    <a class="tile" href="https://github.com/mattbloom1" target="_blank" rel="noopener" data-enter>
      <div class="tile-cap"><span class="t-mono">github.com/mattbloom1 ↗</span><span class="tile-name">Source</span></div>
    </a>

    <a class="tile has-img w2" href="projects/casa-avenida/" data-enter>
      <div class="tile-img"><img src="assets/img/tile-casa.webp" alt="Casa Avenida website"></div>
      <div class="tile-cap"><span class="t-mono">Website</span><span class="tile-name">Casa Avenida</span></div>
    </a>

    <a class="tile has-img w2" href="projects/le-reve/" data-enter>
      <div class="tile-img"><img src="assets/img/tile-lereve.webp" alt="Le Rêve website"></div>
      <div class="tile-cap"><span class="t-mono">Website</span><span class="tile-name">Le Rêve</span></div>
    </a>

  </section>
</main>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"></script>
<script src="assets/js/chrome.js"></script>
<script src="assets/js/motion.js"></script>
</body>
</html>
```

Note: `tile-casa.webp` / `tile-lereve.webp` don't exist until Task 9 — the two website tiles will show broken images at this step; that's expected and resolved next task.

- [ ] **Step 2: Verify**

Open `http://localhost:8080/`. Pass:
- Bento fills 4 rows × 4 cols with no empty cells at 1280px; 2-col at 768px; 1-col at 375px
- Tiles stagger in; monogram draws once, then not again on reload (sessionStorage)
- Photo tile parallaxes on mouse move; navy tiles show the sky color-block bar
- With DevTools "Emulate prefers-reduced-motion", everything appears instantly, no animation
- No console errors except the two missing webp images

- [ ] **Step 3: Commit**

```bash
git add index.html && git commit -m "feat: homepage bento"
```

---

### Task 9: Website screenshots

**Files:**
- Create: `assets/img/tile-casa.webp`, `assets/img/tile-lereve.webp`, `projects/casa-avenida/hero.webp`, `projects/le-reve/hero.webp`

- [ ] **Step 1: Confirm both sites are live**

```bash
curl -sI https://casaavenidadelray.com | head -1
curl -sI https://lerevebocaraton.com | head -1
```

Expected: `HTTP/2 200` (or 301 to the canonical host — follow it). If Casa Avenida is not live yet, run it locally instead (`cd "Desktop/Casa Avenida Website" && npm run dev`) and screenshot `http://localhost:3000`.

- [ ] **Step 2: Capture**

Either use the Claude-in-Chrome / Preview MCP screenshot tools at 1440×900, or Playwright CLI:

```bash
npx -y playwright@1.53 install chromium
npx -y playwright@1.53 screenshot --viewport-size=1440,900 --wait-for-timeout=6000 https://casaavenidadelray.com casa-raw.png
npx -y playwright@1.53 screenshot --viewport-size=1440,900 --wait-for-timeout=6000 https://lerevebocaraton.com lereve-raw.png
```

(6s wait lets hero crossfades/fonts settle.)

- [ ] **Step 3: Convert to webp at two sizes**

```python
# one-off convert_shots.py, delete after running
from PIL import Image
import os
for raw, slug in [("casa-raw.png", "casa-avenida"), ("lereve-raw.png", "le-reve")]:
    img = Image.open(raw).convert("RGB")
    os.makedirs(f"projects/{slug}", exist_ok=True)
    img.save(f"projects/{slug}/hero.webp", "WEBP", quality=82)          # case-study hero
    tile = img.copy(); tile.thumbnail((1000, 1000))
    name = "tile-casa.webp" if slug == "casa-avenida" else "tile-lereve.webp"
    tile.save(f"assets/img/{name}", "WEBP", quality=80)                  # homepage tile
```

Pass: 4 webp files exist, each ≤300 KB. Delete the raw PNGs and the script.

- [ ] **Step 4: Verify homepage and commit**

Reload `http://localhost:8080/` — both website tiles now show screenshots, zero console errors.

```bash
git add assets/img/*.webp projects && git commit -m "feat: website screenshots for tiles and case studies"
```

---

### Task 10: Case study pages

**Files:**
- Create: `projects/casa-avenida/index.html`, `projects/le-reve/index.html`

- [ ] **Step 1: Write projects/casa-avenida/index.html**

Facts from the project's README/CLAUDE.md — verify against the live site while writing; correct copy beats complete copy.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Casa Avenida — Matt Bloomfield</title>
<meta name="description" content="Marketing and sales website for Casa Avenida, 8 townhome residences in Delray Beach, FL.">
<link rel="icon" href="../../assets/logos/monogram.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300&family=Nunito+Sans:wght@800;900&family=Raleway:wght@300;400;500&family=JetBrains+Mono&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../../assets/css/tokens.css">
<link rel="stylesheet" href="../../assets/css/base.css">
<link rel="stylesheet" href="../../assets/css/components.css">
</head>
<body data-root="../../" data-nav="projects">
<main class="page">
  <div class="page-head" data-reveal>
    <h1>Casa Avenida</h1>
    <span class="t-mono">Website · Delray Beach, FL</span>
  </div>

  <div class="case-hero" data-reveal>
    <img src="hero.webp" alt="Casa Avenida homepage">
  </div>

  <div class="case-grid">
    <div class="body" data-reveal>
      <p>Marketing and sales website for Casa Avenida — 8 townhome residences at 102 SE 5th Ave, Delray Beach, completion expected Q2 2027. Sales through TJ Verdiglione and Nicole Melveney at Douglas Elliman.</p>
      <p>The site covers per-unit floorplans with zoom/pan viewers, finish packages, a gallery, neighborhood map, and inquiry handling with spam protection and lead logging.</p>
      <a class="btn" href="https://casaavenidadelray.com" target="_blank" rel="noopener">Visit site ↗</a>
    </div>
    <aside class="case-meta" data-reveal>
      <div>
        <h3>Stack</h3>
        <ul>
          <li>Next.js 14 · TypeScript</li>
          <li>Tailwind CSS</li>
          <li>Motion</li>
          <li>Resend · MailerLite</li>
          <li>Google Maps API</li>
          <li>Vercel</li>
        </ul>
      </div>
      <div>
        <h3>Role</h3>
        <ul><li>Design · build · maintenance</li></ul>
      </div>
    </aside>
  </div>
</main>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"></script>
<script src="../../assets/js/chrome.js"></script>
<script src="../../assets/js/motion.js"></script>
</body>
</html>
```

- [ ] **Step 2: Write projects/le-reve/index.html**

Same skeleton with Le Rêve content (full file, changed parts shown in place):

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Le Rêve — Matt Bloomfield</title>
<meta name="description" content="Marketing site for Le Rêve, five luxury townhomes in Boca Raton, FL.">
<link rel="icon" href="../../assets/logos/monogram.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300&family=Nunito+Sans:wght@800;900&family=Raleway:wght@300;400;500&family=JetBrains+Mono&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../../assets/css/tokens.css">
<link rel="stylesheet" href="../../assets/css/base.css">
<link rel="stylesheet" href="../../assets/css/components.css">
</head>
<body data-root="../../" data-nav="projects">
<main class="page">
  <div class="page-head" data-reveal>
    <h1>Le Rêve</h1>
    <span class="t-mono">Website · Boca Raton, FL</span>
  </div>

  <div class="case-hero" data-reveal>
    <img src="hero.webp" alt="Le Rêve homepage">
  </div>

  <div class="case-grid">
    <div class="body" data-reveal>
      <p>Marketing site for Le Rêve — five luxury townhomes in Boca Raton, built for the Gasdaska Verdiglione Conlon Team at Douglas Elliman.</p>
      <p>Editorial design with self-hosted display typography, a 75-entry finishes catalog laid out as an image-driven bento, property gallery, and lead capture.</p>
      <a class="btn" href="https://lerevebocaraton.com" target="_blank" rel="noopener">Visit site ↗</a>
    </div>
    <aside class="case-meta" data-reveal>
      <div>
        <h3>Stack</h3>
        <ul>
          <li>Next.js 16 · TypeScript</li>
          <li>Tailwind CSS v4</li>
          <li>Roquila · Avenir Next</li>
          <li>Resend</li>
          <li>Vercel</li>
        </ul>
      </div>
      <div>
        <h3>Role</h3>
        <ul><li>Design · build · maintenance</li></ul>
      </div>
    </aside>
  </div>
</main>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"></script>
<script src="../../assets/js/chrome.js"></script>
<script src="../../assets/js/motion.js"></script>
</body>
</html>
```

- [ ] **Step 3: Verify**

Open both `http://localhost:8080/projects/casa-avenida/` and `.../le-reve/`. Pass:
- Chrome injects correctly at depth 2 (monogram loads, lockup links back to home)
- "Projects" nav item underlined; hero image renders; sections reveal on scroll
- 375px width: meta column stacks below body text
- No console errors

- [ ] **Step 4: Commit**

```bash
git add projects && git commit -m "feat: Casa Avenida and Le Reve case studies"
```

---

### Task 11: Full-site verification pass

- [ ] **Step 1: Walk every page at three widths**

375 / 768 / 1280 px: homepage + both case studies. Pass criteria:
- No horizontal scrollbars, no overlapping text, tap targets ≥40px on mobile
- Fonts render (Fraunces serif visible in headings — if a heading shows Georgia, the Google Fonts link is wrong)
- Keyboard: Tab reaches every tile/link, focus ring visible (sky outline)

- [ ] **Step 2: Reduced-motion + no-JS pass**

- DevTools emulate `prefers-reduced-motion: reduce` → no animation anywhere, all content visible
- Disable JavaScript → pages show content (no masthead/footer is acceptable; content must not be hidden)

- [ ] **Step 3: Fix anything found, commit**

```bash
git add -A && git commit -m "fix: verification pass findings"
```

(Skip the commit if nothing was found.)

---

### Task 12: Deploy to GitHub Pages

- [ ] **Step 1: Switch gh account and create repo**

```bash
gh auth switch --user mattbloom1
gh auth status
```

Pass: `mattbloom1` is the active account.

```bash
gh repo create mattbloom1.github.io --public --source . --remote origin --push
```

- [ ] **Step 2: Confirm Pages is serving**

For `<user>.github.io` repos, Pages auto-enables on `main`. Wait ~2 minutes, then:

```bash
curl -sI https://mattbloom1.github.io | head -1
```

Expected: `HTTP/2 200`. If 404 persists after 5 minutes: `gh api repos/mattbloom1/mattbloom1.github.io/pages -X POST -f "source[branch]=main" -f "source[path]=/"` then re-check (or enable via repo Settings → Pages → Deploy from branch → main).

- [ ] **Step 3: Verify live site**

Open `https://mattbloom1.github.io` in a real browser: homepage renders identically to local, both case studies reachable, monogram draws, screenshots load.

- [ ] **Step 4: Tag the milestone**

```bash
git tag plan-1-foundation && git push origin plan-1-foundation
```

---

## Self-review notes

- **Spec coverage (Plan 1 scope):** repo/structure ✓, tokens ✓, chrome ✓, motion (entrance/monogram/parallax/reveal/page-fade via CSS `page-in`) ✓, bento with fallback tiles ✓, case studies ✓, deploy ✓. Ambient pointer wash intentionally deferred to the final polish pass (spec: "build last, keep deletable"). Tools/photos/icons routes intentionally absent — Plans 2–6.
- **Grid math:** 2×2 + 2 + 2 + 1 + 1 + 1 + 1 + 2 + 2 = 16 cells = 4 full rows at 4 columns. No empty cells.
- **Type consistency:** `data-root`/`data-nav` contract used identically in chrome.js and all three pages; `data-enter`/`data-reveal` match motion.js selectors; `.tile.has-img` caption gradient matches markup order (img div before cap div).
