#!/usr/bin/env python3
"""Publish latest snapshots, preserving the first archived snapshot for six months."""
import argparse
import datetime
import json
import re
import shutil
import tempfile
from pathlib import Path

BACKUP_LIMIT = 6


def metadata(snapshot):
    path = snapshot / "meta.json" if snapshot.is_dir() else snapshot
    return json.loads(path.read_text(encoding="utf-8"))


def archive_pattern(latest):
    if not latest.stem.endswith("-latest"):
        raise ValueError(f"Snapshot name must end in -latest: {latest.name}")
    prefix = latest.stem.removesuffix("-latest")
    return prefix, re.compile(re.escape(prefix) + r"-\d{4}-(?:0[1-9]|1[0-2])" + re.escape(latest.suffix))


def archive_current(latest):
    prefix, _ = archive_pattern(latest)
    if not latest.exists():
        return
    generated = metadata(latest).get("generated")
    if not generated:
        return  # Build placeholders are not collected snapshots.
    month = datetime.datetime.fromisoformat(generated.replace("Z", "+00:00")).strftime("%Y-%m")
    archive = latest.with_name(f"{prefix}-{month}{latest.suffix}")
    if archive.exists():
        return  # Keep the first archived snapshot from this creation month.
    with tempfile.TemporaryDirectory(prefix=".archive-", dir=latest.parent) as temporary:
        staged = Path(temporary) / archive.name
        if latest.is_dir():
            shutil.copytree(latest, staged)
        else:
            shutil.copy2(latest, staged)
        staged.replace(archive)


def prune_archives(latest):
    _, pattern = archive_pattern(latest)
    archives = sorted(
        (path for path in latest.parent.iterdir() if pattern.fullmatch(path.name)),
        key=lambda path: path.name, reverse=True,
    )
    for path in archives[BACKUP_LIMIT:]:
        if path.is_symlink():
            raise ValueError(f"Refusing to remove a symlink snapshot: {path}")
        if path.is_dir() != latest.is_dir():
            raise ValueError(f"Unexpected snapshot type: {path}")
        if path.is_dir():
            shutil.rmtree(path)
        else:
            path.unlink()


def publish_snapshot(staged, latest):
    """Archive before replacement; staging failures never overwrite the current snapshot."""
    archive_pattern(latest)
    metadata(staged)  # Refuse unreadable JSON before archiving or replacing anything.
    latest.parent.mkdir(parents=True, exist_ok=True)
    archive_current(latest)
    if latest.is_dir():
        # Windows cannot replace a populated directory in one rename.
        with tempfile.TemporaryDirectory(prefix=".publish-", dir=latest.parent) as temporary:
            retired = Path(temporary) / latest.name
            latest.replace(retired)
            try:
                staged.replace(latest)
            except OSError:
                retired.replace(latest)
                raise
    else:
        staged.replace(latest)
    prune_archives(latest)


def migrate_layout(root):
    """Rename existing data without refreshing it or creating artificial history."""
    availability = root / "availability-catalog.json"
    latest = root / "availability-catalog-latest.json"
    if availability.exists():
        if latest.exists():
            raise ValueError("Both legacy and latest availability catalogs exist; resolve before migration.")
        availability.replace(latest)
    legacy = [root / name for name in ("meta.json", "catalog.json", "products.json", "pricing")]
    if any(path.exists() for path in legacy):
        retail = root / "retail-latest"
        if retail.exists():
            raise ValueError("Both legacy and latest retail data exist; resolve before migration.")
        if not all(path.exists() for path in legacy):
            raise ValueError("Legacy retail snapshot is incomplete; nothing migrated.")
        with tempfile.TemporaryDirectory(prefix=".migrate-", dir=root) as temporary:
            staged = Path(temporary) / "retail-latest"
            staged.mkdir()
            for source in legacy:
                if source.is_dir():
                    shutil.copytree(source, staged / source.name)
                else:
                    shutil.copy2(source, staged / source.name)
            metadata(staged)
            staged.replace(retail)
        for source in legacy:
            if source.is_dir():
                shutil.rmtree(source)
            else:
                source.unlink()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Migrate existing snapshots to latest names without collecting data.")
    parser.add_argument("--data", type=Path, default=Path(__file__).resolve().parents[2] / "docs" / "data")
    migrate_layout(parser.parse_args().data)
