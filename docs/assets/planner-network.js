// Keep the isolated explorer alive when workbook fields or tabs re-render.
(function (global) {
  'use strict';
  const M = global.MRP;
  let host, frame, button, fullButton, body, notice, print, expanded = false, full = false, ready = false;

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
        'This tool saves separately; workbook selections are not imported. Printing includes the current diagram.</p>' +
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
            message(ready ? '' : 'The networking design tool could not be loaded. Reload the page to retry.');
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
      const design = frame.contentWindow.GeoLZPlanner.getPrintDesign();
      const heading = document.createElement('h2'), subtitle = document.createElement('p');
      heading.textContent = 'Advanced networking design - ' + design.title;
      subtitle.textContent = design.subtitle;
      print.append(heading, subtitle, document.importNode(design.diagram, true));
      host.dataset.printReady = '1';
      message('');
      return true;
    } catch (error) {
      host.dataset.printError = '1';
      message('The networking design could not be prepared for printing: ' + error.message);
      return false;
    }
  }

  M.network = { mount, preparePrint };
})(window);
