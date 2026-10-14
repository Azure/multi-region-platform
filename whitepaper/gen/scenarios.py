# Generates the customer-scenario pages. The scenarios come from shared/summary.json
# ("scenarios"); edit them there, then run this script.
import html
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
SUMMARY = HERE.parent.parent / "shared" / "summary.json"
PAGES = HERE.parent / "pages"

SC = json.loads(SUMMARY.read_text(encoding="utf-8"))["scenarios"]
COL = {"w": ("var(--w600)", "var(--w50)"), "b": ("var(--b600)", "var(--b50)"), "g": ("var(--g700)", "var(--g100)"),
       "t": ("var(--t700)", "var(--t50)"), "v": ("var(--v700)", "var(--v50)"), "s": ("var(--s800)", "var(--s100)")}

def card(sc):
    cells = []
    for i, st in enumerate(sc["steps"]):
        k, v, c = st["label"], st["text"], st["tone"]
        fg, bg = COL[c]
        cells.append(f'<div class="sx" style="background:{bg}"><div class="sk" style="color:{fg}">{k}</div><div class="sv">{html.escape(v)}</div></div>')
        if i < len(sc["steps"]) - 1:
            cells.append('<div class="sa"><svg width="12" height="16"><path d="M2 2l7 6-7 6" fill="none" stroke="#8CC0EE" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></div>')
    return f'''<div class="scard">
      <div class="shead"><span class="sn">{sc["n"]}</span><div style="flex:1"><div class="st">{html.escape(sc["title"])}</div><div class="ss">{html.escape(sc["situation"])}</div></div><span class="chip slate" style="align-self:flex-start">{html.escape(sc["tag"])}</span></div>
      <div class="srow">{"".join(cells)}</div>
      <div class="sl"><svg width="16" height="16"><use href="#i-flag"/></svg><span><b>Takeaway.</b> {html.escape(sc["takeaway"])}</span></div>
    </div>'''

STYLE = '''<style>
  .scard { border: 1px solid var(--line); border-radius: 14px; padding: 13px 16px 13px; background: #fff; }
  .scard .shead { display: flex; gap: 12px; align-items: flex-start; }
  .scard .sn { width: 30px; height: 30px; border-radius: 50%; background: var(--t600); color: #fff; font-weight: 700; font-size: 14px; display: grid; place-items: center; flex: none; }
  .scard .st { font-size: 15px; font-weight: 650; color: var(--ink); line-height: 1.25; }
  .scard .ss { font-size: 10.9px; color: var(--text); line-height: 1.45; margin-top: 3px; max-width: 700px; }
  .scard .srow { display: grid; grid-template-columns: .85fr 12px 1.4fr 12px 1.25fr 12px 1fr 12px 1.35fr 12px 1.15fr; align-items: stretch; margin-top: 12px; }
  .scard .sx { border-radius: 9px; padding: 8px 9px; }
  .scard .sk { font-size: 9px; letter-spacing: .12em; text-transform: uppercase; font-weight: 700; }
  .scard .sv { font-size: 10.2px; line-height: 1.38; color: var(--ink); margin-top: 4px; }
  .scard .sa { display: grid; place-items: center; }
  .scard .sl { display: flex; gap: 9px; align-items: flex-start; margin-top: 9px; font-size: 11.2px; line-height: 1.45; color: var(--ink); }
  .scard .sl svg { color: var(--t600); flex: none; margin-top: 2px; }
</style>'''

def page(pair, first):
    head = ('''<div class="open-band" id="s8">
    <div style="flex:1">
      <div class="eyebrow" style="color:var(--t600)">The framework in use</div>
      <h1 class="sec-title mt8" style="font-size:28px">Customer scenarios</h1>
    </div>
    <p class="standfirst" style="width:330px;font-size:13.6px">How the framework moves from a business or technical driver to a governed regional and workload decision. Illustrative, not customer-specific recommendations.</p>
  </div>''' if first else '''<div class="eyebrow" style="color:var(--t600)">Customer scenarios, continued</div>''')
    body = "\n".join(card(sc) for sc in pair)
    return f'''<section class="page" data-section="Customer scenarios">
{STYLE}
<div class="inner">
  {head}
  <div style="display:grid;gap:16px" class="{'mt16' if first else 'mt12'}">
    {body}
  </div>
</div>
</section>
'''

if __name__ == "__main__":
    (PAGES / "19-scenarios-1.html").write_text(page(SC[:2], True), encoding="utf-8", newline="\n")
    (PAGES / "19b-scenarios-2.html").write_text(page(SC[2:], False), encoding="utf-8", newline="\n")
    print("scenario pages written")
