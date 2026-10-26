"""Guard profile names, saved-plan compatibility, and geographic terminology."""
from pathlib import Path
import subprocess
import unittest

ROOT = Path(__file__).resolve().parents[2]
SETUP = """
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
global.window = {location: {protocol: 'http:'}};
global.localStorage = {setItem() {}};
for (const file of ['planner-data.js', 'planner-icons.js', 'planner-core.js'])
  vm.runInThisContext(fs.readFileSync('site/assets/' + file, 'utf8'), {filename: file});
const M = window.MRP, C = M.core;
const names = ['No Hub', 'Remote Hub', 'Minimal Hub', 'Full Hub'];
const legacy = ['Disconnected Spokes', 'Remote Hub Connected', 'Minimal Regional Hub', 'Full Regional Hub'];
"""


class PlannerProfileTests(unittest.TestCase):
    def run_js(self, script):
        result = subprocess.run(["node", "-e", SETUP + script], cwd=ROOT,
                                capture_output=True, text=True, encoding="utf-8")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_profile_choices_suggestions_and_diagrams_use_canonical_names(self):
        self.run_js("""
assert.deepEqual(M.PROFILES.map(p => p.id), names);
assert.deepEqual([
  C.suggestProfile({q1:'No'}),
  C.suggestProfile({q1:'Yes', q2:'Yes'}),
  C.suggestProfile({q1:'Yes', q2:'No', q3:'No'}),
  C.suggestProfile({q1:'Yes', q2:'No', q3:'Yes'})
], names);
for (const name of names) assert.ok(M.diagram.profile(name).includes(name), name);
assert.deepEqual(M.linkOptions('No Hub', 'Azure Virtual WAN'), []);
assert.equal(M.hybridPathOptions('No Hub', 'Azure Virtual WAN', '').length, 0);
assert.ok(M.linkOptions('Remote Hub', 'Hub-and-spoke virtual networks')
  .every(option => option.includes('the geographic hub')));
assert.ok(M.eastWestOptions('Remote Hub').includes('Through the geographic hub'));
""")

    def test_legacy_profiles_load_without_losing_design_or_custom_text(self):
        self.run_js("""
for (const version of [1, 2, 3]) {
  [...legacy.map((name, index) => [name, index]),
   ...names.map((name, index) => [name, index]),
   ['Selective Hub', 2]].forEach(([old, index]) => {
    const input = JSON.parse(JSON.stringify(M.EXAMPLE));
    input.v = version;
    Object.assign(input.regions[0].design, {
      profile: old, hubConnections: ['westeurope'],
      reassess: 'Keep custom text: Minimal Regional Hub',
      owner: 'Network team', custom: [{id:'custom', name:'Registry', p:'Local'}]
    });
    const original = JSON.stringify(input);
    const normalized = C.normalize(input);
    assert.equal(JSON.stringify(input), original);
    const design = normalized.regions[0].design;
    assert.equal(design.profile, names[index]);
    assert.deepEqual(design.hubConnections, ['westeurope']);
    assert.equal(design.owner, 'Network team');
    assert.equal(design.reassess, input.regions[0].design.reassess);
    assert.deepEqual(design.custom, input.regions[0].design.custom);
    assert.deepEqual(C.normalize(normalized), normalized);
    C.replace(normalized);
    assert.equal(C.effective(C.S.regions[0]).pi, index);
    assert.equal(C.effective(C.S.regions[0]).none, index === 0);
    assert.ok(C.recordText().includes('Connectivity profile: ' + names[index]));
  });
}
""")

    def test_legacy_geographic_connection_choices_are_preserved(self):
        self.run_js("""
for (const old of M.linkOptions('Remote Hub', 'Hub-and-spoke virtual networks')) {
  const input = JSON.parse(JSON.stringify(M.EXAMPLE));
  Object.assign(input.regions[0].design, {
    profile: 'Remote Hub Connected',
    link: old.replace('the geographic hub', 'the remote hub'),
    eastWest: 'Through the remote hub',
    hybridPath: M.HYBRID_PATHS[0].id
  });
  C.replace(input);
  const region = C.S.regions[0], effective = C.effective(region);
  assert.equal(region.design.link, old);
  assert.equal(effective.link, old);
  assert.equal(effective.eastWest, 'Through the geographic hub');
  assert.equal(effective.hybridPath, M.HYBRID_PATHS[0].id);
}
""")


if __name__ == "__main__":
    unittest.main()
