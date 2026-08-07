#!/usr/bin/env python3
"""
Publish the real-estate photo-editing galleries from the Photo-Review source
project into this repo's photos/ section.

Reads <property>/Raw/ and <property>/Edited/ folders directly from the
Photo-Review project (no intermediate JSON, no local preview site), pairs
photos by normalized filename, optimizes each to two WebP sizes, and writes
photos/<slug>/index.html plus photos/index.html.

Idempotent: each gallery's img/.sources.json records which exact source file
(size + mtime) every webp was built from; only photos whose source changed are
re-encoded. --force re-encodes everything regardless.

Requires Pillow (see scripts/requirements.txt).

Usage:
    python scripts/build_photos.py [--force]
"""
import html
import json
import re
import shutil
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

MANIFEST_NAME = ".sources.json"


def src_signature(src: Path, max_edge: int, quality: int) -> str:
    """Fingerprint of the source file + encode params a webp was built from."""
    st = src.stat()
    return f"{st.st_size}:{st.st_mtime_ns}:{max_edge}:{quality}"


def load_manifest(imgdir: Path) -> dict:
    """Read img/.sources.json (output filename -> src_signature), {} if absent."""
    try:
        return json.loads((imgdir / MANIFEST_NAME).read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


def save_manifest(imgdir: Path, manifest: dict) -> None:
    imgdir.mkdir(parents=True, exist_ok=True)
    (imgdir / MANIFEST_NAME).write_text(
        json.dumps(manifest, indent=1, sort_keys=True), encoding="utf-8"
    )


def encode_if_stale(src: Path, dst: Path, max_edge: int, quality: int,
                    manifest: dict, force: bool = False) -> str:
    """
    Encode src -> dst unless the manifest proves dst was already built from
    this exact source file (same size + mtime) with these exact settings.

    File-existence or mtime comparisons against dst are NOT reliable here: a
    git checkout rewrites dst with a fresh mtime, and copying a photo into
    the source folder preserves its original (older) mtime — which is exactly
    how a swapped-out photo used to keep its stale webp. Returns the source
    signature for the caller to record in the new manifest.
    """
    sig = src_signature(src, max_edge, quality)
    if force or not dst.exists() or manifest.get(dst.name) != sig:
        optimize_image(src, dst, max_edge, quality)
    return sig


def optimize_image(src: Path, dst: Path, max_edge: int, quality: int) -> None:
    """Resize src so its longest edge is at most max_edge, save as WEBP at dst."""
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


def write_pairs_json(galleries: list) -> str:
    """
    Render photos/pairs.json: a flat list of every photo that has BOTH a raw
    and an edited version.

    The home page's shuffle panel picks one photo at random across all
    properties. Without this it would have to fetch every gallery page to know
    what exists. Thumb sizes only — the panel is a card, not a lightbox.

    Photos missing one half of the pair are skipped: a before/after slider with
    nothing to compare is not worth showing.
    """
    pairs = []
    for g in galleries:
        for ph in g["photos"]:
            if not (ph.get("raw_t") and ph.get("edit_t")):
                continue
            pairs.append({
                "slug": g["slug"],
                "property": g["name"],
                "label": ph["label"],
                "raw": f'{g["slug"]}/{ph["raw_t"]}',
                "edit": f'{g["slug"]}/{ph["edit_t"]}',
            })
    return json.dumps(pairs, ensure_ascii=False, separators=(",", ":"))


# ---------- filesystem scanning + orchestration ----------

def collect_properties(source_dir: Path):
    """
    Scan source_dir for <property>/Raw/ + <property>/Edited/ folders.
    Returns a list of {"slug", "name", "raw_dir", "edited_dir", "photos"}
    dicts, sorted by folder name. Prints any collision warnings as found.
    """
    properties = []
    for folder in sorted(source_dir.iterdir(), key=lambda p: p.name.lower()):
        if not folder.is_dir() or folder.name.startswith(".") or folder.name in SKIP_FOLDERS:
            continue
        raw_dir = folder / "Raw"
        edited_dir = folder / "Edited"
        if not raw_dir.is_dir() or not edited_dir.is_dir():
            continue

        raw_names = [f.name for f in raw_dir.iterdir() if f.suffix.lower() in EXTS]
        edited_names = [f.name for f in edited_dir.iterdir() if f.suffix.lower() in EXTS]
        photos, warnings = build_pairs(raw_names, edited_names)
        for w in warnings:
            print(f"  WARNING [{folder.name}] {w}")
        if not photos:
            continue

        properties.append({
            "slug": slugify(folder.name),
            "name": folder.name,
            "raw_dir": raw_dir,
            "edited_dir": edited_dir,
            "photos": photos,
        })
    return properties


def clear_stale_images(imgdir: Path, expected_files: set) -> bool:
    """
    Remove imgdir entirely if it contains any file not in expected_files.

    A property's raw/edited pairing can change between runs (a normalize()
    fix, a renamed source file, an added/removed photo), which shifts which
    photo a given positional index represents. If a stale, no-longer-expected
    file (an orphan) is found, the whole directory - manifest included - is
    cleared and everything for this property gets regenerated fresh, not
    just the orphans. (The .sources.json manifest also catches shifted
    indexes on its own, but a full clear keeps no orphan files behind.)
    """
    if not imgdir.exists():
        return False
    existing = {f.name for f in imgdir.iterdir() if f.is_file() and f.suffix == ".webp"}
    if existing - expected_files:
        shutil.rmtree(imgdir)
        return True
    return False


def main():
    galleries = []
    for prop in collect_properties(SOURCE):
        if prop["slug"] in SKIP_SLUGS:
            continue
        imgdir = OUT / prop["slug"] / "img"
        expected_files = set()
        for i, ph in enumerate(prop["photos"]):
            if ph["edited_name"]:
                expected_files.add(f"{i}-e-t.webp")
                expected_files.add(f"{i}-e-f.webp")
            if ph["raw_name"]:
                expected_files.add(f"{i}-r-t.webp")
                expected_files.add(f"{i}-r-f.webp")
        clear_stale_images(imgdir, expected_files)
        manifest = load_manifest(imgdir)
        new_manifest = {}
        photos = []
        for i, ph in enumerate(prop["photos"]):
            raw_src = prop["raw_dir"] / ph["raw_name"] if ph["raw_name"] else None
            edited_src = prop["edited_dir"] / ph["edited_name"] if ph["edited_name"] else None
            entry = {"label": ph["label"]}
            if edited_src:
                for name, edge, q in ((f"{i}-e-t.webp", THUMB_MAX, THUMB_Q),
                                      (f"{i}-e-f.webp", FULL_MAX, FULL_Q)):
                    new_manifest[name] = encode_if_stale(edited_src, imgdir / name, edge, q, manifest, FORCE)
                entry["edit_t"], entry["edit_f"] = f"img/{i}-e-t.webp", f"img/{i}-e-f.webp"
            if raw_src:
                for name, edge, q in ((f"{i}-r-t.webp", THUMB_MAX, THUMB_Q),
                                      (f"{i}-r-f.webp", FULL_MAX, FULL_Q)):
                    new_manifest[name] = encode_if_stale(raw_src, imgdir / name, edge, q, manifest, FORCE)
                entry["raw_t"], entry["raw_f"] = f"img/{i}-r-t.webp", f"img/{i}-r-f.webp"
            photos.append(entry)
        save_manifest(imgdir, new_manifest)
        if not photos:
            continue
        galleries.append({"slug": prop["slug"], "name": prop["name"], "photos": photos})
        print(f"  {prop['slug']}: {len(photos)} photos")

    for i, gallery in enumerate(galleries):
        out_dir = OUT / gallery["slug"]
        out_dir.mkdir(parents=True, exist_ok=True)
        (out_dir / "index.html").write_text(write_property_html(gallery, galleries, i), encoding="utf-8")

    (OUT / "index.html").write_text(write_index_html(galleries), encoding="utf-8")
    (OUT / "pairs.json").write_text(write_pairs_json(galleries), encoding="utf-8")

    total = sum(len(g["photos"]) for g in galleries)
    print(f"\nDONE: {len(galleries)} galleries, {total} photos -> {OUT}")


if __name__ == "__main__":
    main()
