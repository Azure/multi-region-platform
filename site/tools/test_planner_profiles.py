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
const names = ['Governance-Only', 'Remote platform', 'Minimal platform', 'Full platform'];
const legacy = ['Disconnected Spokes', 'Remote Hub Connected', 'Minimal Regional Hub', 'Full Regional Hub'];
const previous = ['No Hub', 'Remote Hub', 'Minimal Hub', 'Full Hub'];
"""


class PlannerProfileTests(unittest.TestCase):
    def run_js(self, script):
        result = subprocess.run(["node", "-e", SETUP + script], cwd=ROOT,
                                capture_output=True, text=True, encoding="utf-8")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_four_outcomes_and_skipped_checks_preserve_saved_evidence(self):
        self.run_js("""
assert.deepEqual(M.O.outcome, ['Excluded', 'Candidate', 'Conditional', 'Qualified']);
const input = JSON.parse(JSON.stringify(M.EXAMPLE));
const old = input.regions[2];
old.outcome = 'No deeper assessment'; old.selected = true;
old.checks['2.1'] = 'Yes'; old.conditions = 'Retain the business decision';
const before = JSON.stringify(input);
C.replace(input);
const r = C.reg(old.id);
assert.equal(JSON.stringify(input), before);
assert.equal(C.outcome(r), 'Excluded');
assert.equal(C.suggest(r).o, 'Excluded');
assert.equal(r.selected, false);
assert.equal(r.checks['2.1'], 'Yes');
assert.equal(r.conditions, old.conditions);
assert.equal(C.checkState(M.CHECKS[0], r), 'error');
for (const check of M.CHECKS.slice(1)) assert.equal(C.checkState(check, r), 'skip');
assert.deepEqual(C.normalize(C.S), C.S);
""")

    def test_archetype_defaults_and_explicit_overrides_migrate_together(self):
        self.run_js("""
const input = JSON.parse(JSON.stringify(M.EXAMPLE));
input.workload = {'3.2': {
  value:'Hybrid-Connected Applications', expanded:false,
  overrides:{polandcentral:'Connected Cloud-Native or AI Applications', switzerlandnorth:''}
}};
const before = JSON.stringify(input);
const s = C.normalize(input);
assert.equal(JSON.stringify(input), before);
assert.equal(s.workload['3.2'].value, 'Hybrid-Dependent Workloads');
assert.equal(s.workload['3.2'].overrides.polandcentral, 'Selectively Connected Workloads');
assert.equal(s.workload['3.2'].overrides.switzerlandnorth, '');
assert.deepEqual(s.regions.map(r => r.checks['3.2']),
  ['Hybrid-Dependent Workloads', 'Selectively Connected Workloads', '']);
assert.deepEqual(C.normalize(s), s);
""")

    def test_current_profiles_and_explicit_circuit_are_independent_of_test_locations(self):
        self.run_js("""
const s = C.blank();
s.current = [{id:'westeurope',hub:true}, {id:'northeurope',hub:false},
  {id:'italynorth',profile:'Minimal Hub'}, {id:'francecentral',profile:'Remote platform'}];
s.regions = [C.newRegion('swedencentral')];
s.sites = [{id:'frankfurt',kind:'peering',peering:'Frankfurt',target:30,edits:{}}];
C.replace(s);
assert.deepEqual(C.S.current.map(c => c.profile), ['Full platform','','Minimal platform','Remote platform']);
assert.deepEqual(C.S.current.map(c => c.hub), [true,false,false,false]);
assert.equal(C.S.estate.circuit, '');
const r = C.S.regions[0], d = C.design(r);
Object.assign(d, {q1:'Yes',q2:'Yes',hybrid:'Reuse'});
assert.equal(C.effective(r).hybridUse, '');
C.S.estate.circuit = 'Frankfurt';
assert.equal(C.effective(r).hybridUse, 'ExpressRoute circuit in Frankfurt');
d.hybridUse = 'Existing VPN';
assert.equal(C.effective(r).hybridUse, 'Existing VPN');
C.S.sites = []; C.tidy();
assert.equal(C.S.estate.circuit, '');
assert.equal(d.hybridUse, 'Existing VPN');
""")

    def test_latency_breakpoints_have_equal_width_and_interpolate_between_steps(self):
        self.run_js("""
assert.deepEqual(C.latScale.marks, [0,30,60,120,200,250]);
C.latScale.marks.forEach((value,i) => assert.equal(C.latPos(value), i/5));
assert.equal(C.latPos(15), 0.1);
assert.equal(C.latPos(45), 0.3);
assert.equal(C.latPos(90), 0.5);
assert.equal(C.latPos(160), 0.7);
assert.equal(C.latPos(225), 0.9);
assert.equal(C.latPos(-5), 0);
assert.equal(C.latPos(300), 1);
""")

    def test_record_retains_unselected_regions_and_custom_review_triggers(self):
        self.run_js("""
C.replace(M.EXAMPLE);
const r = C.S.regions[0], d = C.design(r);
d.reassess = 'Revisit the second circuit at renewal';
d.reviewTriggers = ['New requirements', 'Platform gaps'];
assert.ok(C.reviewTriggers(r).includes(d.reassess));
const text = C.recordText();
for (const region of C.S.regions) assert.ok(text.includes(C.rname(region.id)));
assert.ok(text.includes('Workload Landing Zone archetype: Hybrid-Dependent Workloads'));
assert.ok(text.includes('Outcome: Qualified as of '));
assert.ok(text.includes('Ownership: Platform team'));
assert.ok(text.includes(d.reassess));
assert.ok(!text.includes('No deeper assessment'));
const saved = C.normalize(C.S);
assert.deepEqual(saved.regions[0].design.reviewTriggers, d.reviewTriggers);
assert.equal(saved.regions[0].design.reassess, d.reassess);
assert.notEqual(saved.regions[0].design.reviewTriggers, d.reviewTriggers);
""")

    def test_profile_choices_suggestions_and_diagrams_use_canonical_names(self):
        self.run_js("""
assert.deepEqual(M.PROFILES.map(p => p.id), names);
assert.deepEqual(M.PROFILES.map(p => p.name),
  ['Governance-Only', 'Remote regional platform', 'Minimal regional platform', 'Full regional platform']);
assert.deepEqual([
  C.suggestProfile({q1:'No'}),
  C.suggestProfile({q1:'Yes', q2:'Yes'}),
  C.suggestProfile({q1:'Yes', q2:'No', q3:'No'}),
  C.suggestProfile({q1:'Yes', q2:'No', q3:'Yes'})
], names);
for (const name of names) assert.ok(M.diagram.profile(name).includes(name), name);
assert.deepEqual(M.linkOptions('Governance-Only', 'Azure Virtual WAN'), []);
assert.equal(M.hybridPathOptions('Governance-Only', 'Azure Virtual WAN', '').length, 0);
assert.ok(M.linkOptions('Remote platform', 'Hub-and-spoke virtual networks')
  .every(option => option.includes('the Full-Platform region')));
assert.ok(M.eastWestOptions('Remote platform').includes('Through the Full-Platform region'));
""")

    def test_legacy_profiles_load_without_losing_design_or_custom_text(self):
        self.run_js("""
for (const version of [1, 2, 3]) {
  [...legacy.map((name, index) => [name, index]),
   ...previous.map((name, index) => [name, index]),
   ...names.map((name, index) => [name, index]),
   ['Selective Hub', 2], ['No platform', 0], ['No-Platform', 0]].forEach(([old, index]) => {
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
    assert.ok(C.recordText().includes('Platform Services profile: ' + names[index]));
  });
}
""")

    def test_legacy_geographic_connection_choices_are_preserved(self):
        self.run_js("""
for (const old of M.linkOptions('Remote platform', 'Hub-and-spoke virtual networks')) {
  const input = JSON.parse(JSON.stringify(M.EXAMPLE));
  Object.assign(input.regions[0].design, {
    profile: 'Remote Hub Connected',
    link: old.replace('the Full-Platform region', 'the remote hub'),
    eastWest: 'Through the remote hub',
    hybridPath: M.HYBRID_PATHS[0].id.replace('Full-Platform region', 'geographic hub')
  });
  C.replace(input);
  const region = C.S.regions[0], effective = C.effective(region);
  assert.equal(region.design.link, old);
  assert.equal(effective.link, old);
  assert.equal(effective.eastWest, 'Through the Full-Platform region');
  assert.equal(effective.hybridPath, M.HYBRID_PATHS[0].id);
}
""")

    def test_previous_geographic_choices_are_migrated(self):
        self.run_js("""
const input = JSON.parse(JSON.stringify(M.EXAMPLE));
Object.assign(input.regions[0].design, {
  profile: 'Remote Hub',
  link: M.linkOptions('Remote platform', 'Hub-and-spoke virtual networks')[0]
    .replace('Full-Platform region', 'geographic hub'),
  eastWest: 'Through the geographic hub',
  hybridPath: M.HYBRID_PATHS[0].id.replace('Full-Platform region', 'geographic hub')
});
C.replace(input);
const region = C.S.regions[0], e = C.effective(region);
assert.equal(e.profile, 'Remote platform');
assert.equal(e.link, M.linkOptions('Remote platform', 'Hub-and-spoke virtual networks')[0]);
assert.equal(e.eastWest, 'Through the Full-Platform region');
assert.equal(e.hybridPath, M.HYBRID_PATHS[0].id);
""")


if __name__ == "__main__":
    unittest.main()
