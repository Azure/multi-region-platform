/* Layout helpers: running heads, folios, and diagram connectors.
   Connectors are declared inside any element with class "dg" as:
   <i class="ln" data-from="idA" data-to="idB" data-s="b" data-e="t"
      data-k="yes|no|dash|teal|slate|warm|plain" data-label="Yes" data-lp="0.3" data-mid="0.5"></i>
   Sides: t r b l, optionally with offset "b@0.25" (fraction along the side). */
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const COLORS = { plain: "#8A95A5", yes: "#0F6CBD", no: "#A84E1F", dash: "#8A95A5", teal: "#04807A",
                   slate: "#4A5B72", warm: "#A84E1F", blue: "#0F6CBD", green: "#107C41", light: "#8CC0EE" };

  function folios() {
    const pages = [...document.querySelectorAll(".page")];
    pages.forEach((pg, i) => {
      if (pg.classList.contains("nofolio")) return;
      const sec = pg.dataset.section || "";
      const rh = document.createElement("div"); rh.className = "runhead";
      rh.innerHTML = `<span>Adaptable Multi-Region Azure Platform</span><span class="rh-sec">${sec}</span>`;
      const f = document.createElement("div"); f.className = "folio";
      f.innerHTML = `<span class="pn">${String(i + 1).padStart(2, "0")}</span><span class="rule"></span><span>${document.body.dataset.folio || "Multi-Region Platform Whitepaper"}</span>`;
      pg.appendChild(rh); pg.appendChild(f);
    });
  }

  function anchor(rect, cr, spec) {
    const [side, off] = spec.split("@"); const f = off === undefined ? 0.5 : parseFloat(off);
    const x0 = rect.left - cr.left, y0 = rect.top - cr.top, w = rect.width, h = rect.height;
    switch (side) {
      case "t": return { x: x0 + w * f, y: y0, s: "t" };
      case "b": return { x: x0 + w * f, y: y0 + h, s: "b" };
      case "l": return { x: x0, y: y0 + h * f, s: "l" };
      case "r": return { x: x0 + w, y: y0 + h * f, s: "r" };
    }
  }

  function route(a, b, mid) {
    const V = s => s === "t" || s === "b";
    if (V(a.s) && V(b.s)) {
      if (Math.abs(a.x - b.x) < 0.6) return [a, { x: a.x, y: b.y }];
      const ym = a.y + (b.y - a.y) * mid; return [a, { x: a.x, y: ym }, { x: b.x, y: ym }, b];
    }
    if (!V(a.s) && !V(b.s)) {
      if (Math.abs(a.y - b.y) < 0.6) return [a, { x: b.x, y: a.y }];
      const xm = a.x + (b.x - a.x) * mid; return [a, { x: xm, y: a.y }, { x: xm, y: b.y }, b];
    }
    if (V(a.s)) return [a, { x: a.x, y: b.y }, b];
    return [a, { x: b.x, y: a.y }, b];
  }

  function pathD(pts, r) {
    let d = `M${pts[0].x},${pts[0].y}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const p0 = pts[i - 1], p = pts[i], p1 = pts[i + 1];
      const l0 = Math.hypot(p.x - p0.x, p.y - p0.y), l1 = Math.hypot(p1.x - p.x, p1.y - p.y);
      const rr = Math.min(r, l0 / 2, l1 / 2);
      const ax = p.x - (p.x - p0.x) / l0 * rr, ay = p.y - (p.y - p0.y) / l0 * rr;
      const bx = p.x + (p1.x - p.x) / l1 * rr, by = p.y + (p1.y - p.y) / l1 * rr;
      d += ` L${ax},${ay} Q${p.x},${p.y} ${bx},${by}`;
    }
    const e = pts[pts.length - 1]; d += ` L${e.x},${e.y}`; return d;
  }

  function connectors() {
    document.querySelectorAll(".dg").forEach((dg, di) => {
      const lines = dg.querySelectorAll(":scope i.ln"); if (!lines.length) return;
      const cr = dg.getBoundingClientRect();
      const svg = document.createElementNS(NS, "svg"); svg.setAttribute("class", "conn-layer");
      const defs = document.createElementNS(NS, "defs"); svg.appendChild(defs);
      Object.entries(COLORS).forEach(([k, c]) => {
        const m = document.createElementNS(NS, "marker");
        m.setAttribute("id", `ah-${di}-${k}`); m.setAttribute("viewBox", "0 0 10 10"); m.setAttribute("refX", "8.6"); m.setAttribute("refY", "5");
        m.setAttribute("markerWidth", "7"); m.setAttribute("markerHeight", "7"); m.setAttribute("orient", "auto-start-reverse"); m.setAttribute("markerUnits", "userSpaceOnUse");
        const p = document.createElementNS(NS, "path"); p.setAttribute("d", "M1,1.2 L9,5 L1,8.8 Z"); p.setAttribute("fill", c);
        m.appendChild(p); defs.appendChild(m);
      });
      dg.prepend(svg);
      lines.forEach(ln => {
        const q = id => dg.querySelector(`[id="${id}"]`) || document.getElementById(id);
        const A = q(ln.dataset.from), B = q(ln.dataset.to);
        if (!A || !B) { console.warn("missing", ln.dataset.from, ln.dataset.to); return; }
        const a = anchor(A.getBoundingClientRect(), cr, ln.dataset.s || "b");
        const b = anchor(B.getBoundingClientRect(), cr, ln.dataset.e || "t");
        const k = ln.dataset.k || "plain"; const col = COLORS[k] || COLORS.plain;
        const pts = route(a, b, parseFloat(ln.dataset.mid || "0.5"));
        const p = document.createElementNS(NS, "path"); p.setAttribute("d", pathD(pts, 7));
        p.setAttribute("fill", "none"); p.setAttribute("stroke", col); p.setAttribute("stroke-width", ln.dataset.w || "1.4");
        p.setAttribute("stroke-linejoin", "round"); p.setAttribute("stroke-linecap", "round");
        if (k === "dash" || ln.dataset.dash) p.setAttribute("stroke-dasharray", ln.dataset.dash || "4 4");
        if (ln.dataset.noarrow === undefined) p.setAttribute("marker-end", `url(#ah-${di}-${k in COLORS ? k : "plain"})`);
        if (ln.dataset.both !== undefined) p.setAttribute("marker-start", `url(#ah-${di}-${k in COLORS ? k : "plain"})`);
        svg.appendChild(p);
        if (ln.dataset.label) {
          const L = p.getTotalLength(); const pt = p.getPointAtLength(L * parseFloat(ln.dataset.lp || "0.5"));
          const g = document.createElementNS(NS, "g");
          const t = document.createElementNS(NS, "text"); t.textContent = ln.dataset.label;
          t.setAttribute("x", pt.x); t.setAttribute("y", pt.y + 3.4); t.setAttribute("text-anchor", "middle");
          t.setAttribute("font-size", "9.4"); t.setAttribute("font-weight", "700"); t.setAttribute("fill", col);
          t.setAttribute("font-family", "Pub Sans, Segoe UI, sans-serif"); t.setAttribute("letter-spacing", ".3");
          g.appendChild(t); svg.appendChild(g);
          const bb = t.getBBox();
          const r = document.createElementNS(NS, "rect");
          r.setAttribute("x", bb.x - 6); r.setAttribute("y", bb.y - 2); r.setAttribute("width", bb.width + 12); r.setAttribute("height", bb.height + 4);
          r.setAttribute("rx", (bb.height + 4) / 2); r.setAttribute("fill", "#fff"); r.setAttribute("stroke", col); r.setAttribute("stroke-width", "1");
          g.insertBefore(r, t);
        }
      });
    });
  }

  function toc() {
    const pages = [...document.querySelectorAll(".page")];
    document.querySelectorAll("[data-toc]").forEach(el => {
      const t = document.getElementById(el.dataset.toc); if (!t) return;
      const pg = t.closest(".page"); el.textContent = String(pages.indexOf(pg) + 1).padStart(2, "0");
    });
  }

  function figures() {
    // number figures in reading order; a figure's head and caption share one number
    let n = 0; const map = new Map();
    document.querySelectorAll('.fn').forEach(el => {
      if (!/^Figure/.test(el.textContent.trim())) return;
      const host = el.closest('.figure') || el.closest('[id]') || el;
      if (!map.has(host)) { n += 1; map.set(host, n); if (host.id) map.set(host.id, n); }
      el.textContent = 'Figure ' + map.get(host);
    });
    document.querySelectorAll('[data-figref]').forEach(el => {
      const v = map.get(el.dataset.figref); if (v) el.textContent = 'Figure ' + v;
    });
  }

  function run() { folios(); figures(); toc(); connectors(); document.body.dataset.ready = "1"; }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => requestAnimationFrame(run)); else window.addEventListener("load", run);
})();
