"""Exercise one-way synchronization against real temporary Git checkouts."""
import contextlib
import io
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

SCRIPT = Path(__file__).with_name("sync_planner.py")


class PlannerSyncTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.source = Path(self.temp.name) / "source"
        self.target = Path(self.temp.name) / "target"
        for root, remote in ((self.source, "Azure/multi-region-platform"),
                             (self.target, "mcaps-microsoft/adr-emr-region-planning")):
            root.mkdir()
            self.git(root, "init", "-q")
            self.git(root, "config", "user.name", "Sync test")
            self.git(root, "config", "user.email", "sync@example.invalid")
            self.git(root, "config", "core.autocrlf", "false")
            self.git(root, "remote", "add", "origin", f"https://github.com/{remote}.git")
        self.write(self.source, "docs/assets/planner-core.js", "const shared = 1;\n\nconst downstream = false;\n")
        self.write(self.source, "docs/data/availability-catalog-latest.json", '{"rows":1}\n')
        self.write(self.source, "tools/geolz-explorer/index.html", "<p>Network 1</p>\n")
        self.write(self.source, "docs/region-planner.html", '<script>window.MRP_SEED = {"regions":[]};</script>')
        self.write(self.target, "assets/planner-core.js", "const shared = 1;\n\nconst downstream = true;\n")
        self.write(self.target, "data/availability-catalog-latest.json", '{"rows":1}\n')
        self.write(self.target, "tools/geolz-explorer/index.html", "<p>Network 1</p>\n")
        self.write(self.target, "assets/capacity.js", "// Downstream only\n")
        self.write(self.target, "index.html", '<title>ADR-EMR</title><script>window.MRP_SEED = {"old":1};</script>')
        self.git(self.source, "add", ".")
        self.git(self.source, "commit", "-qm", "Baseline")
        self.base = self.git(self.source, "rev-parse", "HEAD").strip()

    def git(self, root, *args):
        return subprocess.check_output(["git", "-C", str(root), *args], text=True, encoding="utf-8")

    def write(self, root, name, text):
        path = root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8", newline="\n")

    def run_sync(self, *args, ok=True):
        result = subprocess.run([sys.executable, str(SCRIPT), "--source", str(self.source),
                                 "--target", str(self.target), *args], capture_output=True, text=True, encoding="utf-8")
        if ok:
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        else:
            self.assertNotEqual(result.returncode, 0)
        return result

    def initialize(self):
        self.run_sync("--base-ref", self.base, "--apply")

    def test_dry_run_never_changes_target(self):
        before = {p.relative_to(self.target): p.read_bytes() for p in self.target.rglob("*") if p.is_file()}
        self.run_sync("--base-ref", self.base)
        self.assertEqual(before, {p.relative_to(self.target): p.read_bytes()
                                 for p in self.target.rglob("*") if p.is_file()})

    def test_updates_shared_files_and_keeps_downstream_edits_and_shell(self):
        self.initialize()
        self.write(self.source, "docs/assets/planner-core.js", "const shared = 2;\n\nconst downstream = false;\n")
        self.write(self.source, "tools/geolz-explorer/index.html", "<p>Network 2</p>\n")
        self.run_sync("--apply")
        self.assertEqual((self.target / "assets/planner-core.js").read_text(),
                         "const shared = 2;\n\nconst downstream = true;\n")
        self.assertEqual((self.target / "assets/capacity.js").read_text(), "// Downstream only\n")
        self.assertIn("<title>ADR-EMR</title>", (self.target / "index.html").read_text())
        self.assertIn('{"regions":[]}', (self.target / "index.html").read_text())
        self.assertEqual((self.target / "tools/geolz-explorer/index.html").read_text(), "<p>Network 2</p>\n")
        self.assertIn("const downstream = false", (self.source / "docs/assets/planner-core.js").read_text())

    def test_stale_resolution_never_becomes_approved_on_a_second_retry(self):
        self.initialize()
        self.write(self.target, "assets/planner-core.js", "const shared = 3;\n\nconst downstream = true;\n")
        self.write(self.source, "docs/assets/planner-core.js", "const shared = 2;\n\nconst downstream = false;\n")
        resolutions = Path(self.temp.name) / "resolutions"
        self.run_sync("--resolutions", str(resolutions), ok=False)
        self.write(resolutions, "assets/planner-core.js", "const shared = 2;\n\nconst downstream = true;\n")
        self.write(self.source, "docs/assets/planner-core.js", "const shared = 4;\n\nconst downstream = false;\n")
        for _ in range(2):
            self.run_sync("--apply", "--resolutions", str(resolutions), ok=False)
        self.assertIn("const shared = 3", (self.target / "assets/planner-core.js").read_text())

    def test_conflicts_stop_all_publication_including_data(self):
        self.initialize()
        self.write(self.target, "assets/planner-core.js", "const shared = 3;\n\nconst downstream = true;\n")
        self.write(self.source, "docs/assets/planner-core.js", "const shared = 2;\n\nconst downstream = false;\n")
        self.write(self.source, "docs/data/availability-catalog-latest.json", '{"rows":2}\n')
        before = (self.target / ".planner-upstream/baseline.zip").read_bytes()
        result = self.run_sync("--apply", ok=False)
        self.assertIn("assets/planner-core.js", result.stderr)
        self.assertEqual((self.target / "data/availability-catalog-latest.json").read_text(), '{"rows":1}\n')
        self.assertEqual((self.target / ".planner-upstream/baseline.zip").read_bytes(), before)
        self.assertNotIn("<<<<<<<", (self.target / "assets/planner-core.js").read_text())

    def test_removes_only_managed_unchanged_files(self):
        self.initialize()
        (self.source / "tools/geolz-explorer/index.html").unlink()
        self.run_sync("--apply")
        self.assertFalse((self.target / "tools/geolz-explorer/index.html").exists())
        self.assertTrue((self.target / "assets/capacity.js").exists())

    def test_downstream_modified_upstream_deletion_is_a_conflict(self):
        self.initialize()
        (self.source / "docs/assets/planner-core.js").unlink()
        self.run_sync("--apply", ok=False)
        self.assertTrue((self.target / "assets/planner-core.js").exists())

    def test_reversed_repositories_are_rejected(self):
        self.git(self.source, "remote", "set-url", "origin", "https://github.com/mcaps-microsoft/adr-emr-region-planning.git")
        self.run_sync("--base-ref", self.base, "--apply", ok=False)
        self.assertFalse((self.target / ".planner-upstream").exists())

    def test_repeated_sync_is_a_no_op(self):
        self.initialize()
        paths = list((self.target / ".planner-upstream").rglob("*"))
        before = {p: p.read_bytes() for p in paths if p.is_file()}
        self.run_sync("--apply")
        self.assertEqual(before, {p: p.read_bytes() for p in paths if p.is_file()})

    def test_initial_import_includes_dependencies_missing_from_the_original_copy(self):
        self.write(self.source, "docs/assets/fonts/example.woff2", "font")
        self.git(self.source, "add", ".")
        self.git(self.source, "commit", "-qm", "Font dependency")
        self.base = self.git(self.source, "rev-parse", "HEAD").strip()
        self.initialize()
        self.assertEqual((self.target / "assets/fonts/example.woff2").read_text(), "font")

    def test_resolution_export_does_not_approve_an_unreviewed_upstream_copy(self):
        self.initialize()
        self.write(self.target, "assets/planner-core.js", "const shared = 3;\n\nconst downstream = true;\n")
        self.write(self.source, "docs/assets/planner-core.js", "const shared = 2;\n\nconst downstream = false;\n")
        resolutions = Path(self.temp.name) / "resolutions"
        for _ in range(2):
            self.run_sync("--apply", "--resolutions", str(resolutions), ok=False)
        self.assertIn("const shared = 3", (self.target / "assets/planner-core.js").read_text())
        self.assertTrue((resolutions / "assets/planner-core.js.upstream").exists())
        self.write(resolutions, "assets/planner-core.js", "const shared = 2;\n\nconst downstream = true;\n")
        self.run_sync("--apply", "--resolutions", str(resolutions))
        self.assertEqual((self.target / "assets/planner-core.js").read_text(),
                         "const shared = 2;\n\nconst downstream = true;\n")

    def test_write_failure_rolls_back_files_already_published(self):
        import sync_planner

        self.initialize()
        self.write(self.source, "docs/assets/planner-core.js", "const shared = 2;\n\nconst downstream = false;\n")
        self.write(self.source, "docs/data/availability-catalog-latest.json", '{"rows":2}\n')
        old_code = (self.target / "assets/planner-core.js").read_bytes()
        old_baseline = (self.target / ".planner-upstream/baseline.zip").read_bytes()
        failing = self.target / "data/availability-catalog-latest.json"
        write = Path.write_bytes

        def fail_new_catalog(path, data):
            if path == failing and data == b'{"rows":2}\n':
                raise OSError("Test publication failure")
            return write(path, data)

        with patch.object(Path, "write_bytes", fail_new_catalog), contextlib.redirect_stdout(io.StringIO()):
            with self.assertRaisesRegex(OSError, "Test publication failure"):
                sync_planner.synchronize(self.source, self.target, apply=True)
        self.assertEqual((self.target / "assets/planner-core.js").read_bytes(), old_code)
        self.assertEqual((self.target / ".planner-upstream/baseline.zip").read_bytes(), old_baseline)
        self.assertEqual(failing.read_text(), '{"rows":1}\n')


if __name__ == "__main__":
    unittest.main()
