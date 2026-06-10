# Portfolio Site — Design Spec

**Date:** 2026-06-10
**Status:** Approved by Matt (brainstorming session 2026-06-10)
**Project root:** `C:\Users\Matthew Bloomdield\Desktop\Portfolio`

## Purpose

One site that is equally:

1. A public showcase of Matt Bloomfield's design/dev work for The GVC Team — linkable from a resume or sent to clients.
2. The daily entry point to the working tools (showsheet generator, map studio, floorplan converter, calculator, photo galleries, icon library).

## Decisions (locked during brainstorming)

| Decision | Choice |
|---|---|
| Hosting | GitHub Pages, repo `mattbloom1/mattbloom1.github.io`, served from `main`, root URL |
| Stack | Build-less static HTML/CSS/JS. No framework, no bundler. GSAP via CDN. `.nojekyll` at root |
| Visual direction | "GVC Editorial" — light paper editorial structure (from the Photo Editing page) re-inked in GVC brand colors |
| Serif | Fraunces (display) |
| Sans | Nunito Sans 800/900 all-caps tracked for labels/buttons/section heads; Raleway for body |
| Mono | JetBrains Mono (data/meta) |
| Homepage layout | Bento grid |
| Identity | Hybrid masthead lockup: "Matt Bloomfield" + "for The GVC Team" + GVC monogram |
| Restyle depth | Full restyle — tools' actual UIs adopt the design system |
| Map tools | 3D Address Map Builder + Pin Studio merge into ONE tool ("Map Studio") |
| Floorplan | Port the Python converter to in-browser JavaScript |
| Icons | Browsable public icon library + pipeline case study (copyright cleared by Matt; book scanning is ongoing — library must regenerate easily) |
| Copy rule | No AI-slop filler: headings name the actual thing, labels carry real data only, no taglines/mottos |

## Design system (`/assets/`)

### Tokens (`assets/css/tokens.css`)

- `--paper: #EFEDE8` — page background (GVC-cooled paper)
- `--paper-2` — slightly darker wells/cards (derive during build, ~`#E7E4DC`)
- `--ink: #00273A` — GVC Navy. All text on paper
- `--sky: #53C7DC` — primary accent: hairlines, hovers, active states. Never body text
- `--cyan: #00A1C4` — secondary accent: mono meta-text, links. Sparingly
- `--bone: #E5E5E5` — text/elements on navy blocks
- `--rule` — hairline borders (~`#D3D4D0`)
- Type families as above; one shared easing token (`cubic-bezier(0.2,0.8,0.2,1)`) and duration scale
- GVC color-block accent (navy block + sky hairline) is the signature section treatment, used on navy tiles and section breaks

### Shared chrome (`assets/js/chrome.js`)

- Injects masthead + footer into every page from one definition
- Masthead: lockup left (Fraunces "Matt Bloomfield", mono "for The GVC Team", GVC monogram SVG), nav right (Tools · Photos · Icons · Projects), mono caps, sky hover underline
- Footer: contact, GitHub links (both accounts), GVC attribution. Real info only
- Logos copied from `Showsheet Generator/GVC_SVG_LOGO COLLECTION/` into `/assets/logos/`

### Motion (`assets/js/motion.js`, GSAP CDN)

- All effects respect `prefers-reduced-motion: reduce` (CSS + JS gate)
- Bento: staggered entrance on load; hover lift; pointer-parallax on tile imagery
- Masthead monogram draws itself (SVG stroke-dash) on first load per session
- Icon library: staggered grid entrance, glyph scale on hover
- Floorplan tool: converted plan draws in with stroke-dash line animation (showpiece)
- Page-fade transitions between internal pages
- Optional ambient: subtle pointer-reactive sky-blue light wash behind the homepage bento — built so it can be deleted by removing one element/script. No other WebGL

## Site map & per-project scope

```
/                       homepage — masthead + bento (8 tiles) + footer, nothing else
/tools/showsheet/       Showsheet Generator (restyle)
/tools/floorplan/       Floorplan Converter (new JS port)
/tools/map-studio/      Map Studio (merge + restyle)
/tools/calculator/      Feet & Inches Calculator (restyle)
/photos/                gallery index + 13 property pages (restyle + optimized images)
/icons/                 icon library browser (new)
/projects/casa-avenida/ case study
/projects/le-reve/      case study
/scripts/               Python content scripts (not served; run manually)
```

### Homepage bento (8 tiles)

| Tile | Size | Opens | Content |
|---|---|---|---|
| Photo Editing | large (2×2) | `/photos/` | real edited property photo |
| Icon Library | wide | `/icons/` | strip of actual icons + live count |
| Map Studio | 1×1 | tool | static map render thumbnail |
| Showsheet Generator | 1×1 | tool | showsheet thumbnail |
| Floorplan Converter | 1×1 | tool | converted plan line art |
| Feet & Inches Calculator | 1×1 | tool | type-set glyph treatment |
| Casa Avenida | wide | case study | site screenshot |
| Le Rêve | wide | case study | site screenshot |

Tool tiles open the tool directly (launcher behavior). Website tiles open case studies (external "Visit ↗" inside). Tools do NOT get separate case-study pages — each tool page carries a one-paragraph "About this tool" block in its footer chrome.

### Showsheet Generator (restyle)

- Source: `Desktop/Showsheet Generator/GVC Showsheet Generator.html` (~381 KB single file)
- Swap fonts/colors/chrome to design system; zero functional change to generation logic
- Output documents (the generated showsheets) are GVC marketing assets — their internal design is NOT part of this restyle; only the tool UI around them

### Photo Editing (restyle + publish)

- Source: `Desktop/Personal Photo Editing Project/` — `index.html`, 13 kebab-case property page folders, `properties.json`, `generate.py`, `server.py`
- Property pages reference full-res images in the spaced source folders (1.8 GB total) — cannot be committed as-is
- Work: (1) restyle index + property template to the system (it is already the style source — mostly token/font swap + shared chrome); (2) update the templates inside `generate.py` so regenerated pages keep the unified look; (3) pages reference web-optimized copies produced by `build_photos.py`
- `server.py` is local-dev only; published site is fully static

### Floorplan Converter (new)

- Port `cubicasa_to_gvc.py` (718 lines, lxml SVG→SVG transformation) to browser JS using DOMParser/XMLSerializer
- UI: drop zone → side-by-side before/after SVG preview → download converted file
- Conversion must be verified against the Python output on `333 E43 417.svg` (the sample in the project folder) — byte-identical output is not required, but visually/structurally equivalent output is
- The Python script remains the desktop tool; the web port must not modify it

### Map Studio (merge + restyle)

- Sources: `Desktop/mapbox/3D-Address-Map-Builder.html` + `pin-studio.html`
- Pin Studio currently outputs `PIN` / `PIN_NORM` / `PIN_OUT` spec objects pasted into the Map Builder source by hand. Merge: pin designer becomes a collapsible panel inside Map Studio; edits update map pins live
- Restyle chrome to the unified light system; the map canvas itself stays dark (it's a map style, not chrome)
- Mapbox token: user-pasted at runtime (existing behavior), persisted to localStorage for convenience. No token committed
- Keep existing capabilities: address list → geocode → 3D tilted map, labels, auto-rotate, outlier handling, labeled static-image export

### Feet & Inches Calculator (restyle)

- Source: `Desktop/SizeCalculator/calculator.html`. Re-skin to system; logic untouched

### Icon Library (new)

- Source: `Desktop/Icons/output/` — named SVGs + `index.csv` (71 icons now, ~3,250 eventually; Matt scans more over time)
- `/icons/` page: search-as-you-type over names, responsive glyph grid, click = copy SVG markup + download link, count shown from data
- Short pipeline case-study section below the grid (scan → red grid → crop → vectorize), using real pipeline imagery
- Data flow: `build_icons.py` copies SVGs into `/icons/library/` and emits `icons.json`; page renders purely from `icons.json` — adding pages later is script-run + push

### Casa Avenida / Le Rêve (case studies)

- Factual one-screen case studies: hero screenshot, what it is, stack list, role, "Visit site ↗"
- Screenshots captured from the live sites during implementation
- No code from those repos is touched

## Content scripts (`/scripts/`, Python, manual)

- `build_photos.py` — reads source property folders (path in a config block at top), resizes to max ~2000 px long edge, recompresses (JPEG/WebP ~80–85 q), writes into `/photos/`. Target: full photo set under ~150 MB committed
- `build_icons.py` — reads icons `output/` path, writes `/icons/library/*.svg` + `/icons/icons.json`
- Both idempotent: safe to re-run after content changes; outputs are committed to the repo

## Error handling

- Tools are client-side only; failures must surface in-UI (e.g., floorplan parse errors show a readable message naming the problem, not a silent fail)
- Map Studio: geocoding failures listed per-address (existing behavior preserved)
- Icon search with no matches: show "no icons match" state with the query
- Missing tile imagery: tiles render with navy color-block fallback, never broken-image icons

## Testing / verification

- Floorplan port: compare JS output against Python output for the sample SVG (structure, layer names, colors, geometry) before the Python path is considered "ported"
- Each restyled tool: manual functional pass — showsheet generates, calculator computes, map builds/exports — before and after restyle
- Pages checked at 375 px, 768 px, 1280 px widths
- Lighthouse sanity pass on homepage and photos index (image weight is the main risk)

## Out of scope

- Custom domain (possible later; root-URL repo keeps paths stable)
- Restyling the generated showsheet documents themselves
- Any changes to the Casa Avenida / Le Rêve codebases
- Automating the icon scanning pipeline
- CMS/build framework of any kind

## Open items (non-blocking)

- `gh auth switch` to mattbloom1 at deploy time; repos for other projects stay where they are
- Le Rêve live URL to confirm from its repo at case-study time
- Optional ambient homepage wash: build last, keep deletable
