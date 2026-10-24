"""Keep archetype order and conditional hub applicability aligned across formats."""
import html
import json
from pathlib import Path
import re
import subprocess
import unittest

ROOT = Path(__file__).resolve().parents[2]
ARCHETYPES = [
    "Isolated Cloud-Native or AI Applications",
    "Connected Cloud-Native or AI Applications",
    "Hybrid-Connected Applications",
    "Interconnected Application Portfolios",
]
PROFILES = ["No Hub", "Remote Hub", "Selective Hub", "Full Hub"]


def text(fragment):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", fragment))).strip()


class ArchetypeTests(unittest.TestCase):
    def read(self, name):
        return (ROOT / name).read_text(encoding="utf-8")

    def test_shared_lists_and_markdown_use_connectivity_complexity_order(self):
        summary = json.loads(self.read("shared/summary.json"))
        self.assertEqual(summary["archetypes"], ARCHETYPES)
        self.assertEqual(summary["profiles"], PROFILES)
        self.assertEqual(summary["choices"][0]["options"], PROFILES)
        article = self.read("content/application-landing-zone-archetypes.md")
        self.assertEqual(re.findall(r"^## (.+)$", article, re.M)[:4], ARCHETYPES)
        self.assertIn("not a maturity model", article)
        self.assertIn("without a geographic hub or on-premises path", article)

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

    def test_qualification_statuses_move_with_their_archetype_columns(self):
        source = self.read("whitepaper/pages/10b-outcome.html")
        table = re.search(r'<table class="pm">(.*?)</table>', source, re.S)[1]
        rows = re.findall(r"<tr>(.*?)</tr>", table, re.S)
        headings = [text(c) for c in re.findall(r"<th\b[^>]*>(.*?)</th>", rows[0], re.S)]
        self.assertEqual(headings[1:], [
            "Isolatedcloud-native / AI", "Connectedcloud-native / AI",
            "Hybrid-connected", "Interconnectedportfolio",
        ])
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
        self.assertEqual(data["options"], ARCHETYPES + ["Several (see note)"])
        self.assertEqual(data["saved"], ARCHETYPES)
        self.assertIn("beyond approved same-region spokes and Azure service endpoints", data["question"])

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
        for cards in json.loads(result.stdout):
            self.assertEqual([c["name"] for c in cards], ARCHETYPES)
            self.assertEqual(cards[0]["profiles"], ["No Hub", "Other profiles, where justified"])
            self.assertEqual(cards[1]["profiles"], PROFILES)
            self.assertEqual(cards[2]["profiles"], PROFILES[1:])
            self.assertEqual(cards[3]["profiles"], PROFILES)
            self.assertIn("Self-contained", " ".join(cards[0]["text"]))
            self.assertIn("No Hub only", " ".join(cards[1]["text"]))
            self.assertIn("No Hub", " ".join(cards[2]["text"]))
            self.assertIn("approved same-region", " ".join(cards[3]["text"]))


if __name__ == "__main__":
    unittest.main()
