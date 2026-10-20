#!/usr/bin/env python3
"""Push shared planner files one way, preserving downstream edits with Git's three-way merge."""
import argparse
import hashlib
import io
import json
import re
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

UPSTREAM = "Azure/multi-region-platform"
DOWNSTREAM = "mcaps-microsoft/adr-emr-region-planning"
STATE = ".planner-upstream/baseline.zip"
SEED = re.compile(rb"<script>window\.MRP_SEED = .*?;</script>", re.DOTALL)
CONFLICT = object()


def git(root, *args):
    return subprocess.check_output(["git", "-C", str(root), *args], stderr=subprocess.PIPE)


def verify_repository(root, expected):
    remote = git(root, "remote", "get-url", "origin").decode().strip()
    if remote not in (f"https://github.com/{expected}.git", f"https://github.com/{expected}",
                      f"git@github.com:{expected}.git"):
        raise ValueError(f"Expected {expected} at {root}, not {remote}. Refusing reversed or unrelated sync.")
    if Path(git(root, "rev-parse", "--show-toplevel").decode().strip()).resolve() != root:
        raise ValueError(f"Use the checkout root: {root}")


def managed(name):
    return (name.startswith("assets/") and name != "assets/search-index.json"
            or name.startswith("data/") or name.startswith("tools/geolz-explorer/"))


def safe_path(root, name):
    path = root / name
    if not managed(name) or not path.resolve().is_relative_to(root) or path.is_symlink():
        raise ValueError(f"Unsafe managed path: {name}")
    return path


def payload(source):
    result = {}
    for prefix in ("docs/assets", "docs/data", "tools/geolz-explorer"):
        for path in sorted((source / prefix).rglob("*")):
            if path.is_symlink():
                raise ValueError(f"Symlinks are not supported: {path}")
            if path.is_file():
                name = path.relative_to(source).as_posix().removeprefix("docs/")
                if managed(name):
                    result[name] = path.read_bytes()
    if not result:
        raise ValueError("No published planner files found. Build the source site first.")
    return result


def merge(local, base, incoming):
    if incoming == base or local == incoming:
        return local
    if local == base:
        return incoming
    if local is None or base is None or incoming is None or any(b"\0" in b for b in (local, base, incoming)):
        return CONFLICT
    with tempfile.TemporaryDirectory() as directory:
        paths = [Path(directory) / name for name in ("downstream", "baseline", "upstream")]
        for path, content in zip(paths, (local, base, incoming)):
            path.write_bytes(content.replace(b"\r\n", b"\n"))
        result = subprocess.run(["git", "merge-file", "-p", *map(str, paths)], capture_output=True)
    if result.returncode == 0:
        return result.stdout
    if result.returncode < 0 or result.returncode > 127:
        raise ValueError(f"Git merge failed: {result.stderr.decode(errors='replace')}")
    return CONFLICT


def archive(files):
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", compression=zipfile.ZIP_DEFLATED) as output:
        for name, content in sorted(files.items()):
            entry = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
            entry.compress_type = zipfile.ZIP_DEFLATED
            output.writestr(entry, content)
    return buffer.getvalue()


def digest(content):
    return hashlib.sha256(content).hexdigest() if content is not None else None


def synchronize(source, target, *, base_ref=None, apply=False, resolutions=None):
    source, target = source.resolve(), target.resolve()
    if source == target or source.is_relative_to(target) or target.is_relative_to(source):
        raise ValueError("Source and target must be separate checkouts.")
    verify_repository(source, UPSTREAM)
    verify_repository(target, DOWNSTREAM)
    if resolutions:
        resolutions = resolutions.resolve()
        if resolutions.is_relative_to(source) or resolutions.is_relative_to(target):
            raise ValueError("Keep conflict resolutions outside both checkouts.")
    incoming = payload(source)
    state_path = target / STATE
    bootstrap = not state_path.exists()
    for path in (state_path, target / "index.html"):
        if path.is_symlink() or not path.resolve().is_relative_to(target):
            raise ValueError(f"Unsafe destination path: {path}")
    if state_path.exists():
        if base_ref:
            raise ValueError("--base-ref is only for the first import; never reset an established baseline.")
        with zipfile.ZipFile(state_path) as previous:
            base = {name: previous.read(name) for name in previous.namelist()}
    elif base_ref:
        base = {}
        for path in git(source, "ls-tree", "-r", "--name-only", base_ref, "--",
                        "docs/assets", "docs/data", "tools/geolz-explorer").decode().splitlines():
            name = path.removeprefix("docs/")
            if managed(name):
                base[name] = git(source, "show", f"{base_ref}:{path}")
    else:
        raise ValueError("First import requires --base-ref naming the reviewed upstream version used downstream.")
    changes, originals, conflicts = {}, {}, {}
    resolution_state = {}
    if resolutions and (resolutions / "conflicts.json").exists():
        resolution_state = json.loads((resolutions / "conflicts.json").read_text(encoding="utf-8"))
    for name in sorted(base.keys() | incoming.keys()):
        path = safe_path(target, name)
        local = path.read_bytes() if path.exists() else None
        old, new = base.get(name), incoming.get(name)
        output = new if bootstrap and local is None and new is not None else merge(local, old, new)
        if output is CONFLICT:
            fingerprint = [digest(local), digest(old), digest(new)]
            resolved = resolutions / name if resolutions else None
            if resolved and resolved.exists() and resolution_state.get(name) != fingerprint:
                raise ValueError(f"Stale resolution: {name}. Use a fresh resolution folder and review again.")
            if resolved and resolved.exists() and resolution_state.get(name) == fingerprint:
                output = resolved.read_bytes()
                if re.search(rb"^(<<<<<<<|=======|>>>>>>>)", output, re.MULTILINE):
                    raise ValueError(f"Unresolved conflict markers: {name}")
            else:
                conflicts[name] = fingerprint
                continue
        if output != local:
            changes[name], originals[name] = output, local
    if conflicts:
        if resolutions:
            resolutions.mkdir(parents=True, exist_ok=True)
            for name in conflicts:
                path = resolutions / (name + ".upstream")
                path.parent.mkdir(parents=True, exist_ok=True)
                # A separate resolved file is required; these incoming copies are never auto-approved.
                path.write_bytes(incoming.get(name) or b"")
            (resolutions / "conflicts.json").write_text(json.dumps(conflicts, indent=2) + "\n", encoding="utf-8")
        raise ValueError("Conflicts; no destination files changed:\n  " + "\n  ".join(conflicts))
    source_page = (source / "docs/region-planner.html").read_bytes()
    target_page = (target / "index.html").read_bytes()
    seeds = SEED.findall(source_page)
    if len(seeds) != 1 or len(SEED.findall(target_page)) != 1:
        raise ValueError("Expected exactly one embedded region seed in each planner page.")
    page = SEED.sub(lambda _: seeds[0], target_page)
    if page != target_page:
        changes["index.html"], originals["index.html"] = page, target_page
    snapshot = archive(incoming)
    if not state_path.exists() or state_path.read_bytes() != snapshot:
        changes[STATE] = snapshot
        originals[STATE] = state_path.read_bytes() if state_path.exists() else None
    for name, content in changes.items():
        print(("DELETE " if content is None else "UPDATE ") + name)
    if not apply:
        print(f"Dry run: {len(changes)} changes. Use --apply after review.")
        return
    written = []
    try:
        for name, content in changes.items():
            path = target / name
            before = path.read_bytes() if path.exists() else None
            if before != originals[name]:
                raise ValueError(f"Destination changed during sync: {name}")
            written.append(name)
            if content is None:
                path.unlink()
            else:
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(content)
    except (OSError, ValueError):
        for name in reversed(written):
            path = target / name
            if originals[name] is None:
                path.unlink(missing_ok=True)
            else:
                path.write_bytes(originals[name])
        raise
    print(f"Applied {len(changes)} changes to ADR-EMR only. Review and test before committing.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument("--target", type=Path, required=True)
    parser.add_argument("--base-ref", help="First import only: upstream version used to create the downstream copy.")
    parser.add_argument("--apply", action="store_true", help="Write the reviewed sync; otherwise dry run.")
    parser.add_argument("--resolutions", type=Path, help="Export conflicting upstream files for manual integration; rerun to approve them.")
    args = parser.parse_args()
    try:
        synchronize(args.source, args.target, base_ref=args.base_ref, apply=args.apply, resolutions=args.resolutions)
    except (ValueError, OSError, subprocess.CalledProcessError, zipfile.BadZipFile) as error:
        parser.exit(1, f"{error}\n")


if __name__ == "__main__":
    main()
