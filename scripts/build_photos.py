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
