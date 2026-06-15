# Plan 2: Showsheet Generator + Feet & Inches Calculator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Showsheet Generator (priority) and Feet & Inches Calculator as restyled, fully functional tools on the live portfolio at `/tools/showsheet/` and `/tools/calculator/`.

**Architecture:** Both tools are self-contained single-file HTML apps with zero backend dependencies. Each is copied into `tools/<name>/index.html`, integrated with the shared chrome (tokens/base/components CSS + chrome.js masthead/footer + motion.js), and re-inked to the GVC Editorial design system. **The showsheet's generated sheets are GVC marketing assets — their design (everything rendered inside `.sheet`) is NOT restyled; only the tool UI around them.** Generation/calculation logic is never modified.

**Tech Stack:** HTML/CSS/vanilla JS (build-less), GSAP 3 CDN, mammoth@1.8.0 + qrcode-generator@1.4.4 CDN (showsheet only), Playwright (verification only), Pillow (thumbnail only).

**Spec:** `docs/superpowers/specs/2026-06-10-portfolio-site-design.md` (sections: Showsheet Generator, Feet & Inches Calculator, Homepage bento, site map)

**Source facts (verified 2026-06-12):**
- Showsheet: `C:\Users\Matthew Bloomdield\Desktop\Showsheet Generator\GVC Showsheet Generator.html` — 1405 lines, 372 KB, self-contained. `<style>` lines 12–326, `@page` style line 327, main `<script>` lines 493–1403. Headshots are inline base64 in the `ROSTER` array (no file deps). localStorage key `gvc-showsheet-current-v1`. Hidden file inputs: `#docxFile` (.docx), `#phFile` (image), `#fpFile` (image). Layout: `#app` grid (430px sidebar + 1fr) at `height:100vh; overflow:hidden`. Print: `@media print` block (lines 313–325) hides `#quickBar,#editor,#stageBar,#toasts,#warnOverlay,.pg-tag`; `#btnPrint` calls `window.print()`. Playfair Display is confined to sheet-canvas selectors (`.addr`, `.ag-card .an`); Nunito Sans/Raleway are shared by editor UI and sheet.
- Calculator: `C:\Users\Matthew Bloomdield\Desktop\SizeCalculator\calculator.html` — 380 lines, 10.3 KB, self-contained, no CDN deps, no localStorage. `<style>` lines 6–183, `<script>` lines 221–377 (logic — never modify). Key ids: `#modeSwitch`, `#rows`, `#addBtn`, `#clearBtn`, `#total`, `#totalInches`, `#totalDecimal`; row inputs have classes `feet`/`inches`. Currently dark-themed with system fonts.
- Neither source project is modified by this plan. The portfolio copies become the canonical web versions.

---

## File structure (created/modified by this plan)

```
Portfolio/
├── tools/
│   ├── showsheet/index.html        copied + chrome-integrated + UI restyled
│   └── calculator/index.html       copied + chrome-integrated + UI restyled
├── assets/
│   ├── css/
│   │   ├── base.css                modify: .mast-nav row-gap (tap-target clearance)
│   │   └── components.css          modify: add .tool-about, .tile-glyph
│   ├── js/chrome.js                modify: NAV gains Tools entry
│   └── img/tile-showsheet.webp     new homepage tile thumbnail
├── index.html                      modify: showsheet + calculator tiles become <a>
└── docs/superpowers/plans/2026-06-12-plan-2-showsheet-calculator.md   this plan
```

**Verification model:** No JS test framework. Each task ends with a browser/scripted verification against `python -m http.server 8080` (or the `portfolio` launch.json server) with explicit pass criteria, then a commit. The showsheet functional check uses a Playwright script (file-input automation isn't possible via preview tools).

---

### Task 1: Copy showsheet, baseline functional verification (unrestyled)

**Files:**
- Create: `tools/showsheet/index.html` (verbatim copy)

- [x] **Step 1: Copy the file**

```bash
mkdir -p tools/showsheet
cp "/c/Users/Matthew Bloomdield/Desktop/Showsheet Generator/GVC Showsheet Generator.html" tools/showsheet/index.html
```

Do NOT modify the source project, now or in any later task.

- [x] **Step 2: Build the verification harness (reused in Tasks 3 and 5)**

Create scratch folder `_verify/` at repo root (it is throwaway — deleted before every commit):

```bash
mkdir -p _verify && cd _verify && npm init -y && npm i playwright@1.53 && cd ..
```

(Chromium was installed by Plan 1 Task 9; if `npx playwright install chromium --dry-run` says missing, run `cd _verify && npx playwright install chromium`.)

Create `_verify/showsheet-check.mjs`:

```js
// Usage: node _verify/showsheet-check.mjs <abs-path-to-example.docx> [urlPath]
import { chromium } from 'playwright';
const docx = process.argv[2];
const urlPath = process.argv[3] || '/tools/showsheet/';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push(String(e)));
await page.goto('http://localhost:8080' + urlPath);
await page.waitForTimeout(2000);
await page.setInputFiles('#docxFile', docx);
await page.waitForTimeout(3000);
const addr = (await page.textContent('.addr'))?.trim() || '';
await page.setInputFiles('#phFile', 'assets/img/tile-photo.jpg');
await page.waitForTimeout(1500);
await page.screenshot({ path: '_verify/showsheet-state.png' });
await browser.close();
console.log('sheet address:', JSON.stringify(addr));
console.log('console errors:', errors.length ? errors : 'none');
if (!addr) { console.error('FAIL: .addr empty after docx load'); process.exit(1); }
if (errors.length) { console.error('FAIL: console errors'); process.exit(1); }
console.log('PASS');
```

- [x] **Step 3: Run the baseline check**

List `C:\Users\Matthew Bloomdield\Desktop\Showsheet Generator\Example Property Info Docs\` and pick any one `.docx`. Serve the repo root on :8080, then:

```bash
node _verify/showsheet-check.mjs "C:\Users\Matthew Bloomdield\Desktop\Showsheet Generator\Example Property Info Docs\<CHOSEN>.docx"
```

Pass: prints a non-empty sheet address and `PASS`, zero console errors. Read `_verify/showsheet-state.png` — the sheet preview must show the address, price area, and the dropped photo. This is the functional baseline the restyle must preserve.

- [x] **Step 4: Commit (the tool copy only — never commit `_verify/`)**

```bash
echo "_verify/" >> .gitignore
git add .gitignore tools/showsheet/index.html
git commit -m "feat: showsheet generator (verbatim copy, baseline verified)"
```

---

### Task 2: Chrome integration (masthead/footer/nav) on the showsheet page

**Files:**
- Modify: `tools/showsheet/index.html` (head + body shell only — not the tool UI styles yet, not the script)
- Modify: `assets/js/chrome.js` (NAV)
- Modify: `assets/css/base.css` (one line)

- [x] **Step 1: Update chrome.js NAV**

In `assets/js/chrome.js`, replace the NAV array (keep the growth comment, minus tools):

```js
  // Add entries here as sections ship: ["photos","Photos","photos/"], ["icons","Icons","icons/"]
  const NAV = [
    ["home", "Home", ""],
    ["tools", "Tools", "tools/showsheet/"],
    ["projects", "Projects", "projects/casa-avenida/"],
  ];
```

("Tools" points at the showsheet until more tools/an index exist — same placeholder pattern as "Projects".)

- [x] **Step 2: Tap-target row clearance in base.css**

The ≤640px media block in `assets/css/base.css` contains the masthead rules with the `::after` tap-target extensions (40px tall — they need ≥24px row gap if the nav ever wraps). Inside that same `@media (max-width:640px)` block, after the existing `.mast-nav` rule, add:

```css
  .mast-nav{row-gap:24px}
```

(Append it to the existing `.mast-nav{gap:14px}` declaration — `gap:14px; row-gap:24px` — or as a separate later rule; later-wins ordering matters, same gotcha as the footer row-gap fix in Plan 1 Task 11.)

- [x] **Step 3: Rework the showsheet page head**

In `tools/showsheet/index.html`, replace lines 4–11 (meta/title/fonts/CDN scripts stay, but title changes, favicon + portfolio CSS links are added, and the fonts URL is merged to include the portfolio families). The head becomes:

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Showsheet Generator — Matt Bloomfield</title>
<meta name="description" content="Print-ready A5 listing showsheets for The GVC Team: drop a listing doc, photo, and floorplan; data is extracted and laid out for two-sided print.">
<link rel="icon" href="../../assets/logos/monogram.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300&family=JetBrains+Mono&family=Nunito+Sans:opsz,wght@6..12,200..1000&family=Playfair+Display:ital,wght@0,400..800;1,400..800&family=Raleway:ital,wght@0,300..800;1,300..800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../../assets/css/tokens.css">
<link rel="stylesheet" href="../../assets/css/base.css">
<link rel="stylesheet" href="../../assets/css/components.css">
<script src="https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js"></script>
```

Portfolio CSS loads BEFORE the tool's inline `<style>` so the tool's own rules win every conflict. Playfair Display and the full Nunito Sans/Raleway ranges are kept for the sheet canvas.

- [x] **Step 4: Body shell changes**

1. `<body>` → `<body data-root="../../" data-nav="tools">`
2. Wrap `<div id="app">…</div>` in `<main>` and add a hidden h1 as its first child:
   ```html
   <main>
   <h1 class="visually-hidden">Showsheet Generator</h1>
   <div id="app">…(unchanged)…</div>
   </main>
   ```
3. In the tool's `<style>`, change the `#app` rule's `height:100vh` to `height:calc(100vh - var(--mast-h))` (the sticky masthead owns the top 64px; `--mast-h` comes from tokens.css).
4. In the tool's `@media print` block, extend the hide list:
   `#quickBar,#editor,#stageBar,#toasts,#warnOverlay,.pg-tag` → `#quickBar,#editor,#stageBar,#toasts,#warnOverlay,.pg-tag,.masthead,.site-foot,.tool-about`
5. At the end of body, after the tool's main `</script>`, add:
   ```html
   <script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"></script>
   <script src="../../assets/js/chrome.js"></script>
   <script src="../../assets/js/motion.js"></script>
   ```

- [x] **Step 5: Verify**

Serve :8080. Check `http://localhost:8080/tools/showsheet/` with preview tools AND re-run the Task 1 functional script (`node _verify/showsheet-check.mjs <same docx>`). Pass:
- Masthead injected, monogram draws, "Tools" nav item has the sky underline (aria-current); footer renders below the app (scroll down)
- Tool fills the viewport minus masthead — no vertical scrollbar caused by `#app` itself, no clipped `#stageBar`
- Functional script prints `PASS` (docx populates, photo drops, zero console errors)
- Print preview (`page.emulateMedia({media:'print'})` screenshot via a 5-line variant of the script, or browser print preview): shows ONLY the two sheets — no masthead/footer/editor
- Homepage: nav now shows Home/Tools/Projects on all existing pages (check `/` and one case page)
- At 375px: masthead intact, no horizontal scroll from the chrome (the tool app itself is desktop-first per its PRODUCT.md — a horizontally scrollable `#app` at 375px is ACCEPTED; the chrome must not break)

- [x] **Step 6: Commit**

```bash
git add tools/showsheet/index.html assets/js/chrome.js assets/css/base.css
git commit -m "feat: showsheet chrome integration (masthead, Tools nav, print isolation)"
```

---

### Task 3: Restyle the showsheet tool UI (sheets untouched)

**Files:**
- Modify: `tools/showsheet/index.html` (`<style>` block only — the `<script>` block, lines ~493–1403, must not change)

- [x] **Step 1: Establish the boundary**

Everything rendered INSIDE `.sheet` (and `.sheet-wrap`) is sheet design — **do not touch it**: this includes `.addr`, `.ag-card`, `.scell`, `.r-spec`, `.r-feat`, `.r-note`, `.pg-col` print/layout rules, the `@media print` block (beyond what Task 2 added), the `@page` rule, and the `--bleed` machinery. Tool UI is everything else: `#quickBar`, `#editor` (all `.field`, `.chip`, `.btn`, section styles), `#stage` background, `#stageBar`, `#toasts`, drop zones, scrollbars.

- [x] **Step 2: Re-ink the token block**

The tool's `:root` (lines ~18–25) keeps the sheet palette (`--navy --sky --sky2 --ow`, `--serif` Playfair, `--sans`, `--body`, `--bleed`, `--hairline` — sheets use them) and the editor surface tokens change to the system:

```css
:root{
  --navy:#00273A; --sky:#53C7DC; --sky2:#00A1C4; --ow:#E5E5E5;
  --page:#EFEDE8;            /* editor bg: was #F4F6F8, now GVC paper */
  --hairline:rgba(83,199,220,.55);
  --bleed:0in;
  --serif:'Playfair Display','Superior Title',Georgia,serif;  /* SHEET serif — stays */
  --sans:'Nunito Sans','Segoe UI',sans-serif;
  --body:'Raleway','Segoe UI',sans-serif;
  /* tool-UI tokens (mirror the portfolio system) */
  --ui-paper-2:#E7E4DC; --ui-rule:#D3D4D0; --ui-ink-soft:#33525F;
  --ui-display:'Fraunces',Georgia,serif; --ui-mono:'JetBrains Mono',ui-monospace,monospace;
}
```

- [x] **Step 3: Restyle the editor chrome to GVC Editorial**

Re-ink the tool-UI selectors to the light paper system. Constraints (this is craft work — the executor styles within these rules, matching the portfolio's established feel):
- Surfaces: editor sidebar + quick bar on `--page` paper / white cards with `--ui-rule` hairline borders and 8px radii (match the portfolio `.tile`/`.case-meta` feel); `#stage` (preview well) may go `--ui-paper-2`. Kill any remaining dark/navy UI panels — navy stays only as text/active-state color (`--navy` is the ink)
- Type: section labels/buttons → Nunito Sans 800 caps tracked (`.t-label` treatment: 11px, letter-spacing .18–.22em); form labels small caps `--sans`; inputs `--body`; any meta/counters → `--ui-mono` 10–11px. NO Fraunces inside the editor controls (Fraunces is page-chrome display only); Playfair remains exclusively in the sheet
- Accents: focus rings + active states sky (`--sky` outline, like the portfolio `:focus-visible`); primary action buttons follow the portfolio `.btn` pattern (pill, 1px ink border, hover ink bg + bone text); destructive actions keep a muted brick red `#8C3A2B`
- Inputs: white bg, `--ui-rule` 1px border, `--navy` text, sky `:focus-visible` outline; placeholder `--ui-ink-soft`
- Contrast: every text/bg pair ≥4.5:1 (the tokens above all clear it on paper/white; `--sky` is never body text)
- Do not rename ids/classes, do not reorder DOM, do not touch the `<script>` block

- [x] **Step 4: Functional re-verification**

Re-run: `node _verify/showsheet-check.mjs <same docx>` → must print `PASS`. Read `_verify/showsheet-state.png` and compare against the Task 1 baseline screenshot: **the rendered sheets must be pixel-equivalent in design** (same fonts, colors, layout — Playfair address, navy/sky sheet palette); only the surrounding editor chrome looks different. Also click-test in preview tools: expand/collapse an editor section, toggle a chip, zoom buttons in `#stageBar` work.

- [x] **Step 5: Commit**

```bash
git add tools/showsheet/index.html
git commit -m "feat: restyle showsheet editor chrome to GVC Editorial (sheets untouched)"
```

---

### Task 4: About block, homepage showsheet tile, og tags

**Files:**
- Modify: `tools/showsheet/index.html`, `assets/css/components.css`, `index.html`
- Create: `assets/img/tile-showsheet.webp`

- [x] **Step 1: Add .tool-about styles to components.css**

After the case-study section in `assets/css/components.css`:

```css
/* ---------- tool pages ---------- */
.tool-about{padding:28px var(--pad-x);border-top:1px solid var(--rule)}
.tool-about p{max-width:62ch;margin-top:10px;font-weight:400}
```

- [x] **Step 2: Add the About block to the showsheet page**

Inside `<main>`, after `</div>` closing `#app`:

```html
<section class="tool-about">
  <span class="t-label">About this tool</span>
  <p>Generates print-ready A5 listing showsheets for The GVC Team. Drop a listing .docx, a photo, and a floorplan — building and unit data are extracted automatically and laid out on a two-sided sheet for print. Everything runs in the browser; nothing is uploaded.</p>
</section>
```

(Task 2 already added `.tool-about` to the print-hide list.)

- [x] **Step 3: Capture the tile thumbnail**

With the restyled tool serving on :8080, screenshot it at 1440×900 (Playwright from `_verify/`, same pattern as the check script but just `page.screenshot({path:'showsheet-raw.png'})` after a 3s settle — load the SAME example docx + photo first so the preview shows a real sheet, not an empty state). Convert with a one-off Pillow script (delete after): thumbnail ≤1000px, WEBP quality 80 → `assets/img/tile-showsheet.webp`. Pass: file exists, ≤300 KB, legible at a glance.

- [x] **Step 4: Convert the homepage tile**

In `index.html`, replace the Showsheet Generator navy `<div>` tile with:

```html
    <!-- Showsheet Generator: 1×1, live tool -->
    <a class="tile has-img" href="tools/showsheet/" data-enter>
      <div class="tile-img"><img src="assets/img/tile-showsheet.webp" alt="" loading="lazy"></div>
      <div class="tile-cap">
        <span class="t-mono">Tool</span>
        <span class="tile-name">Showsheet Generator</span>
      </div>
    </a>
```

Judgment call: view the tile at 1280px — if the center crop hides what makes it recognizable (sheet preview), add the existing `crop-top` class. Grid math is unchanged (still a 1×1 cell; 16 cells total).

- [x] **Step 5: og tags on the tool page**

In the showsheet head, after the meta description (same pattern as the case pages):

```html
<meta property="og:title" content="Showsheet Generator — Matt Bloomfield">
<meta property="og:description" content="Print-ready A5 listing showsheets for The GVC Team: drop a listing doc, photo, and floorplan; data is extracted and laid out for two-sided print.">
<meta property="og:image" content="https://mattbloom1.github.io/assets/img/tile-showsheet.webp">
<meta property="og:url" content="https://mattbloom1.github.io/tools/showsheet/">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
```

- [x] **Step 6: Verify and commit**

Preview: homepage shows the showsheet thumbnail tile, clicking navigates to the tool; About block renders above the footer on the tool page; zero console errors anywhere; tile renders sensibly at 375/768/1280.

```bash
git add tools/showsheet/index.html assets/css/components.css assets/img/tile-showsheet.webp index.html
git commit -m "feat: showsheet about block, homepage tile, og tags"
```

---

### Task 5: Showsheet verification pass + DEPLOY (showsheet goes live)

- [x] **Step 1: Full pass on the tool page**

- 1280/768: tool usable, chrome intact, no overlap. 375: chrome intact, no chrome-caused horizontal scroll (tool app itself may scroll — accepted)
- Print check via Playwright `emulateMedia({media:'print'})` screenshot: only sheets visible
- Functional script one final time: `PASS`
- Keyboard: tab reaches nav, editor inputs, stage buttons, footer; sky focus ring visible
- No-JS: fetch raw HTML — form markup present (tool legitimately requires JS to function; chrome-less static content is the accepted floor)
- localStorage round-trip: fill a field, reload, field persists

- [x] **Step 2: Fix anything found, then delete the scratch folder and deploy**

```bash
rm -rf _verify
git add -A && git commit -m "fix: showsheet verification findings"   # skip if nothing found
git push
```

- [x] **Step 3: Verify LIVE**

- `curl -sI https://mattbloom1.github.io/tools/showsheet/` → 200 (allow ~2 min for Pages build; check `gh api repos/mattbloom1/mattbloom1.github.io/pages/builds/latest` → built)
- curl the live HTML: contains `id="app"` and the og:image tag
- Live homepage: showsheet tile thumbnail loads (curl -sI the webp → 200)

**The showsheet is now live — the priority milestone.**

---

### Task 6: Copy calculator, baseline check

**Files:**
- Create: `tools/calculator/index.html` (verbatim copy)

- [x] **Step 1: Copy**

```bash
mkdir -p tools/calculator
cp "/c/Users/Matthew Bloomdield/Desktop/SizeCalculator/calculator.html" tools/calculator/index.html
```

- [x] **Step 2: Baseline functional check (preview tools, no Playwright needed)**

Serve :8080, open `/tools/calculator/`, then via preview_eval:

```js
(() => {
  const r1 = document.querySelector('#rows .row:first-child');
  r1.querySelector('input.feet').value = '5';
  r1.querySelector('input.inches').value = '3';
  r1.querySelector('input.feet').dispatchEvent(new Event('input', {bubbles:true}));
  r1.querySelector('input.inches').dispatchEvent(new Event('input', {bubbles:true}));
  return { total: document.getElementById('total').textContent,
           inches: document.getElementById('totalInches').textContent };
})()
```

Pass: total `5' 3"`, inches `63 inches`. Then add `2` ft `10` in to row 2 the same way → total `8' 1"`, `97 inches`. Click the Subtract button in `#modeSwitch`, re-check → `2' 5"`, `29 inches`. Zero console errors.

- [x] **Step 3: Commit**

```bash
git add tools/calculator/index.html
git commit -m "feat: feet & inches calculator (verbatim copy, baseline verified)"
```

---

### Task 7: Calculator chrome integration + restyle

**Files:**
- Modify: `tools/calculator/index.html` (head, body shell, `<style>` lines ~6–183; the `<script>` block lines ~221–377 must not change)

- [x] **Step 1: Replace the head**

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Feet &amp; Inches Calculator — Matt Bloomfield</title>
<meta name="description" content="Adds and subtracts measurements in feet and inches, with totals in feet-and-inches, total inches, and decimal feet.">
<link rel="icon" href="../../assets/logos/monogram.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300&family=Nunito+Sans:wght@800;900&family=Raleway:wght@300;400;500&family=JetBrains+Mono&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../../assets/css/tokens.css">
<link rel="stylesheet" href="../../assets/css/base.css">
<link rel="stylesheet" href="../../assets/css/components.css">
<meta property="og:title" content="Feet &amp; Inches Calculator — Matt Bloomfield">
<meta property="og:description" content="Adds and subtracts measurements in feet and inches, with totals in feet-and-inches, total inches, and decimal feet.">
<meta property="og:url" content="https://mattbloom1.github.io/tools/calculator/">
<meta property="og:type" content="website">
```

(No og:image — this tool's tile is typographic, there is no meaningful image. summary_large_image card is omitted for the same reason.)

- [x] **Step 2: Body shell**

```html
<body data-root="../../" data-nav="tools">
<main class="page">
  <div class="page-head" data-reveal>
    <h1>Feet &amp; Inches Calculator</h1>
    <span class="t-mono">Tool · Add and subtract measurements</span>
  </div>
  <div class="app">…existing .app children, minus the old <h1> and .subtitle (the page-head replaces them; keep the subtitle's instructional text as a small .t-mono line above the panel: "Tab to move between fields — a new row appears automatically.")…</div>
  <section class="tool-about">
    <span class="t-label">About this tool</span>
    <p>Adds and subtracts measurements in feet and inches. Totals show as feet-and-inches, total inches, and decimal feet. Built for checking furniture and floorplan dimensions quickly.</p>
  </section>
</main>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"></script>
<script src="../../assets/js/chrome.js"></script>
<script src="../../assets/js/motion.js"></script>
<script>…existing calculator script, unchanged…</script>
</body>
```

NOTE: keep the calculator's own `<script>` LAST and unchanged. The old `<h1>`/`.subtitle` removal must not break the script (it only references ids/classes listed in the source facts — verify with a grep for `subtitle` in the script block before deleting; if referenced, keep the element hidden instead).

- [x] **Step 3: Restyle the `<style>` block**

Delete the dark-theme `:root` and re-ink (logic-neutral, full re-skin):
- Remove `body` rules entirely (base.css now owns body: paper bg, Raleway, ink) and `* {box-sizing}` (base.css has it)
- `.app`: max-width 560px, margin `40px auto 0`, no flex-centering tricks
- `.panel` and `.result`: white cards, 1px `var(--rule)` border, 8px radius (the portfolio card feel)
- Mode switch: pill buttons in Nunito Sans 800 caps 11px tracked; active Add = `var(--ink)` bg / `var(--bone)` text; active Subtract = `#8C3A2B` bg / `var(--bone)` text; inactive = transparent with 1px ink border (the `.btn` ghost feel)
- Inputs: white bg, `var(--rule)` border, ink text, `:focus-visible` sky outline; row numbers + "Feet/Inches" headers in `.t-mono` treatment (JetBrains Mono 10–11px caps, `var(--ink-soft)`)
- Remove button (×): `#8C3A2B`, hover fills
- `.result-main` (the big total): JetBrains Mono, ~clamp(32px,6vw,44px), ink; `.result-label` Nunito Sans 800 caps; `.result-secondary` mono 11px `var(--ink-soft)`
- All text/bg pairs ≥4.5:1; do not rename any id/class the script uses (`#modeSwitch #rows #addBtn #clearBtn #total #totalInches #totalDecimal`, `.feet`, `.inches`, `.row`)

- [x] **Step 4: Verify**

Re-run the Task 6 Step 2 preview_eval checks (add 5'3" + 2'10" = `8' 1"`/`97 inches`; subtract = `2' 5"`/`29 inches`; clear-all resets; remove-row works). Plus: chrome injected, Tools nav underlined, About block present, 375px no horizontal scroll (this tool MUST be fully responsive — it's a simple column), keyboard tab order sensible, zero console errors.

- [x] **Step 5: Commit**

```bash
git add tools/calculator/index.html
git commit -m "feat: calculator chrome integration and GVC Editorial restyle"
```

---

### Task 8: Homepage calculator tile (type-set glyph treatment)

**Files:**
- Modify: `index.html`, `assets/css/components.css`

- [x] **Step 1: Add the glyph style to components.css**

After the `.tool-about` block:

```css
.tile .tile-glyph{
  position:absolute;top:2px;right:14px;z-index:0;
  font-family:var(--serif);font-style:italic;font-weight:300;
  font-size:72px;line-height:1.2;color:var(--sky);opacity:.55;
  user-select:none;pointer-events:none;
}
```

- [x] **Step 2: Convert the tile**

In `index.html`, replace the Feet & Inches Calculator navy `<div>` tile with:

```html
    <!-- Feet & Inches Calculator: 1×1, live tool -->
    <a class="tile navy" href="tools/calculator/" data-enter>
      <div class="tile-glyph" aria-hidden="true">5&prime;3&Prime;</div>
      <div class="tile-cap">
        <span class="t-mono">Tool</span>
        <span class="tile-name">Feet &amp; Inches Calculator</span>
      </div>
    </a>
```

- [x] **Step 3: Verify and commit**

Preview at 1280/768/375: glyph sits top-right of the navy tile in italic Fraunces sky, doesn't collide with the caption at any width (if it does at 375, hide it ≤560px: `@media (max-width:560px){.tile .tile-glyph{display:none}}`); tile navigates to the calculator; grid still 16 cells, no console errors.

```bash
git add index.html assets/css/components.css
git commit -m "feat: calculator homepage tile with type-set glyph"
```

---

### Task 9: Plan 2 verification pass + deploy + tag

- [x] **Step 1: Walk all pages at 375/768/1280**

Homepage, both case studies, both tools: no horizontal scroll from chrome, fonts render (Fraunces in page chrome, Playfair only inside sheets), nav consistent (Home/Tools/Projects, correct aria-current per section), focus rings, zero console errors.

- [x] **Step 2: Functional finals**

- Calculator: 5'3" + 2'10" = 8' 1" (preview_eval)
- Showsheet: load example docx via the Playwright harness (recreate `_verify/` if deleted; delete again after) → `PASS`; print emulation shows sheets only

- [x] **Step 3: Fix findings, deploy, tag**

```bash
git add -A && git commit -m "fix: plan 2 verification findings"   # skip if nothing found
git push
```

Wait for Pages build (`gh api .../pages/builds/latest` → built), then verify live:
- `curl -sI https://mattbloom1.github.io/tools/calculator/` → 200
- Live homepage tile spot-check; both tools reachable from the nav

```bash
git tag plan-2-tools && git push origin plan-2-tools
```

Append a brief "**As-built notes (Plan 2):**" bullet list at the end of this plan file recording deviations discovered during execution; commit with the tag push or as a final docs commit.

---

## Self-review notes

- **Spec coverage (Plan 2 scope):** `/tools/showsheet/` restyle ✓ (UI only, sheets explicitly excluded — spec line "Output documents… NOT part of this restyle"), `/tools/calculator/` restyle ✓ (logic untouched), homepage tiles convert div→a with showsheet thumbnail + calculator type-set glyph per the bento table ✓, NAV gains Tools ✓ (Photos/Icons are Plans 3–4), About-this-tool blocks ✓ (spec: "one-paragraph block in its footer chrome"), functional pass before AND after restyle ✓ (spec Testing section), error surfacing unchanged (tools' existing in-UI behavior preserved) ✓, 375/768/1280 checks ✓, no source-project modifications ✓.
- **Type consistency:** `data-nav="tools"` matches the NAV id "tools"; `.tool-about`/`.tile-glyph` defined in components.css before use; `--mast-h` exists in tokens.css; `crop-top` exists from Plan 1 Task 11; `.visually-hidden` exists from Plan 1 Task 8 fixes; calculator ids match the source facts; `_verify/` is gitignored in Task 1 before any other commit could catch it.
- **Print isolation:** masthead/footer/about hidden in the showsheet's print block (Task 2 Step 4.4) — the tool's print output is the deliverable and must remain exactly two A5 sheets.
- **localStorage:** key kept (`gvc-showsheet-current-v1`) — different origin from the desktop copy, no collision; spec demands zero functional change.

---

**As-built notes (Plan 2):**

- **showsheet:** portfolio CSS (tokens/base) loads *before* the tool's inline `<style>`, so the tool's own rules win where they overlap; `components.css` is deliberately NOT linked on the showsheet to avoid the `.btn` collision; chrome serif is re-asserted via `.masthead,.site-foot{--serif:'Fraunces',…}` in base.css (tool pages redefine `--serif` for their canvases, so the chrome must reclaim it); `#app` is `height:calc(100vh - var(--mast-h,64px))` with `line-height:normal` to neutralize inherited body line-height; dead `--ui-display` token removed; `--ui-danger` now aliases the system `--danger` (`--ui-danger:var(--danger)`, value-identical #8C3A2B); `.tool-about` lives in **base.css** (not components.css) precisely because the showsheet doesn't load components.css.
- **calculator:** mode buttons had `tabindex` removed and gained `role="group"` + `aria-label="Operation"` for keyboard reachability (plan requirement); the subtitle/instruction is preserved as a `.t-mono .tool-instr` line; buttons are kept tool-scoped (not forced onto the components `.btn` class) but are fully token-based (`--ink`/`--bone`/`--danger`/`--rule`/`--sky`).
- **system:** `--danger:#8C3A2B` added to `tokens.css` as a first-class system token, consumed by both the calculator (subtract pill / remove-row hover) and the showsheet (`--ui-danger` alias).
- **tiles:** the calculator homepage tile uses a type-set `5′3″` glyph (no screenshot); the showsheet tile uses a real populated-sheet thumbnail.
- **deploy (verification execution):** the initial Pages build stalled at `status:"building"` for ~9 min (`updated_at` never advanced past `created_at`, no error) and the calculator stayed 404 live; a fresh build was triggered via `POST .../pages/builds`, which completed in ~58s → `status:"built"`. After that, all live checks passed (calculator 200 with `id="rows"`/`og:url`, homepage links both tools, showsheet still 200, `tokens.css` serves `--danger:#8C3A2B`) and the live calculator computed `8' 1"`/`97 inches` (add) and `2' 5"`/`29 inches` (subtract) with zero console errors. No source/CSS findings required fixing during the verification pass — Step 1 (5 pages × 3 widths) and Step 2 (functional finals + print isolation + brick token) were clean as committed at c4782c5.
