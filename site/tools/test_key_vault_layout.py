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
    def test_summary_summarizes_three_recovery_scenarios(self):
        _, body = site_build.read_front_matter(ROOT / "content" / "key-vault-across-regions.md")
        self.assertLess(body.index("## Summary"), body.index("## Microsoft-managed failover\n"))
        self.assertNotIn("## TL;DR", body)
        summary = body.split("## Summary\n", 1)[1].split("\n## ", 1)[0]
        self.assertNotIn("**Secrets and Certificates management patterns**", summary)
        self.assertNotIn("**Key management patterns**", summary)
        bullets = re.findall(r"^- (.+)$", summary, re.M)
        self.assertEqual(len(bullets), 3)
        for bullet, conditions in zip(bullets, (
                ("**Certificates and secrets:**", "(#secrets-certificates-pattern-1)",
                 "deployment pipelines", "customer-managed application failover"),
                ("**Single KEK (key encryption key):**", "(#keys-pattern-1)",
                 "Microsoft-managed failover", "primary and paired vault regions do not need to match",
                 "Alternative: [Managed HSM with geo-replication](#keys-pattern-4)"),
                ("**Dual KEK (key encryption key):**", "(#keys-pattern-2)",
                 "deployment pipelines", "customer-managed application failover",
                 "Alternative: [Managed HSM with geo-replication](#keys-pattern-4)"))):
            for condition in conditions:
                with self.subTest(condition=condition):
                    self.assertIn(condition, bullet)
        self.assertNotIn("EXAMPLE SCENARIOS", summary)
        self.assertNotIn("[!NOTE]", summary)
        store = []
        rendered = site_build.expand_raw(site_build.render_md(summary, store), store)
        self.assertNotIn('class="alert', rendered)
        self.assertEqual(rendered.count("<ul>"), 1)
        self.assertEqual(rendered.count("<li>"), 3)
        self.assertNotIn("Confirm the consuming service's support", summary)

    def test_alert_titles_preserve_defaults_and_escape_custom_text(self):
        for marker, title in (
                ("[!NOTE]", "Note"),
                ("[!IMPORTANT]", "Important"),
                ("[!NOTE] EXAMPLE SCENARIOS", "EXAMPLE SCENARIOS"),
                ('[!NOTE] <custom> & "title"', "&lt;custom&gt; &amp; &quot;title&quot;")):
            with self.subTest(marker=marker):
                store = []
                rendered = site_build.expand_raw(site_build.render_md(f"> {marker}\n> Content.", store), store)
                self.assertIn(f"</svg>{title}</p>", rendered)
                self.assertIn("<p>Content.</p>", rendered)

    def test_all_eight_patterns_are_paired(self):
        _, body = site_build.read_front_matter(ROOT / "content" / "key-vault-across-regions.md")
        store = []
        original = site_build.postprocess(site_build.expand_raw(site_build.render_md(body, store), store))
        result = site_build.key_vault_pattern_layout(original)
        self.assertEqual(result.count('class="kv-pattern"'), 8)
        self.assertEqual(result.count('class="kv-pattern-copy"'), 8)
        self.assertIn('id="secrets-certificates-pattern-2"', result)
        self.assertEqual(result.count('data-fig="key-vault-secrets-paired-region"'), 1)
        secrets_tree = keyvault.tree_svg().split("Keys - validate", 1)[0]
        self.assertIn("in a paired region", secrets_tree)
        self.assertIn("in each region", secrets_tree)
        self.assertEqual(re.findall(r'<h[23]\b.*?</h[23]>', original),
                         re.findall(r'<h[23]\b.*?</h[23]>', result))
        self.assertEqual(re.findall(r'<figure\b.*?</figure>', original, re.S),
                         re.findall(r'<figure\b.*?</figure>', result, re.S))
        self.assertLess(result.rindex('class="kv-pattern"'), result.index('<h2 id="decision-tree">'))
        self.assertEqual(result.count('data-fig="key-vault-decision-tree"'), 1)

    def test_restored_secrets_paired_pattern_preserves_recovery_constraints(self):
        _, body = site_build.read_front_matter(ROOT / "content" / "key-vault-across-regions.md")
        secrets = body.split("## Secrets and certificates patterns {#secrets-and-certificates}", 1)[1].split(
            "\n## Keys management patterns", 1)[0]
        pattern = secrets.split("### Pattern 2: Standard or Premium vault in a paired region", 1)[1]
        self.assertIn("{#secrets-certificates-pattern-2}", pattern)
        for condition in ("Microsoft-managed paired-region replication",
                          "Microsoft asynchronously replicates",
                          "Microsoft decides when to fail over",
                          "cannot create, update, renew, or rotate",
                          "Microsoft-managed recovery timing and read-only access",
                          "same-geography pairing, service exclusions",
                          "key-vault-secrets-paired-region.png"):
            self.assertIn(condition, pattern)
        self.assertIn("independent regional vaults", secrets)
        self.assertIn("a vault with Microsoft-managed paired-region replication", secrets)
        self.assertEqual(len(re.findall(r"^### Pattern ", secrets, re.M)), 2)

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

    def test_application_secrets_scenario_precedes_single_kek_scenarios(self):
        _, body = site_build.read_front_matter(ROOT / "content" / "key-vault-across-regions.md")
        store = []
        result = site_build.key_vault_pattern_layout(
            site_build.postprocess(site_build.expand_raw(site_build.render_md(body, store), store)))
        heading = '<h2 id="secrets-and-certificates-scenarios">'
        single = '<h2 id="single-kek-key-encryption-key-scenarios">'
        self.assertEqual(result.count(heading), 1)
        self.assertLess(result.index(heading), result.index(single))
        scenario = result.split(heading, 1)[1].split(single, 1)[0]
        self.assertNotIn("<h3", scenario)
        self.assertNotIn("Application-level secrets or certificates", scenario)
        self.assertIn('<a id="application-level-secrets-or-certificates"></a>', scenario)
        self.assertIn("<strong>Patterns you can use:</strong>", scenario)
        self.assertIn('<a href="#secrets-certificates-pattern-1">Standard or Premium vault in each region</a>', scenario)
        self.assertEqual(scenario.count('data-fig="key-vault-secrets-per-region"'), 1)
        self.assertLess(scenario.index('href="#secrets-certificates-pattern-1"'),
                        scenario.index('data-fig="key-vault-secrets-per-region"'))
        self.assertIn('class="table-wrap kv-table kv-illustrated"', scenario)
        self.assertEqual(re.findall(r'<th scope="col">(.*?)</th>', scenario),
                         ["Pattern", "Object provisioning", "Recovery behavior", "Diagram"])
        table_body = re.search(r"<tbody>(.*?)</tbody>", scenario, re.S).group(1)
        rows = re.findall(r"<tr>(.*?)</tr>", table_body, re.S)
        self.assertEqual(len(rows), 1)
        self.assertEqual(len(re.findall(r"<t[hd]\b", rows[0])), 4)
        self.assertEqual(rows[0].count('data-fig="key-vault-secrets-per-region"'), 1)
        self.assertIn("deployment pipeline populates each regional vault", rows[0])
        self.assertIn("The application manages failover", rows[0])
        self.assertIn('class="fig-zoom"', rows[0])
        self.assertIn('class="fig-png"', rows[0])
        self.assertNotIn("<figure", scenario.split("</table>", 1)[1])
        self.assertNotIn("<ul>", scenario)
        self.assertNotIn(":::image", scenario)
        self.assertNotIn("RAWBLOCK", scenario)
        patterns = result.split('<h2 id="secrets-and-certificates">', 1)[1].split('<h2 id="keys">', 1)[0]
        self.assertEqual(patterns.count('data-fig="key-vault-secrets-per-region"'), 1)
        for condition in ("independent secrets and certificates", "shares common ones",
                          "Key Vault in its own region", "optionally fail over",
                          "recovery region", "if its primary region is unavailable"):
            self.assertIn(condition, scenario)

    def test_database_geo_replication_description_explains_key_access_and_rotation(self):
        _, body = site_build.read_front_matter(ROOT / "content" / "key-vault-across-regions.md")
        description = body.split(
            "### Azure SQL Database, Azure SQL Managed Instance and Azure Cosmos DB geo-replication {#database-geo-replication}\n",
            1)[1].split("\n### ", 1)[0]
        self.assertEqual(len(re.findall(r"^- ", description, re.M)), 3)
        for condition in ("same Azure Key Vault as the primary",
                          "When replicating across countries",
                          "online key rotation",
                          "both primary and secondary database instances to be online",
                          "Azure Key Vault instances to be accessible",
                          "unsuitable as a disaster recovery solution",
                          "concerns do not apply",
                          "Microsoft-managed keys (MMK)",
                          "Azure Key Vault Managed HSM is the preferred solution",
                          "where supported by the consuming database service",
                          "supported region of choice",
                          "single-tenant Azure Key Vault Managed HSM",
                          "failover preserves the Azure Key Vault Managed HSM endpoint's fully qualified domain name (FQDN)",
                          "[SQL customer-managed TDE]",
                          "[Cosmos DB CMKs]"):
            self.assertIn(condition, description)

    def test_single_kek_description_explains_shared_key_and_recovery(self):
        _, body = site_build.read_front_matter(ROOT / "content" / "key-vault-across-regions.md")
        description = body.split("## Single KEK (key encryption key) scenarios\n", 1)[1].split("\n### ", 1)[0]
        self.assertIn("> [!IMPORTANT]\n> Key Vault regions can be selected independently", description)
        self.assertLess(description.index("Recovery requires"), description.index("> [!IMPORTANT]"))
        self.assertEqual(body.count("Key Vault regions can be selected independently of the consuming services' regions."), 1)
        important = description.split("> [!IMPORTANT]\n", 1)[1]
        for condition in ("Standard or Premium vaults", "reciprocal region pair",
                          "same Azure geography", "Microsoft-managed failover to the paired region",
                          "recovery during a regional outage", "best effort",
                          "without a guaranteed recovery time"):
            self.assertIn(condition, important)
        for condition in ("shared key encryption key", "data encryption keys (DEKs)",
                          "DEKs encrypt the data", "KEK wraps and unwraps",
                          "original key material", "historical versions"):
            self.assertIn(condition, description)
        self.assertNotIn("The key can be replicated or copied", description)

    def test_dual_kek_description_explains_independent_regional_keys(self):
        _, body = site_build.read_front_matter(ROOT / "content" / "key-vault-across-regions.md")
        self.assertNotIn("## Common key-management scenarios", body)
        description = body.split("## Dual KEK (key encryption key) scenarios\n", 1)[1].split("\n### ", 1)[0]
        for condition in ("separate key encryption keys", "primary and recovery regions",
                          "data encryption keys (DEKs)", "must support independent regional keys",
                          "recovery data decryptable", "preserve the key material and versions"):
            self.assertIn(condition, description)

    def test_single_and_dual_kek_scenarios_each_share_one_pattern_table(self):
        _, body = site_build.read_front_matter(ROOT / "content" / "key-vault-across-regions.md")
        store = []
        result = site_build.key_vault_pattern_layout(
            site_build.postprocess(site_build.expand_raw(site_build.render_md(body, store), store)))
        self.assertNotIn('id="paired-and-nonpaired-regions"', result)
        self.assertLess(result.index('id="failover-guidance"'), result.index("<table>"))
        self.assertNotIn('id="common-key-management-scenarios"', result)
        dual_heading = '<h2 id="dual-kek-key-encryption-key-scenarios">'
        dual = result.split(dual_heading, 1)[1].split('<h2 id="secrets-and-certificates">', 1)[0]
        single = result.split('<h2 id="single-kek-key-encryption-key-scenarios">', 1)[1].split(dual_heading, 1)[0]
        self.assertLess(result.index('<h2 id="single-kek-key-encryption-key-scenarios">'), result.index(dual_heading))
        self.assertLess(result.index(dual_heading), result.index('<h2 id="secrets-and-certificates">'))
        self.assertEqual(len(re.findall(r"<h3\b", single)), 5)
        self.assertEqual(len(re.findall(r"<h3\b", dual)), 5)
        shared = single.split("<h3", 1)[0]
        self.assertEqual(single.count("<strong>Patterns you can use:</strong>"), 1)
        self.assertIn("<strong>Patterns you can use:</strong>", shared)
        self.assertIn("subject to each service's requirements", shared)
        self.assertIn("Both data copies depend on Microsoft-managed vault recovery.", shared)
        self.assertIn("Maintain access to the shared key through geo-replication", shared)
        self.assertEqual(re.findall(r'<th scope="col">(.*?)</th>', shared),
                         ["Pattern", "Key origin", "Recovery behavior", "Diagram"])
        self.assertIn('class="table-wrap kv-table kv-illustrated"', shared)
        table_body = re.search(r"<tbody>(.*?)</tbody>", shared, re.S).group(1)
        rows = re.findall(r"<tr>(.*?)</tr>", table_body, re.S)
        self.assertEqual(len(rows), 3)
        for row, pattern, origin, recovery in zip(rows, (1, 4, 5),
                ("software-protected in Standard or HSM-protected in Premium",
                 "Created in Managed HSM", "Created in an external HSM and imported using BYOK"),
                ("read-only", "both regions support reads and writes", "both regions support reads and writes")):
            self.assertIn(f'href="#keys-pattern-{pattern}"', row)
            self.assertIn(origin, row)
            self.assertIn(recovery, row)
            self.assertEqual(len(re.findall(r"<t[hd]\b", row)), 4)
            self.assertEqual(row.count("<figure"), 1)
            self.assertIn('class="fig-zoom"', row)
            self.assertIn('class="fig-png"', row)
        self.assertNotIn("<ul>", shared)
        self.assertNotIn(":::image", shared)
        self.assertNotIn("RAWBLOCK", shared)
        self.assertNotIn("<figure", shared.split("</table>", 1)[1])
        for pattern in (1, 4, 5):
            self.assertEqual(single.count(f'href="#keys-pattern-{pattern}"'), 1)
            self.assertIn(f'href="#keys-pattern-{pattern}"', shared)
        for pattern in (2, 3, 6):
            self.assertNotIn(f'href="#keys-pattern-{pattern}"', single)
        figures = ("key-vault-keys-paired-region", "key-vault-keys-managed-hsm-geo",
                   "key-vault-keys-managed-hsm-geo-byok")
        self.assertEqual(re.findall(r'data-fig="([^"]+)"', shared), list(figures))
        patterns = result.split('<h2 id="keys">', 1)[1]
        for figure in figures:
            self.assertEqual(single.count(f'data-fig="{figure}"'), 1)
            self.assertEqual(patterns.count(f'data-fig="{figure}"'), 1)
        single_application = re.search(r'<h3 id="application-level-encryption-single-kek">.*?(?=<h3|\Z)', single, re.S).group(0)
        dual_application = re.search(r'<h3 id="application-level-encryption">.*?(?=<h3|\Z)', dual, re.S).group(0)
        self.assertIn("Application-level encryption commonly uses one shared KEK across regions", single_application)
        self.assertIn("a design choice, not a technical requirement", single_application)
        self.assertIn("you control the encryption algorithm and key-management logic", single_application)
        self.assertIn('href="#dual-kek-key-encryption-key-scenarios"', single_application)
        self.assertIn("with separate regional keys", single_application)
        self.assertNotIn("Your application has constraints or requirements", single_application)
        self.assertNotIn("Your application decides whether", single_application)
        self.assertIn("Your application decides whether each region uses an independent key or a common key.", dual_application)
        self.assertEqual(single_application.count("<li>"), 1)
        self.assertNotRegex(dual_application, r'href="#keys-pattern-[1-6]"')
        self.assertNotIn('href="#keys-pattern-6"', dual_application)
        self.assertNotIn('href="#keys-pattern-1"', dual_application)
        self.assertNotIn("<li>", dual_application)
        self.assertEqual(result.count('id="application-level-encryption-single-kek"'), 1)
        for anchor in ("azure-storage-grs", "database-geo-replication", "database-geo-restore",
                       "purview-information-protection"):
            self.assertIn(f'<h3 id="{anchor}">', single)
            self.assertNotIn(f'<h3 id="{anchor}">', dual)
            self.assertEqual(result.count(f'<h3 id="{anchor}">'), 1)
        storage_grs = re.search(r'<h3 id="azure-storage-grs">.*?(?=<h3|\Z)', single, re.S).group(0)
        for description in ("Azure Storage wraps the root data encryption key",
                            "remains encrypted at all times",
                            "Protection by customer-managed keys takes effect immediately.",
                            "Both primary and secondary storage account replicas need access to the same Key Vault or Managed HSM",
                            "Independent regional vaults do not let you assign a different key store to each GRS replica."):
            self.assertIn(description, storage_grs)
        dual_anchors = ("application-level-encryption", "storage-object-replication",
                        "postgresql-and-mysql-flexible-server", "vm-disk-encryption", "azure-site-recovery")
        self.assertEqual(re.findall(r'<h3 id="([^"]+)">', dual), list(dual_anchors))
        for anchor in dual_anchors:
            self.assertIn(f'<h3 id="{anchor}">', dual)
            self.assertNotIn(f'<h3 id="{anchor}">', single)
            self.assertEqual(result.count(f'<h3 id="{anchor}">'), 1)
        scenarios = single + dual
        self.assertEqual(single.count("<table>"), 1)
        self.assertEqual(dual.count("<table>"), 1)
        sections = re.split(r"<h3\b", scenarios)[1:]
        self.assertEqual(len(sections), 10)
        for section in re.split(r"<h3\b", dual)[1:]:
            description = section.split("</h3>", 1)[1].split("<strong>Patterns you can use:</strong>", 1)[0]
            self.assertRegex(description, r"<p>(?!<strong>)")
        for section in re.split(r"<h3\b", single)[1:]:
            description = section.split("</h3>", 1)[1].split('<div class="admonition', 1)[0]
            self.assertRegex(description, r"^\s*<ul>\s*<li>")
            self.assertNotIn("<strong>Patterns you can use:</strong>", section)
            self.assertNotRegex(section, r'href="#keys-pattern-[1-6]"')
            self.assertNotIn("<figure", section)
        shared_dual = dual.split("<h3", 1)[0]
        self.assertEqual(dual.count("<strong>Patterns you can use:</strong>"), 1)
        self.assertIn("<strong>Patterns you can use:</strong>", shared_dual)
        self.assertNotIn("For Azure Site Recovery, only the two regional-vault patterns apply.", shared_dual)
        self.assertIn('class="table-wrap kv-table kv-illustrated"', shared_dual)
        self.assertEqual(re.findall(r'<th scope="col">(.*?)</th>', shared_dual),
                         ["Pattern", "Key origin", "Recovery behavior", "Diagram"])
        table_body = re.search(r"<tbody>(.*?)</tbody>", shared_dual, re.S).group(1)
        self.assertEqual(re.findall(r'href="#keys-pattern-(\d)"', table_body), ["2", "3", "4", "5"])
        rows = re.findall(r"<tr>(.*?)</tr>", table_body, re.S)
        self.assertEqual(len(rows), 4)
        dual_figures = ("key-vault-keys-vault-per-region", "key-vault-keys-byok-per-region",
                       "key-vault-keys-managed-hsm-geo", "key-vault-keys-managed-hsm-geo-byok")
        for row, figure in zip(rows, dual_figures):
            self.assertEqual(len(re.findall(r"<t[hd]\b", row)), 4)
            self.assertEqual(re.findall(r'data-fig="([^"]+)"', row), [figure])
            self.assertIn('class="fig-zoom"', row)
            self.assertIn('class="fig-png"', row)
            self.assertEqual(dual.count(f'data-fig="{figure}"'), 1)
            self.assertEqual(patterns.count(f'data-fig="{figure}"'), 1)
        self.assertNotIn(":::image", shared_dual)
        self.assertNotIn("RAWBLOCK", shared_dual)
        for section, anchor in zip(re.split(r"<h3\b", dual)[1:], dual_anchors):
            self.assertNotIn("<strong>Patterns you can use:</strong>", section)
            self.assertNotIn("<table>", section)
            self.assertNotIn("<figure", section)
            if anchor == "azure-site-recovery":
                self.assertIn("Use only", section)
                self.assertEqual(re.findall(r'href="#keys-pattern-(\d)"', section), ["2", "3"])
            else:
                self.assertNotRegex(section, r'href="#keys-pattern-[1-6]"')
        grs = next(section for section in sections if section.startswith(' id="azure-storage-grs"'))
        self.assertNotIn('href="#keys-pattern-2"', grs)
        self.assertNotIn('href="#keys-pattern-3"', grs)
        self.assertNotIn('href="#keys-pattern-6"', grs)
        for target, label in re.findall(r'<a href="#(keys-pattern-[1-6])">([^<]+)</a>', scenarios):
            title = re.search(rf'<h3 id="{target}">Pattern [1-6]: (.*?)<a class="anchor"', result).group(1)
            self.assertEqual(label, title)
        headers = re.findall(r"<thead>(.*?)</thead>", result, re.S)
        self.assertTrue(all(not re.search(r">Pattern \d", header) for header in headers))
        keys_header = next(header for header in headers if 'href="#keys-pattern-1"' in header)
        self.assertIn('>Standard or Premium vault with paired-region replication</a>', keys_header)
        self.assertIn('class="table-wrap kv-table kv-wide"', result)
        self.assertEqual(keys_header.count('<th scope="col">'), 7)
        self.assertIn('<h2 id="secrets-and-certificates">Secrets and certificates patterns', result)
        self.assertIn('<h2 id="keys">Keys management patterns', result)
        self.assertLess(result.index('<h2 id="single-kek-key-encryption-key-scenarios">'),
                        result.index('<h2 id="secrets-and-certificates">'))
        self.assertLess(result.index('<h2 id="secrets-and-certificates">'), result.index('<h2 id="keys">'))
        secrets = result.split('<h2 id="secrets-and-certificates">', 1)[1].split('<h2 id="keys">', 1)[0]
        self.assertNotIn("<table>", secrets)
        self.assertIn('id="secrets-certificates-pattern-1"', secrets)
        self.assertEqual(secrets.count("Treat each independent region as a deployment stamp."), 1)
        self.assertLess(secrets.index("Treat each independent region"), secrets.index('id="secrets-certificates-pattern-1"'))
        deck = (ROOT / "decks" / "full" / "key-vault.js").read_text(encoding="utf-8")
        for source in (keyvault.page2(), deck):
            self.assertIn("Standard or Premium vault in each region", source)
            self.assertIn("Standard or Premium vault in a paired region", source)
        self.assertNotRegex(re.sub(r"<[^>]+>", "", result), r"\b[KS][1-7]\b")

    def test_later_patterns_keep_side_by_side_layout(self):
        source = ('<h3 id="pattern-6">Pattern 6: External key management</h3>'
                  '<ul><li>Key remains outside Azure</li></ul>'
                  '<figure class="fig" data-fig="key-vault-keys-managed-hsm-ekm">Diagram</figure>')
        self.assertIn('class="kv-pattern"', site_build.key_vault_pattern_layout(source))

    def test_failover_guidance_is_explicit(self):
        _, body = site_build.read_front_matter(ROOT / "content" / "key-vault-across-regions.md")
        self.assertNotIn("\n## Failover Guidance\n", body)
        self.assertNotIn("\n## Choose the product\n", body)
        self.assertIn('<a id="failover-guidance"></a>', body)
        for heading in ("Microsoft-managed failover", "Customer-managed failover"):
            self.assertIn(f"\n## {heading}\n", body)
            self.assertNotIn(f"\n### {heading}\n", body)
        for heading in ("Microsoft-managed failover for Azure Key Vault Standard or Premium",
                        "Microsoft-managed failover for Azure Key Vault Managed HSM"):
            self.assertIn(f"\n### {heading}\n", body)
            self.assertNotIn(f"\n## {heading}\n", body)
        store = []
        result = site_build.render_md(body, store)
        parent = result.index('<h2 id="microsoft-managed-failover">')
        standard = result.index('<h3 id="microsoft-managed-failover-for-azure-key-vault-standard-or-premium">')
        hsm = result.index('<h3 id="microsoft-managed-failover-for-azure-key-vault-managed-hsm">')
        customer_heading = result.index('<h2 id="customer-managed-failover">')
        self.assertLess(parent, standard)
        self.assertLess(standard, hsm)
        self.assertLess(hsm, customer_heading)
        guidance = body[body.index("## Microsoft-managed failover\n"):]
        guidance = guidance.split("## Secrets and certificates scenarios", 1)[0]
        microsoft, customer = guidance.split("## Customer-managed failover", 1)
        microsoft = microsoft.split("### Microsoft-managed failover for Azure Key Vault Standard or Premium", 1)[1]
        microsoft = microsoft.split("### Microsoft-managed failover for Azure Key Vault Managed HSM", 1)[0]
        self.assertTrue(microsoft.strip().startswith("Keep using the same vault URI;"))
        important = microsoft.split("> [!IMPORTANT]\n", 1)[1].split("\n\n", 1)[0]
        self.assertEqual(important.count("> - "), 2)
        for condition in ("best effort", "total outage duration", "additional 20 minutes",
                          "dual KEK (key encryption key)", "do not need to be in the same region",
                          "consuming-service-specific requirements"):
            self.assertIn(condition, important)
        self.assertLess(microsoft.index("> [!IMPORTANT]"), microsoft.index("| Scenario |"))
        table = microsoft.split("| Scenario |", 1)[1].split("\n\n", 1)[0]
        self.assertNotIn("| Service |", microsoft)
        self.assertIn("| Reciprocally paired regions within the same geography | Supported |", table)
        exclusions = "https://learn.microsoft.com/azure/reliability/reliability-key-vault#microsoft-managed-failover-to-a-paired-region"
        for scenario in ("Paired regions in different geographies",
                         "Nonreciprocal (asymmetric) region pairing", "Regions without a pair"):
            self.assertIn(f"| {scenario} | [Unsupported]({exclusions}) |", table)
        self.assertEqual(table.count("https://learn.microsoft.com/azure/reliability/regions-list"), 2)
        for removed in ("**Read-only does not mean cryptography stops:**",
                        "**Application readiness:**"):
            self.assertNotIn(removed, microsoft)
        self.assertIn("> [!IMPORTANT]\n> - Prepare identities", customer)
        self.assertNotIn("**Customer-controlled recovery:**", guidance)
        important = customer.split("> [!IMPORTANT]\n", 1)[1].split("\n\n", 1)[0]
        self.assertEqual(important.count("> - "), 3)
        for condition in ("same vault URI", "cannot trigger", "hours or longer",
                          "recent changes can be lost", "return to the primary",
                          "same subscription and Azure geography"):
            with self.subTest(condition=condition):
                self.assertIn(condition, guidance)
        self.assertIn("#failover-guidance", keyvault.page2())
        for heading in ("Standard/Premium failover", "Customer-managed failover"):
            self.assertIn(f"<h4>{heading}</h4>", keyvault.page2())

    def test_customer_managed_failover_compares_product_patterns(self):
        _, body = site_build.read_front_matter(ROOT / "content" / "key-vault-across-regions.md")
        store = []
        result = site_build.postprocess(site_build.expand_raw(site_build.render_md(body, store), store))
        customer = result.split('id="customer-managed-failover"', 1)[1].split('id="secrets-and-certificates"', 1)[0]
        self.assertIn("recovery time objectives (RTOs)", customer)
        self.assertIn("choose regions for your workloads", customer)
        self.assertLess(customer.index("Prepare identities"), customer.index("<table>"))
        table = re.search(r"<table>.*?</table>", customer, re.S).group(0)
        rows = re.findall(r"<tr>.*?</tr>", table, re.S)
        self.assertEqual(len(rows), 3)
        self.assertEqual(len(re.findall(r"<th\b", rows[0])), 4)
        self.assertIn("Failover behaviour", rows[0])
        self.assertNotRegex(table, r"<(?:strong|b)\b")
        for row in rows[1:]:
            cells = re.findall(r"<td\b[^>]*>.*?</td>", row, re.S)
            self.assertEqual(len(cells), 4)
            for cell in cells[1:]:
                self.assertIn("<ul>", cell)
                self.assertIn("<li>", cell)
                self.assertNotIn("<br", cell)
            self.assertIn("Use SDK retries with exponential backoff and respect DNS TTL.", cells[3])
        for condition in ("Key Vault Standard or Premium (Keys, Secrets, Certificates)", 'href="#secrets-certificates-pattern-1"',
                          "automation pipeline", "on-premises HSM", 'href="#keys-pattern-3"',
                          "HSM-backed BYOK requires Premium, not Standard",
                          "application fallback to the recovery region",
                          "meet your RTO", "Test connectivity regularly"):
            with self.subTest(condition=condition):
                self.assertIn(condition, rows[1])
        for condition in ("Key Vault Managed HSM (Keys)", "Keys only", 'href="#keys-pattern-4"',
                          "supported extended region", "Both regions support read/write",
                          "asynchronous replication in either direction",
                          "Microsoft manages routing and failover", "on-premises HSM",
                          'href="#keys-pattern-5"', "then replicate"):
            with self.subTest(condition=condition):
                self.assertIn(condition, rows[2])
        managed_hsm_failover = re.findall(r"<td\b[^>]*>.*?</td>", rows[2], re.S)[3]
        for condition in ("Reads and writes continue if either region fails.",
                          "DNS routes to the closest available region (5-second TTL); caching can delay failover.",
                          "Replication:", "Key and role changes can take up to 6 minutes",
                          "regions may differ during this window.",
                          "External keys (EKM) cannot be geo-replicated."):
            with self.subTest(condition=condition):
                self.assertIn(condition, managed_hsm_failover)

    def test_pdf_failover_summaries_cover_regional_conditions(self):
        self.assertIn("dual KEK", keyvault.page1())
        self.assertIn("consuming-service-specific requirements", keyvault.page1())
        for condition in ("recovery misses your RTO", "supported workload regions",
                          "identities, permissions, networking, and versions",
                          "tested application fallback", "second vault alone is not enough",
                          "Point-in-time Key Vault backups"):
            with self.subTest(condition=condition):
                self.assertIn(condition, keyvault.page2())
        self.assertIn("With an on-premises HSM, consider BYOK into each Premium vault", keyvault.page3())
        for condition in ("Microsoft-managed failover: Managed HSM", "reads and writes remain available",
                          "No pairing required", "5-second TTL", "up to 6 minutes",
                          "Changes in either region replicate asynchronously to the other",
                          "unsupported without replication", "unsupported extended region", "external keys (EKM)"):
            with self.subTest(condition=condition):
                self.assertIn(condition, keyvault.page4())

    def test_managed_hsm_failover_guidance(self):
        _, body = site_build.read_front_matter(ROOT / "content" / "key-vault-across-regions.md")
        managed_hsm = body.split("### Microsoft-managed failover for Azure Key Vault Managed HSM\n", 1)[1]
        managed_hsm = managed_hsm.split("## Customer-managed failover", 1)[0]
        for removed in ("Failover occurs when one of the regions", "#### Failover behavior",
                        "| Affected Region | Reads Allowed | Writes Allowed |",
                        "**Read operations**", "**Write operations**",
                        "#### Request routing", "#### Replication latency",
                        "When you configure this feature:", "Both regions are active and can serve requests.",
                        "Key material, roles, and permissions automatically replicate between regions.",
                        "Azure Traffic Manager routes requests to the closest available region.",
                        "The combined SLA increases to 99.99%."):
            self.assertNotIn(removed, managed_hsm)
        self.assertIn("> **If a primary or extended region goes down, you can still perform both read and write operations.**", managed_hsm)
        for condition in ("closest available region",
                          "Any Managed HSM region can be primary",
                          "No pairing required", "External keys (EKM)",
                          "read and write requests",
                          "| Single-region deployment without multiregion replication | Unsupported |"):
            with self.subTest(condition=condition):
                self.assertIn(condition, managed_hsm)
        self.assertIn("> [!IMPORTANT]", managed_hsm)
        self.assertIn("| Scenario | Microsoft-managed failover | What to verify |", managed_hsm)
        self.assertIn("| Managed HSM with External Key Management (EKM) | Unsupported |", managed_hsm)
        self.assertIn("isn't supported with external keys, so there is no geo-replicated failover target.", managed_hsm)
        important = managed_hsm.split("> [!IMPORTANT]\n", 1)[1].split("\n\n", 1)[0]
        for condition in ("**Routing:**", "5-second TTL",
                          "**Replication:**", "up to 6 minutes",
                          "cross-region consistency isn't guaranteed",
                          "[Managed HSM multiregion replication](https://learn.microsoft.com/azure/key-vault/managed-hsm/multi-region-replication)"):
            with self.subTest(condition=condition):
                self.assertIn(condition, important)
        self.assertIn("https://learn.microsoft.com/azure/key-vault/managed-hsm/multi-region-replication#azure-region-support", managed_hsm)

    def test_failover_exclusions_are_evergreen_across_formats(self):
        _, body = site_build.read_front_matter(ROOT / "content" / "key-vault-across-regions.md")
        deck = (ROOT / "decks" / "full" / "key-vault.js").read_text(encoding="utf-8")
        callout = ("Microsoft-managed failover is not supported for non-paired regions, "
                   "regions with asymmetric pairing or paired regions across two different geographies.")
        references = (
            "https://learn.microsoft.com/azure/reliability/reliability-key-vault#microsoft-managed-failover-to-a-paired-region",
            "https://learn.microsoft.com/azure/key-vault/general/overview-security-worlds",
        )
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
        scenario_sections = (
            body.split("## Single KEK (key encryption key) scenarios\n", 1)[1].split("\n## Dual KEK (key encryption key) scenarios", 1)[0],
            body.split("## Dual KEK (key encryption key) scenarios\n", 1)[1].split("\n## Secrets and certificates patterns", 1)[0],
        )
        sections = {re.sub(r" \{#[^}]+\}$", "", title): text
                    for scenarios in scenario_sections
                    for title, text in re.findall(r"### ([^\n]+)\n(.*?)(?=\n### |\Z)", scenarios, re.S)}
        object_replication = sections["Azure Storage - Object replication for block blobs"]
        self.assertNotIn("(#keys-pattern-1)", object_replication)
        self.assertNotIn("(#keys-pattern-6)", object_replication)
        self.assertNotIn("| Pattern |", object_replication)
        flexible_server = sections["PostgreSQL and MySQL Flexible Server"]
        self.assertNotIn("(#keys-pattern-1)", flexible_server)
        self.assertNotIn("(#keys-pattern-6)", flexible_server)
        self.assertNotIn("| Pattern |", flexible_server)
        vm_disk_encryption = sections["VM disk encryption"]
        self.assertNotIn("Customer-managed keys offer greater flexibility to manage access controls.", vm_disk_encryption)
        self.assertIn("> [!IMPORTANT]\n> Key Vault must be in the same region as each Disk Encryption Set.", vm_disk_encryption)
        self.assertLess(vm_disk_encryption.index("Configure regional Disk Encryption Sets"), vm_disk_encryption.index("> [!IMPORTANT]"))
        self.assertNotIn("**Conditional:**", vm_disk_encryption)
        self.assertNotIn("(#keys-pattern-1)", vm_disk_encryption)
        self.assertNotIn("EKM does not support Secure Key Release.", vm_disk_encryption)
        self.assertNotIn("(#keys-pattern-6)", vm_disk_encryption)
        self.assertNotIn("This is different from guest-based Azure Disk Encryption and confidential VM key release.", vm_disk_encryption)
        self.assertNotIn("| Pattern |", vm_disk_encryption)
        site_recovery = sections["Azure Site Recovery"]
        self.assertIn("> [!IMPORTANT]\n> ASR uses Single KEK and Dual KEK. It uses Storage GRS for the temporary replication cache (using Single KEK) and disk encryption for the VM disks in the source and target regions (using Dual KEK).", site_recovery)
        self.assertLess(site_recovery.index("> [!IMPORTANT]"), site_recovery.index("Use only"))
        self.assertNotIn("Paired-region vault replication alone does not provision target-region encryption dependencies.", site_recovery)
        self.assertNotIn("Do not assume Managed HSM or EKM support from general managed-disk support.", site_recovery)
        self.assertNotIn("**Conditional:**", site_recovery)
        self.assertNotIn("| Pattern |", site_recovery)
        self.assertEqual(re.findall(r"\]\((#keys-pattern-\d)\)", site_recovery),
                         ["#keys-pattern-2", "#keys-pattern-3"])
        conditions = {
            "Application-level encryption": (
                "independent regional keys",
                "imported keys", "restricted operation set"),
            "Azure Storage - Geo-redundant storage (GRS)": (
                "different key store to each GRS replica",),
            "Azure Storage - Object replication for block blobs": (
                "independent keys", "import and authorize", "each account's CMK integration",
                "separate accounts"),
            "VM disk encryption": (
                "regional imports", "Disk Encryption Sets", "same region",
                "imported key",
                "envelope encryption", "rotate keys periodically without affecting your VMs",
                "the underlying disk data isn't re-encrypted",
                "Keep both the old and new key versions enabled until re-wrapping completes.",
                "https://learn.microsoft.com/en-us/azure/virtual-machines/disk-encryption#azure-managed-disk-encryption-key-management"),
            "Azure Site Recovery": (
                "target-region", "imported key", "cache storage account"),
            "PostgreSQL and MySQL Flexible Server": (
                "key and identity", "validate key import",
                "Managed HSM support", "geo-redundant backups"),
            "Azure SQL Database, Azure SQL Managed Instance and Azure Cosmos DB geo-replication": (
                "same Azure Key Vault as the primary", "Cosmos DB"),
            "Azure SQL Database, Azure SQL Managed Instance and Azure Cosmos DB geo-restore": (
                "Retain all historical keys", "authorize the restored service"),
            "Purview Information Protection": (
                "Non-exportable keys", "key generation, rotation, and protection",
                "There is no direct, real-time use of an on-prem HSM",
                "potential service disruption"),
        }
        self.assertEqual(set(sections), set(conditions))
        geo_replication = sections["Azure SQL Database, Azure SQL Managed Instance and Azure Cosmos DB geo-replication"]
        self.assertNotIn("> [!IMPORTANT]", geo_replication)
        self.assertNotIn("**Patterns you can use:**", geo_replication)
        self.assertEqual(len(re.findall(r"^- (.+)$", geo_replication, re.M)), 3)
        self.assertNotIn("(#keys-pattern-2)", geo_replication)
        self.assertNotIn("(#keys-pattern-3)", geo_replication)
        self.assertNotIn("(#keys-pattern-6)", geo_replication)
        geo_restore = sections["Azure SQL Database, Azure SQL Managed Instance and Azure Cosmos DB geo-restore"]
        self.assertNotIn("**Patterns you can use:**", geo_restore)
        self.assertEqual(len(re.findall(r"^- (.+)$", geo_restore, re.M)), 1)
        self.assertNotIn("(#keys-pattern-2)", geo_restore)
        self.assertNotIn("(#keys-pattern-3)", geo_restore)
        self.assertNotIn("(#keys-pattern-6)", geo_restore)
        self.assertNotIn("A fresh key in a new vault is not a substitute.", geo_restore)
        self.assertIn("> [!IMPORTANT]\n> Geo-restore is not possible for Microsoft-managed key (MMK) or Customer-managed key (CMK) scenarios when using paired regions in different geographies.", geo_restore)
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
        pattern = body.split("## Keys management patterns {#keys}\n", 1)[1].split("### Pattern 1:", 1)[1].split("### Pattern 2:", 1)[0]
        for phrase in ("Standard for software-protected", "Premium for HSM-protected",
                       "Premium does not improve regional recovery control", "Read-only",
                       "no key creation or rotation", "key-vault-keys-paired-region.png"):
            self.assertIn(phrase, pattern)
        purview = re.split(r"\n#{2,3} ", body.split("### Purview Information Protection\n", 1)[1], maxsplit=1)[0]
        description = purview.split("> [!IMPORTANT]", 1)[0]
        self.assertEqual(len(re.findall(r"^- ", description, re.M)), 3)
        self.assertIn("[See supported HSMs](https://learn.microsoft.com/en-us/azure/key-vault/keys/hsm-protected-keys-byok?tabs=azure-cli)", description)
        self.assertIn("> [!IMPORTANT]\n> Default to Microsoft-managed keys unless regulation clearly requires customer control; where customer-managed keys are mandatory, create and preserve keys outside the primary geography and validate recovery design before production rollout.", purview)
        self.assertEqual(purview.count("Default to Microsoft-managed keys unless regulation clearly requires customer control;"), 1)
        for removed in ("**Service-specific requirements:**",
                        "Use Premium for the documented HSM-backed vault option",
                        "BYOK with a Premium vault", "supported HSMs and key-transfer instructions",
                        "configure key access and lifecycle for the specific Information Protection feature",
                        "import it into the replicated Managed HSM and preserve keys for old content"):
            self.assertNotIn(removed, purview)
        self.assertNotIn("Standard software-protected keys require feature-specific confirmation", purview)
        self.assertNotIn("External key management requires feature-specific confirmation", purview)
        self.assertNotIn("(#keys-pattern-6)", purview)
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
        self.assertLess(pages[0].index("Standard/Premium failover"), pages[0].index('id="figKVTiers"'))
        self.assertNotIn("<table", pages[0])
        self.assertEqual(len(re.findall(r'href="[^"]+#(?:application-level-encryption|azure-storage-grs|storage-object-replication|vm-disk-encryption|azure-site-recovery|postgresql-and-mysql-flexible-server|database-geo-replication|database-geo-restore|purview-information-protection)"', pages[0])), 9)

    def test_decision_tree_export_is_not_clipped_by_the_pdf_page(self):
        import json
        manifest = json.loads((ROOT / "site" / "figures" / "manifest.json").read_text(encoding="utf-8"))
        self.assertEqual((manifest["key-vault-decision-tree"]["w"], manifest["key-vault-decision-tree"]["h"]),
                         (940, 562))


if __name__ == "__main__":
    unittest.main()
