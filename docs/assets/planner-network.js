// Keep the isolated explorer alive when workbook fields or tabs re-render.
(function (global) {
  'use strict';
  const M = global.MRP;
  let host, frame, button, fullButton, body, notice, print, expanded = false, full = false, ready = false;
  let sourceKey = '';

  function workbookSpec() {
    const C = M.core, S = C.S, picked = C.selected(), notes = [];
    const patterns = { 'Full Regional Hub': 'full-hub', 'Minimal Regional Hub': 'minimal-hub',
      'Remote Hub Connected': 'remote-hub', 'Disconnected Spokes': 'disconnected' };
    const topology = S.estate.topology || picked.map(r => C.effective(r).topology).find(Boolean);
    const result = { format: 1, title: S.meta.name || 'Regional networking design',
      defaults: { topology: topology === 'Azure Virtual WAN' ? 'vwan' : 'hub-spoke',
        firewall: 'none', dns: 'none', ingress: 'none', bastion: 'none', private_user_access: 'none',
        dns_model: 'centralized', routing_intent: false },
      regions: [], region_links: [], onprem: [], hybrid_connections: [],
      workbook: { records: [], notes } };
    const roles = { inspect: ['firewall', 'azure-firewall'], dnsres: ['dns', 'private-resolver'] };
    const addRegion = (id, pattern) => {
      const region = { id, name: C.rname(id), pattern, capabilities: {
        firewall: 'none', dns: 'none', hybrid: 'none', ingress: 'none', bastion: 'none',
        private_user_access: 'none', shared: 'none' } };
      result.regions.push(region);
      return region;
    };
    S.current.forEach(c => {
      addRegion(c.id, c.hub ? 'full-hub' : 'disconnected');
      result.workbook.records.push({ id: c.id, lines: ['Current region' + (c.hub ? ' - geographic hub' : ''),
        'Estate topology: ' + (S.estate.topology || 'Not decided'),
        'Managed with: ' + (S.estate.managed || 'Not decided'),
        'Hybrid connectivity: ' + (S.estate.hybrid || 'Not decided')] });
    });
    const designs = picked.map(r => ({ r, d: C.design(r), e: C.effective(r) }));
    designs.forEach(({ r, e }) => {
      if (!result.regions.some(x => x.id === r.id)) addRegion(r.id, patterns[e.profile] || 'disconnected');
      if (!e.profile) notes.push(C.rname(r.id) + ': connectivity profile is not decided; no hub is assumed.');
      if (e.topology && e.topology !== topology) notes.push(C.rname(r.id) +
        ': mixed topologies are not modelled by GeoLZ. The diagram uses ' + topology + '; the record retains your choice.');
    });
    designs.forEach(({ r, d, e }) => {
      const region = result.regions.find(x => x.id === r.id);
      region.pattern = patterns[e.profile] || 'disconnected';
      if (e.hub && e.hub !== r.id && region.pattern !== 'disconnected') region.remote_hub = e.hub;
      if (region.remote_hub && ['full-hub', 'minimal-hub'].includes(region.pattern)) {
        result.region_links.push({ from: r.id, to: e.hub });
      }
      e.ss.forEach(service => {
        const role = roles[service.id];
        if (role) {
          region.capabilities[role[0]] = { Local: 'local', Remote: 'remote' }[service.p] || 'none';
          if (service.p === 'Local') region[role[0]] = role[1];
          if (service.p === 'Remote') {
            const provider = result.regions.find(x => x.id === service.from);
            if (provider && provider.pattern !== 'disconnected') provider[role[0]] = role[1];
            if (service.from !== e.hub) notes.push(C.rname(r.id) + ': ' + service.short +
              ' comes from ' + C.rname(service.from) + ', not its geographic hub; see the inherited service record.');
          }
        }
        if (service.id === 'gateway') region.capabilities.hybrid =
          { Local: 'local', Remote: 'remote' }[service.p] || 'none';
        if (service.custom) notes.push(C.rname(r.id) + ': custom service "' + service.name +
          '" is retained in the record, not modelled as a traffic-path component.');
      });
      if (result.defaults.topology === 'vwan') {
        region.capabilities.shared = e.ss.some(s => s.p === 'Local' && s.id !== 'inspect' && s.id !== 'gateway')
          ? 'local' : 'remote';
      }
      result.workbook.records.push({ id: r.id, lines: [
        'New region - ' + (e.profile || 'Profile not decided'),
        'Topology: ' + (e.topology || 'Not decided'),
        'Managed with: ' + (e.managed || 'Not decided'),
        'Hub: ' + (e.hub ? C.rname(e.hub) : 'None'),
        'Regional link: ' + (e.link || 'None'),
        'East-west: ' + (e.eastWest || 'Not decided'),
        'Hybrid: ' + (e.hybrid || 'Not decided') + (d.hybridUse ? ' - ' + d.hybridUse : ''),
        'Hybrid path: ' + (e.hybridPath || 'Not decided'),
        ...(d.hybridReason ? ['Hybrid reason: ' + d.hybridReason] : []),
        ...(d.hybridChange ? ['Hybrid change: ' + d.hybridChange] : []),
        ...e.ss.map(s => (s.short || s.name || 'Unnamed service') + ': ' + (s.p || 'Not decided') +
          (s.from ? ' from ' + C.rname(s.from) : '') + (s.note ? ' - ' + s.note : ''))
      ] });
      if (!['Reuse', 'Change'].includes(e.hybrid)) return;
      const gateway = e.ss.find(s => s.id === 'gateway');
      const target = gateway && gateway.p === 'Remote' ? gateway.from : r.id;
      if (/SD-WAN|network virtual appliance/.test(e.hybridPath)) {
        notes.push(C.rname(r.id) + ': SD-WAN/NVA hybrid paths are recorded but not modelled by GeoLZ.');
        return;
      }
      const type = /VPN/.test(e.hybridPath) ? 'vpn' : /ExpressRoute/i.test(d.hybridUse) ? 'expressroute' : '';
      if (!type || !e.hybridPath || !gateway || !['Local', 'Remote'].includes(gateway.p)) {
        notes.push(C.rname(r.id) + ': hybrid connection details are incomplete; no circuit or gateway is invented.');
        return;
      }
      const hostRegion = result.regions.find(x => x.id === target);
      if (!hostRegion || !['full-hub', 'minimal-hub'].includes(hostRegion.pattern)) {
        notes.push(C.rname(r.id) + ': the gateway provider has no recorded local hub; no attachment is assumed.');
        return;
      }
      const location = type === 'expressroute' ? (d.hybridUse.match(/^ExpressRoute circuit in (.+)$/i) || [])[1] : '';
      if (type === 'expressroute' && !location) {
        notes.push(C.rname(r.id) + ': specify the ExpressRoute peering location to draw "' + d.hybridUse + '".');
        return;
      }
      if (e.hybrid === 'Change') notes.push(C.rname(r.id) +
        ': the stated hybrid change is retained in the record; additional circuits are not inferred from free text.');
      const sites = type === 'expressroute'
        ? S.sites.filter(s => C.sitePeering(s) === location) : S.sites.filter(s => s.kind === 'city');
      if (!sites.length) notes.push(C.rname(r.id) +
        ': no matching on-premises location is recorded; the connection uses an unspecified site.');
      const attachments = sites.length ? sites : [{ id: 'circuit-' + (location || r.id),
        name: 'Site not specified' }];
      attachments.forEach(site => {
        if (!result.onprem.some(s => s.id === site.id)) {
          result.onprem.push({ id: site.id, name: site.name || C.siteName(site) });
        }
        const id = site.id + '-' + type + '-' + (location || '');
        let connection = result.hybrid_connections.find(c => c.id === id);
        if (!connection) {
          connection = { id, type, site: site.id,
            name: type === 'vpn' ? 'Site-to-site VPN' : d.hybridUse, connects_to: [] };
          if (location) Object.assign(connection, { peering_location: location, connection: 'provider' });
          result.hybrid_connections.push(connection);
        }
        if (!connection.connects_to.includes(target)) connection.connects_to.push(target);
        // Reusing a circuit also requires the existing geographic hub's attachment.
        if (e.hybrid === 'Reuse' && S.current.some(c => c.id === e.hub && c.hub) &&
            !connection.connects_to.includes(e.hub)) connection.connects_to.push(e.hub);
      });
    });
    notes.push('Firewall and DNS symbols represent the workbook capability choices, not a confirmed product selection.');
    notes.push('Current-region services are shown only where required by a selected new region. No other existing services are assumed.');
    return result;
  }

  function syncWorkbook(force = false) {
    if (!ready) return true;
    try {
      const next = workbookSpec(), key = JSON.stringify(next);
      if (force || key !== sourceKey) {
        frame.contentWindow.GeoLZPlanner.receiveWorkbook(next);
        sourceKey = key;
      }
      message('');
      return true;
    } catch (error) {
      message('The workbook networking definitions could not be loaded: ' + error.message);
      return false;
    }
  }

  function syncTheme() {
    if (ready) frame.contentWindow.GeoLZPlanner.setHostTheme(document.documentElement.dataset.theme || 'auto');
  }

  function syncLayout() {
    const wide = expanded && M.ui.tab === 'design';
    if (document.body.classList.contains('network-wide') !== wide) {
      document.body.classList.toggle('network-wide', wide);
      document.body.classList.remove('nav-open');
      const nav = document.querySelector('.nav-toggle'), backdrop = document.querySelector('.nav-backdrop');
      if (nav) nav.setAttribute('aria-expanded', 'false');
      if (backdrop) backdrop.hidden = true;
    }
  }

  function setFull(on) {
    if (!body || full === on) return;
    full = on;
    body.classList.toggle('is-full', on);
    document.documentElement.classList.toggle('network-full', on);
    fullButton.setAttribute('aria-pressed', String(on));
    fullButton.textContent = on ? 'Exit full page' : 'Expand to full page';
    if (on) body.setAttribute('role', 'dialog');
    else body.removeAttribute('role');
    if (on) body.setAttribute('aria-label', 'Advanced Networking Design Tool, full page');
    else body.removeAttribute('aria-label');
    if (expanded) fullButton.focus();
    if (ready) requestAnimationFrame(() => frame.contentWindow.fit());
  }

  function message(text) {
    notice.textContent = text;
    notice.hidden = !text;
  }

  function mount(node) {
    if (!host) {
      host = node;
      host.innerHTML = '<section class="pl-network" aria-labelledby="pl-network-title">' +
        '<div class="pl-noprint"><h2 id="pl-network-title">Advanced networking design</h2>' +
        '<p class="pl-hint">Design hub-spoke or Virtual WAN networks. Navigation collapses while open; Expand to full page fills the window; Present opens a live window. ' +
        'Regions, connectivity and shared services follow the workbook. Tool-only refinements last until the workbook definitions change; printing includes the diagram and inherited records.</p>' +
        '<button type="button" class="pl-btn" id="pl-network-toggle" aria-expanded="false" aria-controls="pl-network-body">' +
        'Enable Advanced Networking Design Tool</button></div>' +
        '<p id="pl-network-notice" class="pl-mb warning" role="status" hidden></p>' +
        '<div id="pl-network-body" class="pl-noprint" hidden><div class="pl-network-bar">' +
        '<button type="button" class="pl-btn" id="pl-network-full" aria-pressed="false">Expand to full page</button>' +
        '</div></div>' +
        '<div id="pl-network-print"></div></section>';
      button = host.querySelector('#pl-network-toggle');
      body = host.querySelector('#pl-network-body');
      notice = host.querySelector('#pl-network-notice');
      print = host.querySelector('#pl-network-print');
      fullButton = host.querySelector('#pl-network-full');
      fullButton.addEventListener('click', () => setFull(!full));
      document.addEventListener('keydown', event => {
        if (full && event.key === 'Escape') setFull(false);
      });
      button.addEventListener('click', () => {
        expanded = !expanded;
        if (!expanded) setFull(false);
        button.setAttribute('aria-expanded', String(expanded));
        button.textContent = expanded ? 'Hide Advanced Networking Design Tool' : 'Show Advanced Networking Design Tool';
        body.hidden = !expanded;
        syncLayout();
        if (!frame) {
          message('Loading the networking design tool...');
          frame = document.createElement('iframe');
          frame.title = 'Advanced Networking Design Tool - Geo Landing Zone Connectivity Explorer';
          frame.src = 'tools/geolz-explorer/index.html?embed=planner';
          frame.addEventListener('load', () => {
            ready = Boolean(frame.contentWindow.GeoLZPlanner);
            syncTheme();
            if (ready) syncWorkbook();
            else message('The networking design tool could not be loaded. Reload the page to retry.');
          });
          body.appendChild(frame);
        }
        if (expanded && ready) frame.contentWindow.fit();
        if (expanded) host.scrollIntoView({ block: 'start' });
      });
      new MutationObserver(syncTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    }
    host.dataset.tab = M.ui.tab;
    if (M.ui.tab !== 'design') setFull(false);
    syncLayout();
    syncWorkbook();
  }

  function preparePrint() {
    if (!frame) return true;
    print.replaceChildren();
    delete host.dataset.printReady;
    delete host.dataset.printError;
    if (!ready) {
      host.dataset.printError = '1';
      message('The networking design is not ready to print. Wait for the tool to load, or reload the page if loading failed.');
      return false;
    }
    try {
      if (!syncWorkbook()) {
        host.dataset.printError = '1';
        return false;
      }
      const design = frame.contentWindow.GeoLZPlanner.getPrintDesign();
      const heading = document.createElement('h2'), subtitle = document.createElement('p');
      heading.textContent = 'Advanced networking design - ' + design.title;
      subtitle.textContent = design.subtitle;
      print.append(heading, subtitle, document.importNode(design.diagram, true));
      if (design.definitions) print.append(document.importNode(design.definitions, true));
      host.dataset.printReady = '1';
      message('');
      return true;
    } catch (error) {
      host.dataset.printError = '1';
      message('The networking design could not be prepared for printing: ' + error.message);
      return false;
    }
  }

  M.network = { mount, preparePrint, syncWorkbook };
})(window);
