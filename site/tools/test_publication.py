"""Guard website-to-publication navigation, coverage, and supported build outputs."""
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "whitepaper"))
spec = importlib.util.spec_from_file_location("whitepaper_build", ROOT / "whitepaper" / "build.py")
build = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build)


class PublicationTests(unittest.TestCase):
    def test_toc_orders_every_page_once(self):
        pages = build.publication_pages()
        self.assertEqual(len(pages), len(set(pages)))
        self.assertEqual(set(pages), {str(p) for p in (ROOT / "whitepaper" / "pages").glob("*.html")})
        names = [Path(page).name for page in pages]
        expected = [
            "18b-placement-steps.html", "22a0-overview.html", "22a2-storage.html", "22a3-restore.html",
            "22a4-kv1-overview.html", "22a4-kv5-decision.html", "22a4a-dns-global.html",
            "22a4d-dns-operations.html", "20b-getting-started.html", "19-scenarios-1.html",
            "20-misconceptions.html", "22a1-paired.html", "22a5-resiliency-scenarios.html",
            "21-conclusion.html",
        ]
        self.assertEqual([name for name in names if name in expected], expected)

    def test_missing_article_mapping_fails_build(self):
        with patch.dict(build.ARTICLE_PAGES):
            del build.ARTICLE_PAGES["storage-across-regions"]
            with self.assertRaisesRegex(ValueError, "TOC changes"):
                build.publication_pages()

    def test_missing_page_fails_build(self):
        with patch.dict(build.ARTICLE_PAGES, {"storage-across-regions": ["missing-page-*"]}):
            with self.assertRaisesRegex(ValueError, "No whitepaper pages"):
                build.publication_pages()

    def test_duplicate_page_mapping_fails_build(self):
        with patch.dict(build.ARTICLE_PAGES, {"restore-across-regions": ["22a2-*"]}):
            with self.assertRaisesRegex(ValueError, "Duplicate or unmapped"):
                build.publication_pages()

    def test_services_and_resources_are_distinct(self):
        for page in build.publication_pages():
            name = Path(page).name
            text = Path(page).read_text(encoding="utf-8")
            if name.startswith(("22a0-", "22a2-", "22a3-", "22a4")):
                self.assertIn('data-section="Service Guides for Multi Region"', text)
            if name.startswith(("22a1-", "22a5-")):
                self.assertIn('data-section="Resources"', text)

    def test_deck_sections_follow_website_groups(self):
        result = subprocess.run(["node", "-e",
            "console.log(JSON.stringify(require('./decks/full/sections').map(s=>s.key)))"],
            cwd=ROOT, check=True, capture_output=True, text=True)
        keys = json.loads(result.stdout)
        self.assertEqual(keys[keys.index("part5") + 1:], [
            "services", "getting-started", "scenarios", "misconceptions", "pairing", "resiliency", "conclusion", "back",
        ])

    def test_default_build_does_not_generate_word(self):
        script = (ROOT / "build.sh").read_text(encoding="utf-8")
        self.assertNotIn("word/build.py", script)
        self.assertNotIn("drift.py brief", script)
        self.assertNotIn("site; word;", script)
        self.assertNotIn("  word)", script)
        self.assertNotIn("python3 inline.py", script)

    def test_key_vault_fits_five_pages_and_slides(self):
        pages = [page for page in build.publication_pages() if Path(page).name.startswith("22a4-kv")]
        self.assertEqual(len(pages), 5)
        result = subprocess.run(["node", "-e", """
            let slides = 0, images = 0;
            const L = {
              data: {siteUrl: 'https://example.invalid/'},
              slide() { slides++; return {addTable() {}, addNotes() {}}; },
              header() {}, txt() {}, box() {},
              image(slide, file, box) {
                const ratio = file.endsWith('decision-tree.png') ? 940 / 492 : 380 / 273;
                if (Math.abs(box.w / box.h - ratio) > 0.001) throw Error('Distorted diagram');
                images++;
              }
            };
            require('./decks/full/key-vault')({}, L);
            console.log(JSON.stringify({slides, images}));
        """], cwd=ROOT, check=True, capture_output=True, text=True)
        self.assertEqual(json.loads(result.stdout), {"slides": 5, "images": 8})

    def test_decks_are_created_only_in_temp(self):
        for builder in ("build_full.js", "build_exec.js"):
            source = (ROOT / "decks" / builder).read_text(encoding="utf-8")
            self.assertIn("path.join(__dirname, '..', 'temp',", source)
            self.assertNotIn("path.join(__dirname, 'out',", source)
        script = (ROOT / "build.sh").read_text(encoding="utf-8")
        self.assertIn('DECKS="$ROOT/temp"', script)
        self.assertNotIn('cp decks/out/', script)

    def test_document_artifacts_are_binary_in_git(self):
        files = [
            ROOT / "docs" / "downloads" / "Adaptable-Multi-Region-Azure-Platform.pdf",
            ROOT / "temp" / "Adaptable-Multi-Region-Azure-Platform-Full.pptx",
        ]
        result = subprocess.run(
            ["git", "check-attr", "-z", "text", "diff", "merge", "--", *map(str, files)],
            cwd=ROOT, check=True, capture_output=True,
        )
        fields = result.stdout.decode("utf-8").rstrip("\0").split("\0")
        self.assertEqual(fields[2::3], ["unset"] * 6)


if __name__ == "__main__":
    unittest.main()
