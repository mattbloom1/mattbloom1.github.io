#!/usr/bin/env python3
"""
One-command photo publish for the repo owner.

Drop photos into "<Property Name>/Raw/" and "<Property Name>/Edited/" in the
Personal Photo Editing Project folder, then run:

    python scripts/publish_photos.py

It pulls the latest site, rebuilds the galleries, commits the result straight
to main, and pushes — live at https://matthewgvc.github.io within a minute.
No branches, no PRs. Any extra arguments (e.g. --force) are passed through to
build_photos.py.
"""
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).parent.parent


def run(*cmd):
    print("+", " ".join(cmd))
    subprocess.run(cmd, cwd=REPO, check=True)


def capture(*cmd) -> str:
    return subprocess.run(
        cmd, cwd=REPO, check=True, capture_output=True, text=True
    ).stdout.strip()


def main():
    branch = capture("git", "rev-parse", "--abbrev-ref", "HEAD")
    if branch != "main":
        sys.exit(
            f'You are on branch "{branch}", not main.\n'
            'Run "git checkout main" first, then re-run this script.'
        )

    run("git", "pull", "--ff-only", "origin", "main")
    run(sys.executable, str(REPO / "scripts" / "build_photos.py"), *sys.argv[1:])

    if not capture("git", "status", "--porcelain", "photos"):
        print("\nNothing changed — the site already matches your photo folders.")
        return

    run("git", "add", "photos")
    run("git", "commit", "-m", "photos: update galleries")
    run("git", "push", "origin", "main")
    print("\nDone — live at https://matthewgvc.github.io/photos/ in about a minute.")


if __name__ == "__main__":
    main()
