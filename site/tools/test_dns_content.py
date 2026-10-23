"""Check DNS publishing discovery and standalone HTML image conversion."""
import base64
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]


class DnsContentTests(unittest.TestCase):
    def test_whitepaper_contains_both_diagrams(self):
        pages = sorted((ROOT / "whitepaper" / "pages").glob("*-dns-*.html"))
        self.assertEqual(len(pages), 4)
        images = re.findall(r'<img src="([^"]+)"[^>]+alt="([^"]+)"',
                            "\n".join(p.read_text(encoding="utf-8") for p in pages))
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

    def test_executive_sources_do_not_include_dns_details(self):
        for page in (ROOT / "whitepaper" / "exec" / "pages").glob("*.html"):
            self.assertNotIn("private-dns-multi-region", page.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
