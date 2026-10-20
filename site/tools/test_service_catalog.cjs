const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const assets = path.join(__dirname, '..', 'assets');
const entry = (available, zoneCounts = []) => ({ available, zoneCounts });
const sku = (name, regions) => ({ name, regions });
const service = {
  name: 'App Service', family: 'Compute',
  regions: { eastus: entry(true, [1, 3]), westus: entry(true) },
  products: {
    Web: { name: 'Web', regions: { eastus: entry(true, [1, 3]), westus: entry(true, [3]) }, skus: {
      Basic: sku('Basic', { eastus: entry(true, [1]), westus: entry(false) }),
      Premium: sku('Premium', { eastus: entry(true, [3]) }),
      Web: { ...sku('Web', { westus: entry(true, [3]) }), generic: true },
    } },
    Other: { name: 'Other', regions: { westus: entry(true) }, skus: {} },
  },
};
const mapping = {
  'App Service': { service: 'Azure App Service' },
  'Static Web Apps': { service: 'Azure App Service' },
  'Azure AI Search': { service: 'Azure Cognitive Search' },
  Free: { service: null, note: 'No Retail meter (free service)' },
};

async function core({ noRetail = false, noMapping = false, noAvailability = false, initial } = {}) {
  const data = {
    'data/retail-latest/meta.json': { generated: noRetail ? null : '2026-10-01' },
    'data/retail-latest/catalog.json': { regions: [{ id: 'eastus', name: 'East US' }, { id: 'westus', name: 'West US' }], services: [] },
    'data/availability-catalog-latest.json': {
      generated: '2026-10-16', regions: [{ id: 'eastus', name: 'East US', geo: 'US' }, { id: 'westus', name: 'West US', geo: 'US' }],
      services: [service, { name: 'Azure AI Search', regions: {}, products: {} }],
    },
    'data/service-pricing-map.json': mapping,
    'data/latency.json': { generated: null },
    'data/retail-latest/pricing/eastus.json': { regions: ['eastus', 'westus'], services: {
      'Azure App Service': { p: [0, 12], n: [10, 10] },
      Free: { p: [0, 99], n: [1, 1] },
    } },
  };
  if (noMapping) delete data['data/service-pricing-map.json'];
  if (noAvailability) delete data['data/availability-catalog-latest.json'];
  const context = vm.createContext({
    location: { protocol: 'http:' },
    localStorage: { getItem: () => initial ? JSON.stringify(initial) : null, setItem: () => {} },
    console: { error: () => {} },
    fetch: async url => ({ ok: url in data, status: url in data ? 200 : 404, json: async () => structuredClone(data[url]) }),
  });
  context.window = context;
  for (const file of ['planner-data.js', 'planner-core.js']) {
    vm.runInContext(fs.readFileSync(path.join(assets, file), 'utf8'), context);
  }
  const C = context.MRP.core;
  C.load();
  await C.loadData();
  return C;
}

test('availability uses separate service, product and SKU aggregates', async () => {
  const C = await core(), s = { service: 'App Service' };
  assert.equal(C.availability(s, 'westus'), 'yes');
  s.product = 'Web';
  assert.equal(C.availability(s, 'westus'), 'yes');
  assert.equal(C.availability(s, 'eastus'), 'yes');
  assert.equal(C.zoneText(C.availabilityDetails(s, 'eastus')), '1/3 AZs');
  s.sku = 'Basic';
  assert.equal(C.zoneText(C.availabilityDetails(s, 'eastus')), '1 AZ');
  assert.equal(C.zoneText(C.availabilityDetails(s, 'westus')), '');
  s.sku = 'Premium';
  assert.equal(C.zoneText(C.availabilityDetails(s, 'eastus')), '3 AZs');
  assert.equal(C.zoneText({ zoneCounts: [2] }), '2 AZs');
  assert.equal(C.availability(s, 'unknownregion'), 'none');
  s.sku = 'Unknown SKU';
  assert.equal(C.availability(s, 'eastus'), 'none');
});

test('availability does not require a retail price snapshot', async () => {
  const C = await core({ noRetail: true });
  assert.equal(C.D.hasCatalog, false);
  assert.equal(C.D.hasAvailability, true);
  assert.equal(C.availability({ service: 'App Service' }, 'eastus'), 'yes');
});

test('generic evidence is not selectable and cannot substitute a specific SKU', async () => {
  const C = await core();
  assert.deepEqual(Array.from(C.skuOptions({ service: 'App Service', product: 'Web' })), ['Basic', 'Premium']);
  assert.equal(C.availability({ service: 'App Service', product: 'Web', sku: 'Web' }, 'westus'), 'none');
  assert.equal(C.availability({ service: 'App Service', product: 'Web' }, 'westus'), 'yes');
  assert.equal(C.availability({ service: 'App Service', product: 'Web', sku: 'Basic' }, 'westus'), 'no');
  assert.deepEqual(Array.from(C.skuOptions({ service: 'App Service', product: 'Other' })), []);
});

test('missing availability never substitutes retail coverage', async () => {
  const C = await core({ noAvailability: true });
  assert.equal(C.D.hasCatalog, true);
  assert.equal(C.D.hasAvailability, false);
  assert.equal(C.availability({ service: 'App Service' }, 'eastus'), 'none');
  assert.match(C.D.availabilityError, /could not be loaded/);
});

test('pricing inherits mapped names, weights and explicit no-meter rows', async () => {
  const C = await core(), state = C.blank();
  state.current = [{ id: 'eastus' }];
  state.baseline = 'eastus';
  state.services = [
    { id: 'app', service: 'App Service', product: 'Web', sku: 'Basic', weight: 30 },
    { id: 'free', service: 'Free', weight: 70 },
  ];
  C.replace(state);
  await C.loadPricing('eastus');
  assert.equal(C.priceRows()[0].service, 'Azure App Service');
  assert.equal(C.priceRows()[0].availabilityService, 'App Service');
  assert.equal(C.priceRows()[0].id, 'app');
  assert.equal(C.priceRows()[1].retailService, null);
  assert.match(C.priceRows()[1].pricingNote, /free service/);
  assert.equal(C.priceSummary('westus').avg, 12);
  assert.equal(C.priceSummary('westus').weighted, 12);
  assert.equal(C.S.services[0].sku, 'Basic');
});

test('missing mapping never guesses a same-named retail service', async () => {
  const C = await core({ noMapping: true }), state = C.blank();
  state.current = [{ id: 'eastus' }]; state.baseline = 'eastus';
  state.services = [{ service: 'Free' }];
  C.replace(state);
  await C.loadPricing('eastus');
  assert.equal(C.priceRows()[0].retailService, null);
  assert.equal(C.priceSummary('westus').avg, null);
  assert.match(C.D.mappingError, /could not be loaded/);
});

test('legacy plans migrate unambiguous names without guessing products or ambiguous services', async () => {
  const C = await core({ initial: { v: 2, services: [
    { service: 'Azure Cognitive Search', product: 'Old product' },
    { service: 'Azure App Service' },
  ] } });
  assert.equal(C.S.v, 3);
  assert.equal(C.S.services[0].service, 'Azure AI Search');
  assert.equal(C.S.services[0].product, 'Old product');
  assert.equal(C.availability(C.S.services[0], 'eastus'), 'none');
  assert.equal(C.S.services[1].service, 'Azure App Service');
  assert.equal(C.availability(C.S.services[1], 'eastus'), 'none');
  const reopened = C.normalize({ v: 2, services: [{ service: 'Azure Cognitive Search' }] });
  assert.equal(reopened.services[0].service, 'Azure AI Search');
});
