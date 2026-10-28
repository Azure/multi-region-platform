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
    def test_all_eight_patterns_are_paired(self):
        _, body = site_build.read_front_matter(ROOT / "content" / "key-vault-across-regions.md")
        store = []
        original = site_build.postprocess(site_build.expand_raw(site_build.render_md(body, store), store))
        result = site_build.key_vault_pattern_layout(original)
        self.assertEqual(result.count('class="kv-pattern"'), 8)
        self.assertEqual(result.count('class="kv-pattern-copy"'), 8)
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
        self.assertEqual(set(keyvault.DIAGRAMS), {"S1", "S2", "K1", "K2", "K3", "K4", "K5", "K6"})
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
                if name in ("K3", "K5", "K6"):
                    self.assertIn(keyvault.HSM_SOURCE, draw())

    def test_distribution_and_replication_are_distinct(self):
        for name, draw in keyvault.DIAGRAMS.items():
            with self.subTest(pattern=name):
                paths = ET.fromstring(draw()).findall(".//path")
                self.assertEqual(sum(p.get("d", "").endswith("136 138") or p.get("d", "").endswith("336 138") for p in paths if "C" in p.get("d", "")),
                                 2 if name in ("S1", "K2", "K3") else 1)
                self.assertEqual(sum(p.get("d") == "M148 154 C170 142 190 138 212 150" for p in paths),
                                 1 if name in ("S2", "K1", "K4", "K5") else 0)
                self.assertEqual(sum(p.get("d") == "M212 170 C190 182 170 186 148 174" for p in paths),
                                 1 if name in ("K4", "K5") else 0)
        self.assertIn("Register key reference only", keyvault.d_k6())
        self.assertIn("No key material is imported or geo-replicated", keyvault.d_k6())

    def test_scenarios_use_linked_pattern_lists_instead_of_a_matrix(self):
        _, body = site_build.read_front_matter(ROOT / "content" / "key-vault-across-regions.md")
        store = []
        result = site_build.key_vault_pattern_layout(
            site_build.postprocess(site_build.expand_raw(site_build.render_md(body, store), store)))
        self.assertLess(result.index('id="paired-and-nonpaired-regions"'), result.index("<table>"))
        start = result.index('id="common-key-management-scenarios"')
        scenarios = result[start:].split('<h2 id="decision-tree">')[0]
        self.assertNotIn("<table>", scenarios)
        sections = re.split(r"<h3\b", scenarios)[1:]
        self.assertEqual(len(sections), 9)
        for section in sections:
            self.assertIn("<strong>Patterns you can use:</strong>", section)
            description = section.split("</h3>", 1)[1].split("<strong>Patterns you can use:</strong>", 1)[0]
            self.assertRegex(description, r"<p>(?!<strong>)")
            self.assertRegex(section, r'<a href="#keys-pattern-[1-6]">')
            self.assertIn("<ul>", section)
        grs = next(section for section in sections if section.startswith(' id="azure-storage-grs"'))
        self.assertNotIn('href="#keys-pattern-2"', grs)
        self.assertNotIn('href="#keys-pattern-3"', grs)
        for target, label in re.findall(r'<a href="#(keys-pattern-[1-6])">([^<]+)</a>', scenarios):
            title = re.search(rf'<h3 id="{target}">Pattern [1-6]: (.*?)<a class="anchor"', result).group(1)
            self.assertEqual(label, title)
        headers = re.findall(r"<thead>(.*?)</thead>", result, re.S)
        self.assertTrue(all(not re.search(r">Pattern \d", header) for header in headers))
        self.assertIn('>Standard or Premium vault with paired-region replication</a>', headers[2])
        self.assertIn('class="table-wrap kv-table kv-wide"', result)
        self.assertEqual(headers[2].count('<th scope="col">'), 7)
        self.assertIn('>Standard or Premium vault in each region</a>', headers[1])
        self.assertIn('>Standard or Premium vault in a paired region</a>', headers[1])
        for title in ("Standard or Premium vault in each region", "Standard or Premium vault in a paired region"):
            self.assertIn(title, keyvault.page2())
            self.assertIn(title, (ROOT / "decks" / "full" / "key-vault.js").read_text(encoding="utf-8"))
        self.assertNotRegex(re.sub(r"<[^>]+>", "", result), r"\b[KS][1-7]\b")

    def test_later_patterns_keep_side_by_side_layout(self):
        source = ('<h3 id="pattern-6">Pattern 6: External key management</h3>'
                  '<ul><li>Key remains outside Azure</li></ul>'
                  '<figure class="fig" data-fig="key-vault-keys-managed-hsm-ekm">Diagram</figure>')
        self.assertIn('class="kv-pattern"', site_build.key_vault_pattern_layout(source))

    def test_failover_guidance_is_explicit(self):
        _, body = site_build.read_front_matter(ROOT / "content" / "key-vault-across-regions.md")
        guidance = body.split("### Failover guidance", 1)[1].split("## Choose the product", 1)[0]
        for condition in ("same vault URI", "cannot trigger", "hours or longer",
                          "recent changes can be lost", "sign, verify", "firewall settings",
                          "exponential backoff", "20 minutes", "return to the primary",
                          "same subscription and Azure geography"):
            with self.subTest(condition=condition):
                self.assertIn(condition, guidance)
        self.assertIn("#failover-guidance", keyvault.page2())

    def test_failover_exclusions_are_evergreen_across_formats(self):
        _, body = site_build.read_front_matter(ROOT / "content" / "key-vault-across-regions.md")
        deck = (ROOT / "decks" / "full" / "key-vault.js").read_text(encoding="utf-8")
        callout = ("Microsoft-managed failover is not supported for non-paired regions, "
                   "regions with asymmetric pairing or paired regions across two different geographies.")
        references = (
            "https://learn.microsoft.com/azure/reliability/reliability-key-vault#microsoft-managed-failover-to-a-paired-region",
            "https://learn.microsoft.com/azure/key-vault/general/overview-security-worlds",
        )
        self.assertIn(f"> [!IMPORTANT]\n> *{callout}*", body)
        self.assertIn(f"<em>{callout}</em>", keyvault.page1())
        for source in (body, keyvault.page1(), keyvault.page5(), deck):
            with self.subTest(source=source[:60]):
                for url in references:
                    self.assertIn(url, source)
                for name in ("Brazil South", "Brazil Southeast", "West US 3", "East US",
                             "South Central US", "Qatar Central", "Belgium Central", "Spain Central"):
                    self.assertNotIn(name, source)
        self.assertIn(callout, deck)

    def test_scenario_sections_preserve_removed_matrix_conditions(self):
        _, body = site_build.read_front_matter(ROOT / "content" / "key-vault-across-regions.md")
        scenarios = body.split("## Common key-management scenarios", 1)[1].split("## Decision tree", 1)[0]
        sections = {re.sub(r" \{#[^}]+\}$", "", title): text
                    for title, text in re.findall(r"### ([^\n]+)\n(.*?)(?=\n### |\Z)", scenarios, re.S)}
        conditions = {
            "Application-level encryption": (
                "software-protected", "HSM-protected", "independent regional keys",
                "imported keys", "supported external-key operations", "restricted operation set"),
            "Azure Storage - Geo-redundant storage (GRS)": (
                "Microsoft-managed vault recovery", "shared key", "proxy availability",
                "no external-key geo-replication", "different key store to each GRS replica"),
            "Azure Storage - Object replication for block blobs": (
                "independent keys", "import and authorize", "each account's CMK integration",
                "proxy and external HSM", "separate accounts"),
            "VM disk encryption": (
                "regional imports", "Disk Encryption Sets", "same-region requirements",
                "imported key", "supported disk profiles", "does not support Secure Key Release"),
            "Azure Site Recovery": (
                "target-region", "imported key", "does not provision",
                "Do not assume Managed HSM or EKM support", "cache storage account"),
            "PostgreSQL and MySQL Flexible Server": (
                "product and recovery feature", "key and identity", "validate key import",
                "Managed HSM support", "recovery feature separately", "geo-redundant backups"),
            "Azure SQL Database, Azure SQL Managed Instance and Azure Cosmos DB geo-replication": (
                "shared-key dependencies", "Microsoft-managed recovery risk",
                "key-copy and rotation design", "imported-key lifecycle",
                "no geo-replicated failover target", "Cosmos DB"),
            "Azure SQL Database, Azure SQL Managed Instance and Azure Cosmos DB geo-restore": (
                "original keys", "newly generated regional keys cannot replace",
                "historical key availability", "external-key backup/restore is not supported",
                "authorize the restored service"),
            "Purview Information Protection": (
                "preserve keys for old content", "dedicated Premium vault",
                "feature-specific confirmation", "external-key operations",
                "not applicable", "Microsoft 365 Customer Key"),
        }
        self.assertEqual(set(sections), set(conditions))
        for title, phrases in conditions.items():
            for phrase in phrases:
                with self.subTest(scenario=title, condition=phrase):
                    self.assertIn(phrase, sections[title])

    def test_graphical_tree_covers_new_patterns_without_abbreviating_certificates(self):
        tree = keyvault.tree_svg()
        text = " ".join(ET.fromstring(f"<svg>{tree}</svg>").itertext())
        _, body = site_build.read_front_matter(ROOT / "content" / "key-vault-across-regions.md")
        for title in re.findall(r"### Pattern \d: (.*?) \{#", body):
            self.assertIn(title, text)
        self.assertNotRegex(text, r"Pattern \d")
        self.assertIn("Standard: software protection; Premium: HSM protection", tree)
        self.assertIn("Secrets and certificates", tree)
        self.assertNotIn("Secrets pattern", tree)

    def test_decision_tree_pattern_boxes_share_colors(self):
        tree = ET.fromstring(f"<svg>{keyvault.tree_svg()}</svg>")
        results = [rect for rect in tree.findall("rect") if rect.get("x") == "850"]
        self.assertEqual(len(results), 8)
        self.assertEqual({(rect.get("fill"), rect.get("stroke")) for rect in results},
                         {("#EEF5FC", "#0F6CBD")})
        labels = [text for text in tree.findall("text") if text.get("x") == "860"]
        self.assertEqual({text.get("fill") for text in labels}, {"#0B3A63", "#0F548C"})

    def test_paired_region_pattern_combines_tiers_without_broadening_service_support(self):
        _, body = site_build.read_front_matter(ROOT / "content" / "key-vault-across-regions.md")
        headings = re.findall(r"### Pattern (\d): (.*?) \{#keys-pattern-(\d)\}", body)
        self.assertEqual([number for number, _, _ in headings], list("123456"))
        self.assertTrue(all(number == anchor for number, _, anchor in headings))
        self.assertEqual(headings[0][1], "Standard or Premium vault with paired-region replication")
        self.assertNotIn("#keys-pattern-7", body)
        pattern = body.split("## Keys\n", 1)[1].split("### Pattern 1:", 1)[1].split("### Pattern 2:", 1)[0]
        for phrase in ("Standard for software-protected", "Premium for HSM-protected",
                       "Premium does not improve regional recovery control", "Read-only",
                       "no key creation or rotation", "key-vault-keys-paired-region.png"):
            self.assertIn(phrase, pattern)
        purview = body.split("### Purview Information Protection", 1)[1].split("## Decision tree", 1)[0]
        self.assertIn("(#keys-pattern-1), using Premium", purview)
        self.assertIn("Standard software-protected keys require feature-specific confirmation", purview)
        suitable, conditional = purview.split("**External key management requires feature-specific confirmation:**", 1)
        for pattern in (4, 5):
            self.assertIn(f"(#keys-pattern-{pattern})", suitable)
            self.assertNotIn(f"(#keys-pattern-{pattern})", conditional)
        self.assertIn("(#keys-pattern-6)", conditional)
        self.assertNotIn("(#keys-pattern-6)", suitable)
        self.assertIn("Standard: software / Premium: HSM", keyvault.d_k1())

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
        self.assertNotIn("<table", pages[0])
        self.assertEqual(len(re.findall(r'href="[^"]+#(?:application-level-encryption|azure-storage-grs|storage-object-replication|vm-disk-encryption|azure-site-recovery|postgresql-and-mysql-flexible-server|database-geo-replication|database-geo-restore|purview-information-protection)"', pages[0])), 9)

    def test_decision_tree_export_is_not_clipped_by_the_pdf_page(self):
        import json
        manifest = json.loads((ROOT / "site" / "figures" / "manifest.json").read_text(encoding="utf-8"))
        self.assertEqual((manifest["key-vault-decision-tree"]["w"], manifest["key-vault-decision-tree"]["h"]),
                         (940, 562))


if __name__ == "__main__":
    unittest.main()
