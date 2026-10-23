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


if __name__ == "__main__":
    unittest.main()
