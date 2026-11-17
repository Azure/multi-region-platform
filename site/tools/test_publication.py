"""Guard website-to-publication navigation, coverage, and supported build outputs."""
import importlib.util
import json
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "whitepaper"))
spec = importlib.util.spec_from_file_location("whitepaper_build", ROOT / "whitepaper" / "build.py")
build = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build)
spec = importlib.util.spec_from_file_location("site_build", ROOT / "site" / "build.py")
site_build = importlib.util.module_from_spec(spec)
spec.loader.exec_module(site_build)


class PublicationTests(unittest.TestCase):
    def test_explicit_svg_overrides_live_html_without_changing_png_figures(self):
        with tempfile.TemporaryDirectory() as work:
            root = Path(work)
            media = root / "content" / "media"
            figures = root / "site" / "figures"
            media.mkdir(parents=True)
            figures.mkdir(parents=True)
            (media / "example.svg").write_text(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 640"/>',
                encoding="utf-8")
            fragment = figures / "example.html"
            fragment.write_text('<div class="wpf">Extracted figure</div>', encoding="utf-8")
            with patch.object(site_build, "CONTENT", str(media.parent)), \
                    patch.object(site_build, "SITE", str(figures.parent)):
                svg = site_build.figure_html("./media/example.svg", "A & B", "Caption")
                png = site_build.figure_html("./media/example.png", "A & B", "")
                fragment.unlink()
                fallback = site_build.figure_html("./media/example.png", "A & B", "")
        self.assertIn('class="fig live"', svg)
        self.assertIn('aria-label="A &amp; B"', svg)
        self.assertIn('data-w="1200" data-h="640" style="width:1200px"', svg)
        self.assertIn('<img src="media/example.svg" width="1200" height="640" alt=""', svg)
        self.assertIn('href="media/example.svg" download', svg)
        self.assertIn("<figcaption>Caption</figcaption>", svg)
        self.assertNotIn("Extracted figure", svg)
        self.assertIn("Extracted figure", png)
        self.assertIn('href="media/example.png" download', png)
        self.assertNotIn("example.svg", png)
        self.assertIn('class="fig img"', fallback)
        self.assertIn('<img src="media/example.png" alt="A &amp; B"', fallback)

    def test_regional_footprint_figures_show_platform_service_categories(self):
        categories = ["Security", "Identity", "Management", "Networking"]
        for name in ("pages/03-intro.html", "exec/pages/03-reframe.html"):
            source = (ROOT / "whitepaper" / name).read_text(encoding="utf-8")
            groups = re.findall(r'<div class="blk platform-services"[^>]*>(.*?)</div>', source)
            self.assertEqual(len(groups), 4, name)
            for group in groups:
                self.assertEqual(re.findall(r"<span>([^<]+)</span>", group), categories, name)
            self.assertNotIn(">Shared<", source)
            self.assertNotIn(">Shared services<", source)
            self.assertIn("Security<br>Networking", source)
            labels = [
                " ".join(re.sub(r"<[^>]+>", " ", label).split())
                for label in re.findall(r'<div class="rl"[^>]*><svg>.*?</svg>(.*?)</div>', source)
            ]
            self.assertEqual(labels, [
                "Region A (Primary)", "Region B (DR)",
                "Region A", "Region B", "Region C", "Region D", "Region E", "Region F",
            ], name)
            self.assertEqual(source.count('class="blk wl">Workloads</div>'), 7, name)
            self.assertNotIn(">Spokes<", source)

    def test_regional_comparison_aligns_both_models(self):
        result = subprocess.run(["node", "-e", """
            const result = { boxes: [], texts: [] };
            const L = {
                box(s, x, y, w, h, style) { result.boxes.push({ x, y, w, h, style }); },
                txt(s, text, x, y, w, h) { result.texts.push({ text, x, y, w, h }); },
                icon() {}, line() {},
            };
            require('./decks/regional-comparison')({}, L,
                ['Business expansion', 'Data boundaries', 'Service & AI availability', 'Latency requirements']);
            console.log(JSON.stringify(result));
        """], cwd=ROOT, check=True, capture_output=True, text=True)
        drawing = json.loads(result.stdout)
        foundations = [box for box in drawing["boxes"] if box["style"]["fill"] == "243A57"]
        self.assertEqual(len(foundations), 2)
        self.assertEqual(len({(box["y"], box["h"]) for box in foundations}), 1)
        services = [text for text in drawing["texts"]
                    if text["text"] == "Security\nIdentity\nManagement\nNetworking"]
        self.assertEqual(len(services), 4)
        self.assertEqual(len({(text["y"], text["h"]) for text in services}), 1)
        workloads = [text for text in drawing["texts"] if text["text"] == "Workloads"]
        self.assertEqual(len({(text["y"], text["h"]) for text in workloads[:4]}), 1)
        regions = [box for box in drawing["boxes"]
                   if box["style"].get("dash") == "dash" and box["x"] >= foundations[1]["x"]]
        self.assertEqual(len(regions), 6)
        self.assertEqual(len({region["w"] for region in regions}), 1)
        self.assertEqual(regions[0]["h"], regions[1]["h"])
        self.assertTrue(all(left["h"] > right["h"] for left, right in zip(regions[1:], regions[2:])))
        for index, region in enumerate(regions):
            contained = [text for text in workloads
                         if region["x"] <= text["x"] and text["x"] + text["w"] <= region["x"] + region["w"]
                         and region["y"] <= text["y"] and text["y"] + text["h"] <= region["y"] + region["h"]]
            self.assertEqual(len(contained), 1 if index < 5 else 0)
        remote = next(text for text in drawing["texts"] if text["text"].startswith("Consumes\n"))
        remote_boxes = [box for box in drawing["boxes"]
                        if all(box[key] == remote[key] for key in ("x", "y", "w", "h"))]
        self.assertEqual(len(remote_boxes), 1)
        self.assertTrue(remote_boxes[0]["style"].get("line"))
        headings = [text for text in drawing["texts"] if text["text"] in {
            "Evolving regional conditions", "Governed response to change",
        }]
        self.assertEqual(len(headings), 2)
        self.assertEqual(headings[0]["y"], headings[1]["y"])
        lists = [drawing["texts"][drawing["texts"].index(heading) + 1:
                                  drawing["texts"].index(heading) + 5] for heading in headings]
        for heading, items in zip(headings, lists):
            self.assertEqual(len(items), 4)
            self.assertTrue(all(item["y"] > heading["y"] for item in items))
        self.assertEqual([item["y"] for item in lists[0]], [item["y"] for item in lists[1]])

    def test_profile_spectrum_figures_show_all_four_platform_service_categories(self):
        categories = ["Security", "Identity", "Management", "Networking"]
        for name in ("pages/08-profiles.html", "exec/pages/06-footprint.html"):
            source = (ROOT / "whitepaper" / name).read_text(encoding="utf-8")
            full = source.split("<!-- 4 -->", 1)[1]
            for category in categories:
                self.assertRegex(full, rf"<text\b[^>]*>{category}</text>", name)
            self.assertIn("Selected platform services", source)
            self.assertNotIn("Shared services", source)

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

    def test_key_vault_fits_five_pdf_pages_and_preserves_deck_coverage(self):
        pages = [page for page in build.publication_pages() if Path(page).name.startswith("22a4-kv")]
        self.assertEqual(len(pages), 5)
        result = subprocess.run(["node", "-e", """
            let slides = 0, images = 0, linkedScenarios = 0;
            let sharedPatternCards = 0;
            let dualPatternCards = 0, asrPatternCards = 0;
            const notes = [];
            const L = {
              data: {siteUrl: 'https://example.invalid/'},
              slide() {
                slides++;
                return {
                  addTable() {},
                  addNotes(text) { notes.push(text); }
                };
              },
              header() {}, box() {},
              txt(slide, text) {
                if (Array.isArray(text) && text.some(run => run.options?.hyperlink?.url.includes('#keys-pattern-'))) linkedScenarios++;
                if (Array.isArray(text)) {
                  if ([1, 4, 5].every(pattern => text.some(run => run.options?.hyperlink?.url.endsWith('#keys-pattern-' + pattern)))) sharedPatternCards++;
                  if ([2, 3].every(pattern => text.some(run => run.options?.hyperlink?.url.endsWith('#keys-pattern-' + pattern)))) {
                    dualPatternCards++;
                    if (!text.some(run => [4, 5].some(pattern => run.options?.hyperlink?.url.endsWith('#keys-pattern-' + pattern)))) asrPatternCards++;
                  }
                }
              },
              image(slide, file, box) {
                const png = require('fs').readFileSync(file);
                const ratio = png.readUInt32BE(16) / png.readUInt32BE(20);
                if (Math.abs(box.w / box.h - ratio) > 0.001) throw Error('Distorted diagram');
                images++;
              }
            };
            require('./decks/full/key-vault')({}, L);
            if (sharedPatternCards !== 5) throw Error('Single KEK cards must inherit all three shared patterns');
            if (dualPatternCards !== 4 || asrPatternCards !== 1) throw Error('Dual KEK cards must preserve scenario-specific pattern choices');
            if (!notes.some(text => text.includes('Purview Information Protection') && text.includes('Non-exportable keys') && text.includes('Default to Microsoft-managed keys'))) throw Error('Missing Purview guidance in notes');
            if (notes.some(text => text.includes('**Service-specific requirements:**'))) throw Error('Removed service-specific requirements remain in notes');
            console.log(JSON.stringify({slides, images, linkedScenarios}));
        """], cwd=ROOT, check=True, capture_output=True, text=True)
        self.assertEqual(json.loads(result.stdout), {"slides": 9, "images": 9, "linkedScenarios": 9})

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
