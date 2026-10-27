"""Check website-only pairing of Key Vault summaries and diagrams."""
import importlib.util
from pathlib import Path
import re
import unittest
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("site_build", ROOT / "site" / "build.py")
site_build = importlib.util.module_from_spec(spec)
spec.loader.exec_module(site_build)
spec = importlib.util.spec_from_file_location("keyvault", ROOT / "whitepaper" / "gen" / "keyvault.py")
keyvault = importlib.util.module_from_spec(spec)
spec.loader.exec_module(keyvault)


class KeyVaultLayoutTests(unittest.TestCase):
    def test_all_nine_patterns_are_paired(self):
        _, body = site_build.read_front_matter(ROOT / "content" / "key-vault-across-regions.md")
        store = []
        original = site_build.postprocess(site_build.expand_raw(site_build.render_md(body, store), store))
        result = site_build.key_vault_pattern_layout(original)
        self.assertEqual(result.count('class="kv-pattern"'), 9)
        self.assertEqual(result.count('class="kv-pattern-copy"'), 9)
        self.assertEqual(re.findall(r'<h[23]\b.*?</h[23]>', original),
                         re.findall(r'<h[23]\b.*?</h[23]>', result))
        self.assertEqual(re.findall(r'<figure\b.*?</figure>', original, re.S),
                         re.findall(r'<figure\b.*?</figure>', result, re.S))
        self.assertLess(result.rindex('class="kv-pattern"'), result.index('<h2 id="decision-tree">'))
        self.assertEqual(result.count('data-fig="key-vault-decision-tree"'), 1)

    def test_unrelated_patterns_are_unchanged(self):
        source = ('<h3 id="pattern">Pattern 1: Another service</h3><ul><li>Summary</li></ul>'
                  '<figure class="fig" data-fig="another-service">Diagram</figure>')
        self.assertEqual(site_build.key_vault_pattern_layout(source), source)

    def test_diagrams_share_source_and_region_geometry(self):
        self.assertEqual(set(keyvault.DIAGRAMS), {"S1", "S2", "K1", "K2", "K3", "K4", "K5", "K6", "K7"})
        for name, draw in keyvault.DIAGRAMS.items():
            with self.subTest(pattern=name):
                diagram = ET.fromstring(draw())
                self.assertEqual(diagram.get("viewBox"), "0 0 360 260")
                rectangles = diagram.findall(".//rect")
                sources = [r for r in rectangles if r.get("y") == "8"]
                self.assertEqual(len(sources), 1)
                self.assertEqual((sources[0].get("width"), sources[0].get("height")), ("220", "44"))
                regions = [r for r in rectangles if r.get("y") == "96"]
                self.assertEqual(len(regions), 2)
                self.assertTrue(all(r.get("width") == "150" and r.get("height") == "140" for r in regions))
                self.assertNotIn("Traffic Manager", draw())
                self.assertNotIn("#i-app", draw())
                if name in ("K4", "K6", "K7"):
                    self.assertIn(keyvault.HSM_SOURCE, draw())

    def test_distribution_and_replication_are_distinct(self):
        for name, draw in keyvault.DIAGRAMS.items():
            with self.subTest(pattern=name):
                paths = ET.fromstring(draw()).findall(".//path")
                self.assertEqual(sum(p.get("d", "").endswith("136 138") or p.get("d", "").endswith("336 138") for p in paths if "C" in p.get("d", "")),
                                 2 if name in ("S1", "K3", "K4") else 1)
                self.assertEqual(sum(p.get("d") == "M148 154 C170 142 190 138 212 150" for p in paths),
                                 1 if name in ("S2", "K1", "K2", "K5", "K6") else 0)
                self.assertEqual(sum(p.get("d") == "M212 170 C190 182 170 186 148 174" for p in paths),
                                 1 if name in ("K5", "K6") else 0)
        self.assertIn("Register key reference only", keyvault.d_k7())
        self.assertIn("No key material is imported or geo-replicated", keyvault.d_k7())

    def test_scenario_matrix_has_named_pattern_columns_and_nine_rows(self):
        _, body = site_build.read_front_matter(ROOT / "content" / "key-vault-across-regions.md")
        store = []
        result = site_build.key_vault_pattern_layout(
            site_build.postprocess(site_build.expand_raw(site_build.render_md(body, store), store)))
        self.assertLess(result.index('id="paired-and-nonpaired-regions"'), result.index("<table>"))
        start = result.index('id="common-key-management-scenarios"')
        table = result[start:].split("<table>", 1)[1].split("</table>", 1)[0]
        self.assertEqual(table.count("<tr>"), 10)
        self.assertEqual(len(re.findall(r">Pattern [1-7]</a>", table)), 7)
        self.assertEqual(table.count('scope="col"'), 8)
        self.assertEqual(table.count('scope="row"'), 9)
        self.assertIn('tabindex="0" role="region" aria-label="Common key-management scenarios"', result)
        self.assertNotRegex(re.sub(r"<[^>]+>", "", result), r"\b[KS][1-7]\b")

    def test_later_patterns_keep_side_by_side_layout(self):
        source = ('<h3 id="pattern-7">Pattern 7: External key management</h3>'
                  '<ul><li>Key remains outside Azure</li></ul>'
                  '<figure class="fig" data-fig="key-vault-keys-managed-hsm-ekm">Diagram</figure>')
        self.assertIn('class="kv-pattern"', site_build.key_vault_pattern_layout(source))

    def test_graphical_tree_covers_new_patterns_without_abbreviating_certificates(self):
        tree = keyvault.tree_svg()
        for i in range(1, 8):
            self.assertIn(f"Keys - Pattern {i}", tree)
        for i in (1, 2):
            self.assertIn(f"Secrets and certificates - Pattern {i}", tree)
        self.assertNotIn("Secrets pattern", tree)

    def test_standalone_figures_have_matching_export_sizes(self):
        import json
        manifest = json.loads((ROOT / "site" / "figures" / "manifest.json").read_text(encoding="utf-8"))
        sizes = {(manifest[name]["w"], manifest[name]["h"])
                 for name, key in keyvault.FIGNAMES.values() if key is not None}
        self.assertEqual(sizes, {(380, 273)})

    def test_pdf_source_keeps_five_pages_and_all_pattern_figures(self):
        pages = [keyvault.page1(), keyvault.page2(), keyvault.page3(), keyvault.page4(), keyvault.page5()]
        self.assertEqual(sum(p.count('<section class="page"') for p in pages), 5)
        combined = "".join(pages)
        for fid in keyvault.FIGNAMES:
            self.assertEqual(combined.count(f'id="{fid}"'), 1)
        self.assertLess(pages[0].index("Paired regions"), pages[0].index('id="figKVTiers"'))
        self.assertEqual(pages[0].count("<tr>"), 10)

    def test_decision_tree_export_is_not_clipped_by_the_pdf_page(self):
        import json
        manifest = json.loads((ROOT / "site" / "figures" / "manifest.json").read_text(encoding="utf-8"))
        self.assertEqual((manifest["key-vault-decision-tree"]["w"], manifest["key-vault-decision-tree"]["h"]),
                         (940, 562))


if __name__ == "__main__":
    unittest.main()
