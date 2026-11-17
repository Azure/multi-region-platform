// Scope datacenters become the on-premises sites of the networking design, matched to circuits by peering city.
// Runs without a browser: node --test site/tools/test_planner_network_sites.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'assets', 'planner-network.js'), 'utf8');
const city = (id, n, peering) => ({ id, kind: 'city', city: { n }, peering, edits: {} });
const peering = name => ({ id: 'p-' + name, kind: 'peering', peering: name, edits: {} });

function workbookSpec(current, sites) {
  const S = { meta: { name: 'Test' }, estate: { topology: 'Hub-and-spoke virtual networks' }, current, sites };
  const core = { S, selected: () => [], effective: () => ({}), design: () => ({}), rname: id => id,
    list: a => a.join(', '), siteName: s => (s.kind === 'city' ? s.city.n : s.peering), sitePeering: s => s.peering,
    circuitLocations: () => [...new Set(sites.filter(s => s.kind === 'peering').map(s => s.peering))] };
  const window = { MRP: { core, PROFILES: [{ id: 'Full platform' }], SHARED: [] } };
  vm.runInNewContext(source, { window });
  return JSON.parse(JSON.stringify(window.MRP.network.workbookSpec()));  // plain objects of this realm
}
const siteOf = (spec, location) => spec.hybrid_connections.filter(c => c.peering_location === location).map(c => c.site);

test('a Metro or numbered circuit attaches to the datacenter whose path is in the same city', () => {
  const spec = workbookSpec(
    [{ id: 'westeurope', profile: 'Full platform', circuit: 'Amsterdam Metro' },
      { id: 'northeurope', profile: 'Full platform', circuit: 'Dublin2' }],
    [city('ams', 'Amsterdam', 'Amsterdam'), city('cork', 'Cork', 'Dublin'),
      peering('Amsterdam Metro'), peering('Dublin2')]);
  assert.deepEqual(siteOf(spec, 'Amsterdam Metro'), ['ams']);
  assert.deepEqual(siteOf(spec, 'Dublin2'), ['cork']);
  assert.deepEqual(spec.onprem.map(s => s.name), ['Amsterdam', 'Cork']);
});

test('a circuit in another city keeps an explicitly unspecified site', () => {
  const spec = workbookSpec([{ id: 'westeurope', profile: 'Full platform', circuit: 'Frankfurt' }],
    [city('ams', 'Amsterdam', 'Amsterdam'), peering('Frankfurt')]);
  assert.deepEqual(siteOf(spec, 'Frankfurt'), ['circuit-Frankfurt']);
  assert.ok(spec.onprem.some(s => s.name === 'Site not specified'));
  assert.ok(spec.workbook.notes.some(n => /no matching on-premises location/.test(n)));
});
