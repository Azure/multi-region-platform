// Multi-region platform — site behavior (no dependencies).
(function () {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // theme
  $('.theme').addEventListener('click', () => {
    const root = document.documentElement;
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('mrp-theme', root.dataset.theme); } catch (e) {}
  });

  // downloads menu
  const dlBtn = $('.btn-dl'), dlMenu = $('#dl-menu');
  dlBtn.addEventListener('click', e => { e.stopPropagation(); dlMenu.hidden = !dlMenu.hidden; dlBtn.setAttribute('aria-expanded', String(!dlMenu.hidden)); });
  document.addEventListener('click', e => { if (!dlMenu.hidden && !dlMenu.contains(e.target)) { dlMenu.hidden = true; dlBtn.setAttribute('aria-expanded', 'false'); } });

  // nav expand / collapse
  $$('.nav .chev, .nav .nav-group').forEach(b => b.addEventListener('click', e => {
    e.preventDefault(); b.closest('li').classList.toggle('open');
  }));
  const act = $('.nav li.active');
  const sideIn = $('.side-in');
  if (act && sideIn) {
    const top = act.getBoundingClientRect().top - sideIn.getBoundingClientRect().top + sideIn.scrollTop;
    sideIn.scrollTop = Math.max(0, top - sideIn.clientHeight / 2);
  }

  // figures: scale live HTML figures to the available width
  function fit() {
    $$('.fig.live').forEach(f => {
      const stage = $('.fig-stage', f), scaleEl = $('.fig-scale', f), wpf = $('.wpf', f);
      const w = wpf.offsetWidth || +wpf.dataset.w, h = wpf.offsetHeight || +wpf.dataset.h, avail = stage.clientWidth;
      const s = Math.min(1, avail / w);
      scaleEl.style.transform = s < 1 ? `scale(${s})` : '';
      scaleEl.style.width = s < 1 ? w + 'px' : '';
      stage.style.height = Math.ceil(h * s) + 'px';
    });
  }
  fit(); addEventListener('resize', fit);
  if (document.fonts) document.fonts.ready.then(fit);

  // lightbox
  const lb = $('#lightbox'), lbStage = $('.lb-stage', lb);
  function openLb(fig) {
    lbStage.innerHTML = '';
    const src = $('.wpf', fig) || $('img', fig);
    const clone = src.cloneNode(true);
    if (clone.classList.contains('wpf')) {
      const src0 = $('.wpf', fig), w = src0.offsetWidth || +clone.dataset.w, h = src0.offsetHeight || +clone.dataset.h;
      const s = Math.min(1.6, (innerWidth * 0.9 - 56) / w, (innerHeight * 0.88 - 56) / h);
      const box = document.createElement('div');
      box.style.width = w * s + 'px'; box.style.height = h * s + 'px';
      clone.style.transform = `scale(${s})`; clone.style.transformOrigin = '0 0';
      box.appendChild(clone); lbStage.appendChild(box);
    } else { clone.style.maxWidth = '90vw'; clone.style.maxHeight = '84vh'; lbStage.appendChild(clone); }
    lb.hidden = false; $('.lb-close', lb).focus();
  }
  $$('.fig-zoom').forEach(b => b.addEventListener('click', () => openLb(b.closest('.fig'))));
  lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lb-close')) lb.hidden = true; });
  addEventListener('keydown', e => { if (e.key === 'Escape') { lb.hidden = true; closeResults(); } });

  // "In this article" scrollspy
  const railLinks = $$('.rail a');
  if (railLinks.length) {
    const heads = railLinks.map(a => document.getElementById(decodeURIComponent(a.hash.slice(1)))).filter(Boolean);
    const spy = () => {
      let cur = heads[0];
      heads.forEach(h => { if (h.getBoundingClientRect().top < 120) cur = h; });
      railLinks.forEach(a => a.classList.toggle('on', a.hash.slice(1) === (cur && cur.id)));
    };
    addEventListener('scroll', spy, { passive: true }); spy();
  }

  // search
  const q = $('#q'), res = $('#results');
  let index = null, sel = -1;
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  async function load() {
    if (index) return index;
    try { index = await (await fetch('assets/search-index.json')).json(); } catch (e) { index = []; }
    return index;
  }
  function closeResults() { res.hidden = true; sel = -1; }
  function snippet(text, terms) {
    const low = text.toLowerCase();
    let pos = -1;
    for (const t of terms) { pos = low.indexOf(t); if (pos >= 0) break; }
    if (pos < 0) return esc(text.slice(0, 140)) + '…';
    const start = Math.max(0, pos - 60), s = text.slice(start, start + 170);
    let out = esc(s);
    terms.forEach(t => { out = out.replace(new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>'); });
    return (start ? '…' : '') + out + '…';
  }
  async function search() {
    const v = q.value.trim().toLowerCase();
    if (v.length < 2) { closeResults(); return; }
    const terms = v.split(/\s+/).filter(Boolean);
    const data = await load();
    const hits = [];
    data.forEach(p => {
      const title = p.t.toLowerCase(), body = p.x.toLowerCase();
      if (!terms.every(t => title.includes(t) || body.includes(t) || p.h.some(h => h[1].toLowerCase().includes(t)))) return;
      let score = 0; terms.forEach(t => { if (title.includes(t)) score += 10; });
      const head = p.h.find(h => terms.every(t => h[1].toLowerCase().includes(t)));
      if (head) score += 5;
      terms.forEach(t => { score += Math.min(5, body.split(t).length - 1); });
      hits.push({ p, head, score });
    });
    hits.sort((a, b) => b.score - a.score);
    res.innerHTML = hits.length ? hits.slice(0, 8).map(({ p, head }) => {
      const url = p.u + (head ? '#' + head[0] : '');
      const ttl = esc(p.t) + (head ? ' › ' + esc(head[1]) : '');
      return `<a href="${url}"><b>${ttl}</b><small>${snippet(p.x, terms)}</small></a>`;
    }).join('') : '<div class="none">No results.</div>';
    res.hidden = false; sel = -1;
  }
  q.addEventListener('input', search);
  q.addEventListener('focus', () => { if (q.value.trim().length > 1) search(); });
  q.addEventListener('keydown', e => {
    const items = $$('a', res);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); if (!items.length) return;
      sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items.forEach((a, i) => a.classList.toggle('sel', i === sel));
    } else if (e.key === 'Enter') {
      const a = items[sel >= 0 ? sel : 0]; if (a) location.href = a.href;
    }
  });
  document.addEventListener('click', e => { if (!e.target.closest('.search')) closeResults(); });
  addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); q.focus(); q.select(); } });
})();
