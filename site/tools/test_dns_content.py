"""Check DNS source discovery and conversion without writing distribution files."""
import base64
import importlib.util
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("word_build", ROOT / "word" / "build.py")
word = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = word
spec.loader.exec_module(word)


class DnsContentTests(unittest.TestCase):
    def test_full_word_discovers_dns_in_reading_order(self):
        groups = word.toc_outline()
        sections = word.full_sections(groups)
        keys = [section.key for section in sections]
        index = keys.index("private-dns-multi-region")
        self.assertEqual(keys[index - 1:index + 2], [
            "storage-backup-key-vault", "private-dns-multi-region", "resiliency-scenarios",
        ])
        toc = word.contents_markdown(groups, sections, brief=False)
        self.assertIn("[Private DNS zones](#art-private-dns-multi-region)", toc)
        self.assertEqual(sections[index].eyebrow, "Appendix A · Service behavior across regions")

    def test_word_converts_both_diagrams_and_table_break(self):
        sections = word.full_sections(word.toc_outline())
        section = next(s for s in sections if s.key == "private-dns-multi-region")
        with tempfile.TemporaryDirectory() as work:
            text = word.convert(section, {s.key for s in sections}, word.Images(work))
        for name in ("private-dns-global-zone", "private-dns-regional-zones"):
            self.assertIn(f"content/media/{name}.png", text)
        self.assertIn('alt="Architecture diagram', text)
        self.assertNotIn("<br>", text)
        self.assertIn("`<w:r><w:br/></w:r>`{=openxml}", text)
        self.assertNotIn("## Next step", text)

    def test_word_preserves_html_break_variants(self):
        section = word.Section("sample", "# Sample\n\nBefore<br>after<br/>next<BR />last", None, "", False)
        text = word.convert(section, {"sample"}, None)
        self.assertEqual(text.count("`<w:r><w:br/></w:r>`{=openxml}"), 3)

    def test_whitepaper_discovers_dns_after_key_vault(self):
        pages = sorted((ROOT / "whitepaper" / "pages").glob("*.html"))
        names = [page.name for page in pages]
        dns = [page for page in pages if page.name.startswith("22a4") and "-dns-" in page.name]
        self.assertEqual(len(dns), 4)
        self.assertLess(names.index("22a4-kvpattern.html"), names.index(dns[0].name))
        self.assertLess(names.index(dns[-1].name), names.index("22a5-resiliency-scenarios.html"))
        images = re.findall(r'<img src="([^"]+)"[^>]+alt="([^"]+)"', "\n".join(p.read_text(encoding="utf-8") for p in dns))
        self.assertEqual(len(images), 2)
        for src, alt in images:
            self.assertTrue((ROOT / "whitepaper" / src).is_file())
            self.assertTrue(alt.startswith("Architecture diagram"))

    def test_single_file_html_embeds_shared_dns_images(self):
        with tempfile.TemporaryDirectory() as work:
            source, target = Path(work) / "source.html", Path(work) / "standalone.html"
            source.write_text(
                '<link rel="stylesheet" href="styles.css">'
                '<img src="../content/media/private-dns-global-zone.png" alt="Global zone">'
                '<img src="../content/media/private-dns-regional-zones.png" alt="Regional zones">'
                '<script src="layout.js"></script>', encoding="utf-8")
            subprocess.run([sys.executable, str(ROOT / "whitepaper" / "inline.py"), str(source), str(target)],
                           check=True, capture_output=True, text=True)
            html = target.read_text(encoding="utf-8")
        self.assertNotIn("../content/media/", html)
        for name in ("private-dns-global-zone", "private-dns-regional-zones"):
            encoded = base64.b64encode((ROOT / "content" / "media" / f"{name}.png").read_bytes()).decode()
            self.assertIn(f"data:image/png;base64,{encoded}", html)

    def test_executive_sources_do_not_include_dns(self):
        sections = word.brief_sections(str(ROOT / "word" / "brief.md"))
        self.assertFalse(any("private-dns-multi-region" in section.body for section in sections))
        for page in (ROOT / "whitepaper" / "exec" / "pages").glob("*.html"):
            self.assertNotIn("private-dns-multi-region", page.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
