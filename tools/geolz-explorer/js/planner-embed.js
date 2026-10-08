// Same-origin workbook integration: print snapshots and a separate, live presentation window.
let plannerPresentation = null;
window.GeoLZPlanner = {
  setHostTheme(theme) {
    applyTheme(theme);
    this.syncPresentation();
  },
  getPresentationState() {
    const { region, type, sub, dest, step, fail, globalFail } = ui;
    return clone({ spec, ui: { region, type, sub, dest, step, fail, globalFail },
      hiddenLayers: [...hiddenLayers], theme: document.documentElement.dataset.theme || 'auto' });
  },
  receivePresentation(state) {
    loadSpec(state.spec);
    Object.assign(ui, state.ui);
    hiddenLayers = new Set(state.hiddenLayers);
    applyTheme(state.theme);
    applyLayers();
    update();
    fit();
  },
  syncPresentation() {
    if (plannerPresentation && !plannerPresentation.closed && plannerPresentation.GeoLZPlanner) {
      plannerPresentation.GeoLZPlanner.receivePresentation(this.getPresentationState());
    }
  },
  openPresentation() {
    if (plannerPresentation && !plannerPresentation.closed) {
      this.syncPresentation();
      plannerPresentation.focus();
      return;
    }
    const url = new URL(location.href);
    url.searchParams.delete('embed');
    url.searchParams.set('presentation', 'planner');
    plannerPresentation = window.open(url.href, '_blank',
      `popup=yes,width=${Math.max(800, screen.availWidth - 80)},height=${Math.max(600, screen.availHeight - 80)}`);
    if (!plannerPresentation) setStatus('Presentation was blocked by your browser. Allow pop-ups for this site and try Present again.');
  },
  getPrintDesign() {
    if (!layout) throw new Error('No networking diagram is available');
    const root = document.documentElement, theme = root.getAttribute('data-theme');
    root.setAttribute('data-theme', 'light');
    try {
      const source = document.getElementById('diagram'), diagram = source.cloneNode(true);
      const originals = [source, ...source.querySelectorAll('*')];
      const copies = [diagram, ...diagram.querySelectorAll('*')];
      const properties = ['fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-opacity',
        'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'opacity', 'display', 'visibility',
        'font-family', 'font-size', 'font-weight', 'letter-spacing', 'text-anchor', 'dominant-baseline',
        'paint-order', 'marker-start', 'marker-mid', 'marker-end', 'color'];
      originals.forEach((element, i) => {
        const style = getComputedStyle(element);
        properties.forEach(property => {
          const value = style.getPropertyValue(property).replace(/url\(["']?[^)]*#([^"')]+)["']?\)/g,
            'url(#pl-network-$1)');
          copies[i].style.setProperty(property, value);
        });
        copies[i].style.setProperty('animation', 'none');
        if (element.id) copies[i].id = 'pl-network-' + element.id;
        const href = element.getAttribute('href');
        if (href && href.startsWith('#')) copies[i].setAttribute('href', '#pl-network-' + href.slice(1));
      });
      diagram.setAttribute('viewBox', `0 0 ${layout.width} ${layout.height}`);
      diagram.setAttribute('width', layout.width);
      diagram.setAttribute('height', layout.height);
      diagram.style.setProperty('display', 'block');
      diagram.style.setProperty('width', '100%');
      diagram.style.setProperty('height', 'auto');
      diagram.style.setProperty('background', '#fff');
      return { title: $('title').textContent, subtitle: $('subtitle').textContent, diagram };
    } finally {
      if (theme === null) root.removeAttribute('data-theme');
      else root.setAttribute('data-theme', theme);
    }
  },
};

if (PLANNER_MODE === 'embedded') {
  $('btnPresent').title = 'Open the current design in a separate presentation window (F)';
  document.querySelector('footer').textContent = 'Illustrative architecture explorer - not an official Microsoft product - ' +
    'Editor and Details share one side panel; Present (F) opens a separate window. Theme follows the workbook.';
}
if (PLANNER_MODE === 'presentation') {
  if (window.opener && !window.opener.closed && window.opener.GeoLZPlanner) {
    window.GeoLZPlanner.receivePresentation(window.opener.GeoLZPlanner.getPresentationState());
    togglePresent(true);
    buttonLabel($('btnPresent'), 'Close presentation', 'Close this presentation window (Esc or F)');
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') window.close();
    });
  } else {
    setStatus('The source networking design is unavailable. Close this window and use Present from the workbook again.');
  }
}
