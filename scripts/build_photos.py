#!/usr/bin/env python3
"""
Publish the real-estate photo-editing galleries from the Photo-Review source
project into this repo's photos/ section.

Reads <property>/Raw/ and <property>/Edited/ folders directly from the
Photo-Review project (no intermediate JSON, no local preview site), pairs
photos by normalized filename, optimizes each to two WebP sizes, and writes
photos/<slug>/index.html plus photos/index.html.

Idempotent: existing optimized images are skipped unless --force is passed.

Requires Pillow (see scripts/requirements.txt).

Usage:
    python scripts/build_photos.py [--force]
"""
import html
import re
import sys
from pathlib import Path

from PIL import Image, ImageOps

REPO_ROOT = Path(__file__).parent.parent
SOURCE = REPO_ROOT.parent / "Personal Photo Editing Project"
OUT = REPO_ROOT / "photos"
FORCE = "--force" in sys.argv

SKIP_FOLDERS = {"Template", "Unsure"}
SKIP_SLUGS = {"le-reve-lighting-test"}
EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
THUMB_MAX, FULL_MAX = 1100, 2000
THUMB_Q, FULL_Q = 72, 80


# ---------- filename logic ----------

def normalize(name: str) -> str:
    """Strip extension + edit/upscale markers so raw/edited filenames pair up."""
    name = Path(name).stem
    name = re.sub(r"[-_ ]*edit[-_ ]*", "", name, flags=re.IGNORECASE)
    name = re.sub(r"[-_ ]*upscaled?[-_ ]*", "", name, flags=re.IGNORECASE)
    name = re.sub(r"[_\s]+$", "", name).strip()
    name = re.sub(r"\s+", " ", name)
    return name.lower()


def slugify(name: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return s or "property"


def nice_label(raw: str) -> str:
    """Turn a filename stem into a display label, e.g. 'exam room' -> 'Exam Room'."""
    s = re.sub(r"[-_ ]*edit.*$", "", raw, flags=re.IGNORECASE)
    s = re.sub(r"[-_ ]*upscaled?.*$", "", s, flags=re.IGNORECASE).strip(" _-")
    s = re.sub(r"[-_]+", " ", s)
    return s.strip().title()


def build_pairs(raw_names, edited_names):
    """
    Pair raw/edited filenames by normalized label.

    Given the plain filenames present in a property's Raw/ and Edited/
    folders, return (photos, warnings):
      - photos: list of {"label", "raw_name", "edited_name"} dicts (either
        name may be None), sorted by normalized key.
      - warnings: one string per collision, where two files in the same
        folder normalize to the same key. The alphabetically-first name
        (by lowercased filename) is kept; the other is dropped.
    """
    warnings = []

    def build_map(names, folder_label):
        m = {}
        for name in sorted(names, key=str.lower):
            key = normalize(name)
            if key in m:
                warnings.append(
                    f'{folder_label}: "{m[key]}" and "{name}" both normalize to '
                    f'"{key}" — keeping "{m[key]}", dropping "{name}"'
                )
                continue
            m[key] = name
        return m

    raw_map = build_map(raw_names, "Raw")
    edited_map = build_map(edited_names, "Edited")

    photos = []
    for key in sorted(set(raw_map) | set(edited_map)):
        raw_name = raw_map.get(key)
        edited_name = edited_map.get(key)
        stem = Path(edited_name or raw_name).stem
        photos.append({"label": nice_label(stem), "raw_name": raw_name, "edited_name": edited_name})
    return photos, warnings


# ---------- image optimization ----------

def optimize_image(src: Path, dst: Path, max_edge: int, quality: int, force: bool = False) -> None:
    """Resize src so its longest edge is at most max_edge, save as WEBP at dst."""
    if dst.exists() and not force:
        return
    dst.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(src) as im:
        im = ImageOps.exif_transpose(im)
        if im.mode in ("RGBA", "P", "LA"):
            im = im.convert("RGB")
        w, h = im.size
        scale = min(1.0, max_edge / max(w, h))
        if scale < 1.0:
            im = im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
        im.save(dst, "WEBP", quality=quality, method=5)


# ---------- HTML generation ----------

HEAD = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="{og}">
<meta property="og:url" content="{url}">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="{root}assets/logos/monogram.svg" type="image/svg+xml">
<link rel="icon" type="image/png" sizes="32x32" href="{root}assets/logos/monogram-32.png">
<link rel="apple-touch-icon" sizes="180x180" href="{root}assets/logos/apple-touch-icon-180.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300&family=Nunito+Sans:wght@800;900&family=Raleway:wght@300;400;500&family=JetBrains+Mono&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{root}assets/css/tokens.css">
<link rel="stylesheet" href="{root}assets/css/base.css">
<link rel="stylesheet" href="{root}assets/css/components.css">
<link rel="stylesheet" href="{css}">
</head>
"""

SCRIPTS = """<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js" integrity="sha384-HOvlOYPIs/zjoIkWUGXkVmXsjr8GuZLV+Q+rcPwmJOVZVpvTSXQChiN4t9Euv9Vc" crossorigin="anonymous"></script>
<script src="{root}assets/js/chrome.js"></script>
<script src="{root}assets/js/motion.js"></script>
"""

LIGHTBOX = """
<div class="lb" id="lb">
  <button class="lb-close" id="lb-close" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
  <div class="lb-wrap" id="lb-wrap"><img id="lb-img" src="" alt=""></div>
  <div class="lb-label" id="lb-label"></div>
  <div class="lb-ctrls">
    <button class="lb-btn" data-dir="-1" aria-label="Previous"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>
    <div class="lb-pill"><button id="lb-ed" class="active">Edited</button><button id="lb-rw">Raw</button></div>
    <button class="lb-btn" data-dir="1" aria-label="Next"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg></button>
  </div>
  <div class="lb-hints"><span><span class="k">&larr;</span><span class="k">&rarr;</span> navigate</span><span><span class="k">space</span> raw / edited</span><span><span class="k">esc</span> close</span></div>
</div>
"""

SWAP_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>'


def esc(s: str) -> str:
    return html.escape(s, quote=True)


def write_property_html(gallery: dict, galleries: list, index: int) -> str:
    """Render one property's photos/<slug>/index.html as a string."""
    name = esc(gallery["name"])
    count = len(gallery["photos"])
    cells = []
    for ph in gallery["photos"]:
        has_e, has_r = "edit_f" in ph, "raw_f" in ph
        only = "" if (has_e and has_r) else " only-one"
        label = esc(ph["label"])
        imgs = ""
        if has_e:
            imgs += f'<img class="edit" src="{ph["edit_t"]}" alt="{label} — edited" loading="lazy">'
        if has_r:
            imgs += f'<img class="raw" src="{ph["raw_t"]}" alt="{label} — raw" loading="lazy">'
        data = ""
        if has_e:
            data += f' data-edit="{ph["edit_f"]}"'
        if has_r:
            data += f' data-raw="{ph["raw_f"]}"'
        swap = "" if only else f'<button class="swap" type="button" aria-label="Swap raw / edited">{SWAP_SVG}</button>'
        tag = "Edited" if has_e else "Raw"
        cells.append(
            f'<figure class="photo{only}" tabindex="0" role="button" aria-label="Open {label}" '
            f'data-label="{label}"{data}>{imgs}'
            f'<span class="tag">{tag}</span><span class="label">{label}</span>{swap}</figure>'
        )
    prev_g = galleries[index - 1] if index > 0 else None
    next_g = galleries[index + 1] if index < len(galleries) - 1 else None
    prev_html = (
        f'<a class="page-link prev" href="../{prev_g["slug"]}/"><span class="eyebrow">&larr; Previous</span><span class="name">{esc(prev_g["name"])}</span></a>'
        if prev_g else '<span class="page-link prev disabled"><span class="eyebrow">&larr;</span><span class="name">Start</span></span>'
    )
    next_html = (
        f'<a class="page-link next" href="../{next_g["slug"]}/"><span class="eyebrow">Next &rarr;</span><span class="name">{esc(next_g["name"])}</span></a>'
        if next_g else '<span class="page-link next disabled"><span class="eyebrow">&rarr;</span><span class="name">End</span></span>'
    )
    desc = f'Real-estate photo editing for {gallery["name"]} — {count} before/after photos.'
    cover_photo = gallery["photos"][0]
    cover_img = cover_photo.get("edit_t") or cover_photo.get("raw_t")
    head = HEAD.format(
        title=f'{name} — Matt Bloomfield', desc=esc(desc), root="../../",
        css="../photos.css", og=f'https://matthewgvc.github.io/photos/{gallery["slug"]}/{cover_img}',
        url=f'https://matthewgvc.github.io/photos/{gallery["slug"]}/',
    )
    body = f"""<body data-root="../../" data-nav="photos">
<main class="page">
  <div class="page-head" data-reveal>
    <a class="back-link" href="../"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg> All galleries</a>
    <h1>{name}</h1>
    <span class="t-mono">{count} photos · raw / edited</span>
  </div>
  <div class="gal-controls" data-reveal>
    <div class="toggle" id="gal-toggle">
      <button class="active" data-mode="edited">Edited</button>
      <button data-mode="raw">Raw</button>
    </div>
  </div>
  <div class="gal-grid" id="grid">
    {"".join(cells)}
  </div>
  <nav class="pagination">{prev_html}{next_html}</nav>
</main>
{LIGHTBOX}
{SCRIPTS.format(root="../../")}<script src="../photos.js"></script>
</body>
</html>
"""
    return head + body


def write_index_html(galleries: list) -> str:
    """Render photos/index.html as a string."""
    rows = []
    for i, g in enumerate(galleries):
        ph0 = g["photos"][0]
        cover = ph0.get("edit_t") or ph0.get("raw_t")
        rows.append(
            f'<a class="prop-row" href="{g["slug"]}/">'
            f'<span class="num">{i + 1:02d}</span>'
            f'<span class="name">{esc(g["name"])}</span>'
            f'<span class="meta">{len(g["photos"])} photo{"" if len(g["photos"]) == 1 else "s"}</span>'
            f'<span class="thumb"><img src="{g["slug"]}/{cover}" alt="" loading="lazy"></span>'
            f'<span class="arrow">&rarr;</span></a>'
        )
    total = sum(len(g["photos"]) for g in galleries)
    desc = "Before/after real-estate photo editing for GVC Real Estate Team listings."
    head = HEAD.format(
        title="Photo Editing — Matt Bloomfield", desc=esc(desc), root="../",
        css="photos.css", og="https://matthewgvc.github.io/assets/img/tile-photo.jpg",
        url="https://matthewgvc.github.io/photos/",
    )
    body = f"""<body data-root="../" data-nav="photos">
<main class="page">
  <div class="page-head" data-reveal>
    <h1>Photo Editing</h1>
    <span class="t-mono">{len(galleries)} property galleries · {total} photos · raw / edited</span>
  </div>
  <div class="photolist">
    {"".join(rows)}
  </div>
</main>
{SCRIPTS.format(root="../")}</body>
</html>
"""
    return head + body
