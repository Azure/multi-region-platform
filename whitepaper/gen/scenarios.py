# Generates the customer-scenario pages (editable data lives here).
import html
SC = [
 dict(n=1, lesson="A new in-country region can be qualified for defined workload requirements without forcing portfolio-wide relocation. A nonpaired recovery path must be designed explicitly (Appendix A).", t="Regulated bank adopts a new in-country region", tag="Residency · nonpaired region",
  s="A financial-services organization operates workloads outside its home country. A new Azure region opens in-country while regulatory or business requirements create a need for certain data or services to remain there.",
  steps=[
   ("Driver", "Data residency and regulatory requirements; new in-country Azure region.", "w"),
   ("Framework", "D2 confirms mandatory location requirements. D3 identifies affected workloads and dependencies. D4 validates required services, zones, access, and constraints.", "b"),
   ("Qualification", "Qualified for defined Hybrid-Connected requirements; other portfolio workloads remain candidates until dependencies are understood.", "g"),
   ("Archetype", "Hybrid-Connected Applications.", "t"),
   ("Connectivity profile", "Minimal Regional Hub where selected local capabilities are required; existing hybrid connectivity reused where reachability and resiliency permit.", "b"),
   ("Placement", "In-scope workloads relocate selectively; others remain in place. Recovery architecture stays workload-specific.", "t")]),
 dict(n=2, lesson="Qualify against the requirements that exist today; do not introduce enterprise connectivity or regional platform capabilities before a workload requirement justifies them.", t="AI team requires a specific model or GPU SKU", tag="Specific capacity · net-new",
  s="A product team requires an AI model, GPU SKU, or related Azure service that is unavailable in the organization’s existing regions or constrained by quota.",
  steps=[
   ("Driver", "AI model, service, SKU, or quota availability.", "v"),
   ("Framework", "D1 confirms the business requirement. D2 validates data and compliance constraints. D4 validates current model, service, SKU, zone, access, and quota support.", "b"),
   ("Qualification", "Qualified for the defined AI workload requirements; additional dependencies remain conditional until their design is known.", "g"),
   ("Archetype", "Isolated Cloud-Native or AI where self-contained; Connected Cloud-Native or AI where private enterprise dependencies are required.", "t"),
   ("Connectivity profile", "Disconnected Spokes where the workload is self-contained; a connected profile only where actual dependencies justify it.", "b"),
   ("Placement", "Net-new deployment. Revalidate model, SKU, service, regional access, and quota at decision time.", "t")]),
 dict(n=3, lesson="Aggregate portfolio dependencies determine the appropriate regional connectivity profile; application count or acquisition status does not.", t="Acquisition brings an estate in another geography", tag="Portfolio · integration",
  s="An acquisition introduces a portfolio of interdependent applications, shared data, and local users in a geography where the organization has little or no existing Azure platform presence.",
  steps=[
   ("Driver", "Business expansion through acquisition.", "b"),
   ("Framework", "D1 confirms the business need. D2 evaluates local data obligations. D3 maps portfolio-level dependencies, shared services, and connectivity requirements.", "b"),
   ("Qualification", "Candidate while material dependencies remain unknown; qualified against defined portfolio requirements once discovery is complete.", "g"),
   ("Archetype", "Interconnected Application Portfolios.", "t"),
   ("Connectivity profile", "Remote Hub Connected where cross-region dependencies are acceptable; Minimal Regional Hub where east-west traffic, shared services, latency, or independence justify it.", "b"),
   ("Placement", "Workloads remain in place initially and relocate selectively as business and integration requirements become known.", "t")]),
 dict(n=4, lesson="Remaining in an existing qualified region is a valid outcome. An additional region can remain an option rather than automatically becoming a deployment project.", t="Datacenter exit accelerates migration", tag="Datacenter event · relocation",
  s="A colocation contract is ending. Hybrid-connected applications must leave the datacenter, and the organization asks whether the event also requires adoption of another Azure region.",
  steps=[
   ("Driver", "Datacenter and connectivity event.", "s"),
   ("Framework", "D3 identifies what must move together. D5 validates hybrid connectivity, datacenter and user geography, reachability, resiliency, and whether existing connectivity suffices.", "b"),
   ("Qualification", "The existing target region remains qualified for the identified requirements; an additional region remains a candidate for future use.", "g"),
   ("Archetype", "Hybrid-Connected Applications.", "t"),
   ("Connectivity profile", "Continue to use an existing strategic geographic hub where it satisfies requirements — no new regional hub solely because another region is available.", "b"),
   ("Placement", "Most workloads land in the existing qualified region. Revisit the additional option when requirements change.", "t")]),
]
COL = {"w": ("var(--w600)", "#FBF4EE"), "b": ("var(--b600)", "var(--b50)"), "g": ("var(--g600)", "var(--g100)"),
       "t": ("var(--t600)", "var(--t50)"), "v": ("#8661C5", "#F3EFFA"), "s": ("var(--s800)", "var(--s100)")}

def card(sc):
    cells = []
    for i, (k, v, c) in enumerate(sc["steps"]):
        fg, bg = COL[c]
        cells.append(f'<div class="sx" style="background:{bg}"><div class="sk" style="color:{fg}">{k}</div><div class="sv">{html.escape(v)}</div></div>')
        if i < len(sc["steps"]) - 1:
            cells.append('<div class="sa"><svg width="12" height="16"><path d="M2 2l7 6-7 6" fill="none" stroke="#8CC0EE" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></div>')
    return f'''<div class="scard">
      <div class="shead"><span class="sn">{sc["n"]}</span><div style="flex:1"><div class="st">{html.escape(sc["t"])}</div><div class="ss">{html.escape(sc["s"])}</div></div><span class="chip slate" style="align-self:flex-start">{html.escape(sc["tag"])}</span></div>
      <div class="srow">{"".join(cells)}</div>
      <div class="sl"><svg width="16" height="16"><use href="#i-flag"/></svg><span><b>Takeaway.</b> {html.escape(sc["lesson"])}</span></div>
    </div>'''

STYLE = '''<style>
  .scard { border: 1px solid var(--line); border-radius: 14px; padding: 13px 16px 13px; background: #fff; }
  .scard .shead { display: flex; gap: 12px; align-items: flex-start; }
  .scard .sn { width: 30px; height: 30px; border-radius: 50%; background: var(--t600); color: #fff; font-weight: 700; font-size: 14px; display: grid; place-items: center; flex: none; }
  .scard .st { font-size: 15px; font-weight: 650; color: var(--ink); line-height: 1.25; }
  .scard .ss { font-size: 10.9px; color: var(--text); line-height: 1.45; margin-top: 3px; max-width: 700px; }
  .scard .srow { display: grid; grid-template-columns: .85fr 12px 1.4fr 12px 1.25fr 12px 1fr 12px 1.35fr 12px 1.15fr; align-items: stretch; margin-top: 12px; }
  .scard .sx { border-radius: 9px; padding: 8px 9px; }
  .scard .sk { font-size: 8.8px; letter-spacing: .12em; text-transform: uppercase; font-weight: 700; }
  .scard .sv { font-size: 10.2px; line-height: 1.38; color: var(--ink); margin-top: 4px; }
  .scard .sa { display: grid; place-items: center; }
  .scard .sl { display: flex; gap: 9px; align-items: flex-start; margin-top: 9px; font-size: 11.2px; line-height: 1.45; color: var(--ink); }
  .scard .sl svg { color: var(--t600); flex: none; margin-top: 2px; }
</style>'''

def page(pair, first):
    head = ('''<div class="open-band" id="s8">
    <div class="num" style="color:var(--t600)">08</div>
    <div style="flex:1">
      <div class="eyebrow" style="color:var(--t600)">The framework in use</div>
      <h1 class="sec-title mt8" style="font-size:28px">Customer scenarios</h1>
    </div>
    <p class="standfirst" style="width:330px;font-size:13.6px">How the framework moves from a business or technical driver to a governed regional and workload decision. Illustrative, not customer-specific recommendations.</p>
  </div>''' if first else '''<div class="eyebrow" style="color:var(--t600)">08 · Customer scenarios, continued</div>''')
    body = "\n".join(card(sc) for sc in pair)
    return f'''<section class="page" data-section="08 · Customer scenarios">
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
    import os
    d = os.path.join(os.path.dirname(__file__), "..", "pages")
    open(os.path.join(d, "19-scenarios-1.html"), "w").write(page(SC[:2], True))
    open(os.path.join(d, "19b-scenarios-2.html"), "w").write(page(SC[2:], False))
    print("scenario pages written")
