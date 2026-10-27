"""Keep archetype order and conditional hub applicability aligned across formats."""
import html
import json
from pathlib import Path
import re
import subprocess
import unittest

ROOT = Path(__file__).resolve().parents[2]
SUMMARY = json.loads((ROOT / "shared" / "summary.json").read_text(encoding="utf-8"))
ARCHETYPES = SUMMARY["archetypes"]
PROFILES = SUMMARY["profiles"]


def text(fragment):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", fragment))).strip()


class ArchetypeTests(unittest.TestCase):
    def read(self, name):
        source = (ROOT / name).read_text(encoding="utf-8")
        if name.endswith(".html"):
            for key, values in (("ARCHETYPE", ARCHETYPES), ("ARCHETYPE_LABEL", SUMMARY["archetypeLabels"]),
                                ("PROFILE", PROFILES)):
                for i, value in enumerate(values, 1):
                    source = source.replace("{{" + f"{key}_{i}" + "}}", value)
            for i, order in enumerate(SUMMARY["archetypeProfileOrder"], 1):
                source = source.replace("{{" + f"ARCHETYPE_CHIPS_{i}" + "}}",
                                        "".join(f"<span>{PROFILES[j]}</span>" for j in order))
        return source

    def test_shared_lists_and_markdown_use_connectivity_complexity_order(self):
        summary = json.loads(self.read("shared/summary.json"))
        self.assertEqual(summary["archetypes"], ARCHETYPES)
        self.assertEqual(summary["profiles"], PROFILES)
        self.assertEqual(summary["choices"][0]["options"], PROFILES)
        article = self.read("content/application-landing-zone-archetypes.md")
        self.assertEqual(re.findall(r"^## (.+)$", article, re.M)[:4], ARCHETYPES)
        self.assertIn("The four archetypes, grouped by the platform connectivity and dependency capabilities each requires.", article)
        self.assertIn("without private connectivity to a more strategic region or an on-premises environment", article)

    def test_profile_chip_order_follows_markdown_matrix(self):
        matrix = self.read("content/profile-selection.md")
        rows = [line.split("|")[1:-1] for line in matrix.splitlines()
                if line.startswith("| ") and any(line.startswith("| " + name + " |") for name in ARCHETYPES)]
        self.assertEqual(len(rows), 4)
        orders = []
        for row in rows:
            cells = [cell.strip() for cell in row[1:]]
            eligible = [i for i, value in enumerate(cells) if value != "Not indicated"]
            orders.append(sorted(eligible, key=lambda i: cells[i] not in ("Often", "Typical")))
        self.assertEqual(SUMMARY["archetypeProfileOrder"], orders)

    def test_management_groups_and_regional_traffic(self):
        article = self.read("content/application-landing-zone-archetypes.md")
        self.assertIn("Each workload or group gets exactly one archetype.", article)
        self.assertIn("without routed access to the enterprise network", article)
        self.assertIn("named endpoints versus routed network access, not Azure versus on-premises", article)
        self.assertIn("Traffic between instances of the same workload in different regions does not change its archetype.", article)
        matrix = self.read("whitepaper/pages/09b-matrix.html")
        rows = re.findall(r"<tr>(.*?)</tr>", re.search(r'class="pub mg-map".*?<tbody>(.*?)</tbody>', matrix, re.S)[1])
        self.assertEqual([[text(cell) for cell in re.findall(r"<td>(.*?)</td>", row)] for row in rows],
                         [[name, "Common" if i == 0 else "Possible", "Rare" if i == 0 else "Common"]
                          for i, name in enumerate(ARCHETYPES)])
        requirements = self.read("whitepaper/pages/12b-check3-platform.html")
        self.assertIn("Record the management group each workload's subscriptions will sit under.", requirements)
        self.assertIn("SQL Server Always On on VMs", requirements)
        self.assertIn("Managed replication on the Microsoft backbone", requirements)
        for path in ("whitepaper/exec/pages/08-archetypes.html", "word/brief.md", "decks/exec/e.js"):
            self.assertNotIn("Internal (Corp)", self.read(path))

    def test_retired_patterns_accept_current_names_and_labels(self):
        import importlib.util
        spec = importlib.util.spec_from_file_location("drift", ROOT / "site" / "tools" / "drift.py")
        drift = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(drift)
        current = " · ".join(ARCHETYPES + SUMMARY["archetypeLabels"] + PROFILES)
        for pattern in drift.RETIRED:
            self.assertIsNone(re.search(pattern, current, re.I), pattern)

    def test_publication_cards_and_matrix_use_the_same_order(self):
        full = self.read("whitepaper/pages/09-archetypes.html")
        executive = self.read("whitepaper/exec/pages/08-archetypes.html")
        matrix = self.read("whitepaper/pages/09b-matrix.html")
        self.assertEqual(re.findall(r'<span class="at">([^<]+)</span>', full), ARCHETYPES)
        headings = re.findall(r'<div class="hd">.*?<b>(.*?)</b>', executive)
        self.assertEqual([text(h).lower() for h in headings], [a.lower() for a in ARCHETYPES])
        self.assertEqual(re.findall(r'<span class="t">([^<]+)</span>', matrix), ARCHETYPES)
        for source in (full, executive, matrix):
            numbers = re.findall(r'<span class="(?:an|n)"[^>]*>(\d)</span>', source)
            self.assertEqual(numbers, ["1", "2", "3", "4"])

    def test_matrix_keeps_hub_free_options_conditional_and_hybrid_connected(self):
        matrix = self.read("whitepaper/pages/09b-matrix.html")
        rows = re.findall(r"<tbody>(.*?)</tbody>", matrix, re.S)[0]
        rows = re.findall(r"<tr\b.*?</tr>", rows, re.S)
        first_cells = [re.search(r"<td\b[^>]*>(.*?)</td>", row, re.S)[1] for row in rows]
        self.assertIn("Often", first_cells[0])
        self.assertIn('class="mk cond"', first_cells[1])
        self.assertIn("Where hub-free", first_cells[1])
        self.assertIn('class="mk none"', first_cells[2])
        self.assertIn('class="mk cond"', first_cells[3])
        self.assertIn("without hub or on-premises dependencies", rows[3])

    def test_overview_picture_preserves_original_explanations(self):
        source = self.read("whitepaper/pages/09-archetypes.html")
        bullets = [
            [text(item) for item in re.findall(r"<li>(.*?)</li>", group)]
            for group in re.findall(r"<ul>(.*?)</ul>", source)
        ]
        self.assertEqual(bullets, [
            ["No persistent private dependencies", "Can often use No platform",
             "Flexible placement across regions"],
            ["Private access to selected dependencies",
             "Profile set by latency, traffic, resiliency, security",
             "Common for data, analytics, and AI platforms"],
            ["Persistent private connectivity",
             "Profile set by dependency latency, resiliency, regulation, operations",
             "Common in migrations and hybrid scenarios"],
            ["Classified at group level", "Aggregate requirements set the profile",
             "Direct spoke-to-spoke or a regional hub for east-west traffic"],
        ])
        profiles = [
            [text(chip) for chip in re.findall(r"<span[^>]*>(.*?)</span>", group)]
            for group in re.findall(r'<div class="pr">(.*?)</div>', source)
        ]
        self.assertEqual(profiles, [[PROFILES[j] for j in order] for order in SUMMARY["archetypeProfileOrder"]])
        self.assertIn("Grouped by the platform connectivity and dependency capabilities each requires.", source)

    def test_qualification_statuses_move_with_their_archetype_columns(self):
        source = self.read("whitepaper/pages/10b-outcome.html")
        table = re.search(r'<table class="pm">(.*?)</table>', source, re.S)[1]
        rows = re.findall(r"<tr>(.*?)</tr>", table, re.S)
        headings = [text(c) for c in re.findall(r"<th\b[^>]*>(.*?)</th>", rows[0], re.S)]
        self.assertEqual(headings[1:], SUMMARY["archetypeLabels"])
        statuses = [re.findall(r'class="m (\w+)"', row) for row in rows[1:]]
        self.assertEqual(statuses, [
            ["qu", "qu", "qu", "qu"], ["qu", "qu", "qu", "ca"],
            ["qu", "co", "qu", "ca"], ["qu", "co", "ex", "ex"],
            ["ex", "ex", "ex", "ex"],
        ])

    def test_planner_dropdown_preserves_archetype_names_and_saved_answers(self):
        script = """
const fs = require('node:fs'), vm = require('node:vm');
global.window = {location: {protocol:'http:'}};
global.localStorage = {setItem() {}};
for (const file of ['planner-data.js', 'planner-core.js'])
  vm.runInThisContext(fs.readFileSync('site/assets/' + file, 'utf8'));
const M = window.MRP;
const options = M.CHECKS[2].rows.find(r => r.id === '3.2').opts;
const saved = options.slice(0, 4).map(value => M.core.normalize({
  v: 3, regions: [{id:'westeurope', checks: {'3.2':value}}]
}).regions[0].checks['3.2']);
console.log(JSON.stringify({options, saved, question: M.PROFILE_QUESTIONS[0].label}));
"""
        result = subprocess.run(["node", "-e", script], cwd=ROOT,
                                check=True, capture_output=True, text=True, encoding="utf-8")
        data = json.loads(result.stdout)
        legacy = ["Isolated Cloud-Native or AI Applications", "Connected Cloud-Native or AI Applications",
                  "Hybrid-Connected Applications", "Interconnected Application Portfolios"]
        self.assertEqual(data["options"], legacy + ["Several (see note)"])
        self.assertEqual(data["saved"], legacy)
        self.assertIn("beyond approved same-region spokes and Azure service endpoints", data["question"])

    def test_executive_city_explains_the_numbered_archetypes(self):
        source = self.read("decks/exec/e.js")
        self.assertIn(
            "D.archetypeLabels.map((label, i) => `${i + 1} ${label}`).join('  ·  ')",
            source,
        )
        self.assertIn("Household pins: 1 self-contained in Lakeside; 2 selectively connected in Midtown; "
                      "3 hybrid-dependent in Hillcrest; 4 interdependent groups in Riverside.", source)

    def test_deck_generators_bind_correct_definitions_and_profiles_to_each_archetype(self):
        script = """
const data = require('./shared/summary.json');
const outputs = [];
for (const module of ['./decks/full/10-part1', './decks/exec/e']) {
  const slides = [];
  const L = new Proxy({
    data, tone:'blue',
    slide() { const s = {events:[], addNotes(){}, addTable(){}};
      slides.push(s); return s; },
    header(s, kicker, title) { s.title = title; },
    txt(s, value) { if (typeof value === 'string') s.events.push(['text', value]); },
    chip(s, value) { s.events.push(['chip', value]); }
  }, {get(target, key) { return key in target ? target[key] : () => {}; }});
  require(module)({}, L);
  const slide = slides.find(s => typeof s.title === 'string' &&
    /^(Four )?Workload Landing Zone [Aa]rchetypes$/.test(s.title));
  if (!slide) throw Error('Missing archetype slide in ' + module);
  const cards = [];
  for (const [kind, value] of slide.events) {
    if (data.archetypes.includes(value)) cards.push({name:value, text:[], profiles:[]});
    else if (cards.length) cards.at(-1)[kind === 'chip' ? 'profiles' : 'text'].push(value);
  }
  outputs.push(cards);
}
console.log(JSON.stringify(outputs));
"""
        result = subprocess.run(["node", "-e", script], cwd=ROOT,
                                check=True, capture_output=True, text=True, encoding="utf-8")
        full_cards, exec_cards = json.loads(result.stdout)
        for cards in (full_cards, exec_cards):
            self.assertEqual([c["name"] for c in cards], ARCHETYPES)
            self.assertEqual(cards[2]["profiles"], PROFILES[1:])
            self.assertIn("Self-contained", " ".join(cards[0]["text"]))
        expected = [[PROFILES[j] for j in order] for order in SUMMARY["archetypeProfileOrder"]]
        self.assertEqual([c["profiles"] for c in full_cards], expected)
        self.assertIn("Profile set by latency, traffic, resiliency, security", " ".join(full_cards[1]["text"]))
        self.assertIn("Common in migrations and hybrid scenarios", " ".join(full_cards[2]["text"]))
        self.assertIn("Direct spoke-to-spoke or a regional hub", " ".join(full_cards[3]["text"]))
        self.assertEqual([c["profiles"] for c in exec_cards], expected)
        self.assertIn("No platform only", " ".join(exec_cards[1]["text"]))
        self.assertIn("No platform", " ".join(exec_cards[2]["text"]))
        self.assertIn("approved same-region", " ".join(exec_cards[3]["text"]))


if __name__ == "__main__":
    unittest.main()
