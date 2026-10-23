#!/usr/bin/env python3
"""Generate the Key Vault guide pages (22a4-kv1 ... 22a4-kv5) and the matching figure registry entries.

Run from anywhere:  python3 whitepaper/gen/keyvault.py
Re-running must leave `git status whitepaper/pages` empty.
"""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
PAGES = os.path.join(HERE, "..", "pages")
FIGJSON = os.path.join(HERE, "..", "figures.json")

FONT = "Pub Sans, Segoe UI, sans-serif"
SECTION = "Service Guides for Multi Region"

CHIPS = {
    "rw": ("#DFF1E6", "#0B6B38", "#9AD3B0"),
    "ro": ("#FFF1CC", "#8A5A00", "#E8C766"),
    "warn": ("#F8E8DD", "#A84E1F", "#E6B99C"),
    "info": ("#DDEBF9", "#0F548C", "#8CC0EE"),
}


def chip(x, y, w, text, kind, h=18):
    bg, fg, bd = CHIPS[kind]
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="9" fill="{bg}" stroke="{bd}"/>'
            f'<text x="{x + w / 2}" y="{y + h / 2 + 3.4}" text-anchor="middle" font-size="9" font-weight="700" fill="{fg}">{text}</text>')


def arrow(d, head, color="#2B88D8", dash=False, w=1.6):
    da = ' stroke-dasharray="4 3"' if dash else ""
    return (f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{w}"{da}/>'
            f'<path d="{head}" fill="none" stroke="{color}" stroke-width="{w}" stroke-linejoin="round"/>')


def pill(x, y, w, h, l1, l2, fill="#0F6CBD", c1="#fff", c2="#DDEBF9"):
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{h / 2}" fill="{fill}"/>'
            f'<text x="{x + w / 2}" y="{y + h / 2 - 1}" text-anchor="middle" font-size="9.4" font-weight="700" fill="{c1}">{l1}</text>'
            f'<text x="{x + w / 2}" y="{y + h / 2 + 10}" text-anchor="middle" font-size="8.6" fill="{c2}">{l2}</text>')


def region(x, title, vault1, vault2, note, status, kind, faded=False, vault_stroke="#0F6CBD"):
    """Use the same regional container and vault geometry in all seven patterns."""
    op = ' opacity=".85"' if faded else ""
    s = f'<g{op}><rect x="{x}" y="96" width="150" height="140" rx="12" fill="#F7FBFE" stroke="#8CC0EE" stroke-dasharray="4 3"/>'
    s += f'<use href="#i-pin" x="{x + 8}" y="108" width="12" height="12" color="#0F6CBD"/><text x="{x + 24}" y="118" font-size="10" font-weight="700" fill="#0F548C">{title}</text>'
    s += (f'<rect x="{x + 10}" y="138" width="130" height="46" rx="9" fill="#fff" stroke="{vault_stroke}" stroke-width="1.3"/>'
          f'<use href="#i-lock" x="{x + 16}" y="150" width="22" height="22" color="{vault_stroke}"/>'
          f'<text x="{x + 44}" y="157" font-size="10" font-weight="700" fill="#0B3A63">{vault1}</text>'
          f'<text x="{x + 44}" y="171" font-size="9.2" font-weight="700" fill="#0B3A63">{vault2}</text>')
    s += f'<text x="{x + 75}" y="200" text-anchor="middle" font-size="9" fill="#5B6778">{note}</text>'
    s += chip(x + 5, 212, 140, status, kind) + "</g>"
    return s


def svg(inner, aria):
    return (f'<svg viewBox="0 0 360 260" width="100%" role="img" aria-label="{aria}" font-family="{FONT}" '
            f'style="display:block">{inner}</svg>')


A, B = 8, 202
HSM_SOURCE = "Customer-owned external HSM"


def source(title, detail):
    return pill(70, 8, 220, 44, title, detail, fill="#243A57", c2="#E8EDF3")


def distribution(both=False, reference=False):
    """Continuous connectors terminate on vault borders, clear of region headings."""
    color = "#4A5B72" if reference else "#2B88D8"
    s = arrow("M110 52 C110 90 136 90 136 138", "M131 132 L136 138 L141 132", color=color, dash=reference)
    if both:
        s += arrow("M250 52 C250 90 336 90 336 138",
                   "M331 132 L336 138 L341 132")
    return s


def replication(bidirectional=False):
    s = arrow("M148 154 C170 142 190 138 212 150", "M209 143 L212 150 L205 151", dash=True)
    if bidirectional:
        s += arrow("M212 170 C190 182 170 186 148 174", "M151 181 L148 174 L155 173", dash=True)
    return s


def legend(text):
    return f'<text x="180" y="253" text-anchor="middle" font-size="9" fill="#5B6778">{text}</text>'


def d_s1():
    s = source("Approved deployment pipeline", "Load secrets and certificates into each vault")
    s += region(A, "Region A", "Key Vault", "(own copy)", "secrets / certificates", "Full read + write", "rw")
    s += region(B, "Region B", "Key Vault", "(own copy)", "secrets / certificates", "Full read + write", "rw")
    s += distribution(both=True) + legend("Independent copies; no vault-to-vault replication")
    return svg(s, "An approved deployment pipeline loads secrets and certificates into each regional vault independently. There is no vault-to-vault replication.")


def d_s2():
    s = source("Approved deployment pipeline", "Load secrets and certificates into primary")
    s += region(A, "Region A", "Key Vault", "(primary)", "secrets / certificates", "Read + write", "rw")
    s += region(B, "Paired region", "Key Vault", "(Microsoft copy)", "secrets / certificates", "Read-only on failover", "ro", faded=True, vault_stroke="#8CC0EE")
    s += distribution() + replication() + legend("Dashed: Microsoft-managed asynchronous replication")
    return svg(s, "A deployment pipeline loads secrets and certificates into the primary Key Vault. Microsoft asynchronously replicates them to its paired-region copy, which is read-only after Microsoft-managed failover.")


def d_k1():
    s = source("Key Vault key generation", "Create a different key in each regional vault")
    s += region(A, "Region A", "Key Vault", "Std or Premium", "key created here", "Full read + write", "rw")
    s += region(B, "Region B", "Key Vault", "Std or Premium", "key created here", "Full read + write", "rw")
    s += distribution(both=True) + legend("Local key creation; no vault-to-vault replication")
    return svg(s, "A separate Key Vault, Standard or Premium, in each region. Each vault creates its own key, so the two regions hold different keys and each reads and writes independently.")


def d_k2():
    s = source(HSM_SOURCE, "BYOK: import the same key into each vault")
    s += region(A, "Region A", "Key Vault", "Premium", "key imported (BYOK)", "Full read + write", "rw")
    s += region(B, "Region B", "Key Vault", "Premium", "key imported (BYOK)", "Full read + write", "rw")
    s += distribution(both=True) + legend("Independent imports; no vault-to-vault replication")
    return svg(s, "A customer-owned external HSM is the key origin. The BYOK process imports the same key into a Premium vault in each region, with no vault-to-vault replication.")


def d_k3():
    s = source("Managed HSM key generation", "Create the key in the primary region")
    s += region(A, "Region A", "Managed HSM", "(primary)", "key created here", "Read + write", "rw")
    s += region(B, "Region B", "Managed HSM", "(extended)", "same keys and roles", "Read + write", "rw")
    s += distribution() + replication(bidirectional=True) + legend("Dashed: asynchronous replication of keys and roles")
    return svg(s, "Managed HSM creates the key in the primary region. Asynchronous multi-region replication synchronizes keys and roles between the primary and extended regions. Both regions support reads and writes.")


def d_k4():
    s = source(HSM_SOURCE, "BYOK: import the key into the primary region")
    s += region(A, "Region A", "Managed HSM", "(primary)", "key imported (BYOK)", "Read + write", "rw")
    s += region(B, "Region B", "Managed HSM", "(extended)", "replicated copy", "Read + write", "rw")
    s += distribution() + replication(bidirectional=True) + legend("Dashed: asynchronous replication of keys and roles")
    return svg(s, "A customer-owned external HSM imports the key into a Managed HSM in region A. Multi-region replication copies it to region B. Both regions stay active for reads and writes.")


def d_k5():
    s = source(HSM_SOURCE, "Key stays here; never imported into Azure")
    s += region(A, "Region A", "Managed HSM", "+ EKM proxy", "external key reference", "Depends on failing part", "warn")
    s += (f'<g><rect x="{B}" y="96" width="150" height="140" rx="12" fill="#fff" stroke="#C7CFD9" stroke-dasharray="4 3"/>'
          f'<use href="#i-pin" x="{B + 8}" y="108" width="12" height="12" color="#8A97A8"/><text x="{B + 24}" y="118" font-size="10" font-weight="700" fill="#667182">Region B</text>'
          f'<use href="#i-x" x="{B + 60}" y="145" width="30" height="30" color="#A84E1F"/>'
          f'<text x="{B + 75}" y="200" text-anchor="middle" font-size="9" font-weight="700" fill="#A84E1F">No failover target</text>'
          + chip(B + 5, 212, 140, "No geo-replication", "warn") + "</g>")
    s += distribution(reference=True)
    s += '<text x="144" y="88" font-size="9" fill="#4A5B72">Register key reference only</text>'
    s += legend("No key material is imported or geo-replicated")
    return svg(s, "A Managed HSM with an External Key Management proxy in region A uses a key that stays in the customer's own HSM outside Azure. Region B has no failover target because External Key Management does not support geo-replication.")


DIAGRAMS = {"S1": d_s1, "S2": d_s2, "K1": d_k1, "K2": d_k2, "K3": d_k3, "K4": d_k4, "K5": d_k5}
FIGNAMES = {
    "figKVS1": ("key-vault-secrets-per-region", "S1"),
    "figKVS2": ("key-vault-secrets-paired-region", "S2"),
    "figKVK1": ("key-vault-keys-vault-per-region", "K1"),
    "figKVK2": ("key-vault-keys-byok-per-region", "K2"),
    "figKVK3": ("key-vault-keys-managed-hsm-geo", "K3"),
    "figKVK4": ("key-vault-keys-managed-hsm-geo-byok", "K4"),
    "figKVK5": ("key-vault-keys-managed-hsm-ekm", "K5"),
    "figKVTree": ("key-vault-decision-tree", None),
}


def fig(fid, key, wrap_style=""):
    return (f'<div class="figure" id="{fid}" data-export-width="380" style="{wrap_style}"><div style="border:1px solid var(--line);border-radius:12px;padding:8px 10px 4px">'
            f'{DIAGRAMS[key]()}</div></div>')


STYLE = """<style>
  .kv-card { border: 1px solid var(--b100); border-radius: 14px; padding: 14px 16px 12px; background: #fff; display: flex; flex-direction: column; }
  .kv-h { display: flex; gap: 10px; align-items: center; }
  .kv-n { width: 30px; height: 30px; border-radius: 9px; background: var(--b600); color: #fff; font-weight: 700; font-size: 13px; display: grid; place-items: center; flex: none; }
  .kv-h b { font-size: 14.4px; color: var(--ink); font-weight: 650; line-height: 1.2; }
  .kv-r { display: grid; grid-template-columns: 74px 1fr; gap: 8px; padding: 5px 0; border-top: 1px solid var(--line-soft); font-size: 10.8px; line-height: 1.38; color: var(--text); }
  .kv-r:first-of-type { margin-top: 9px; }
  .kv-r span { font-size: 8.8px; letter-spacing: .1em; text-transform: uppercase; font-weight: 700; padding-top: 2px; }
  .kv-r.ok span { color: var(--g700); } .kv-r.bf span { color: var(--b700); } .kv-r.lm span { color: var(--w600); } .kv-r.cr span { color: var(--s600); }
  .kv-card .fig { margin: 8px auto 0; width: 100%; max-width: 360px; }
  .kv-grid3 .fig { max-width: none; }
  .kv-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .kv-grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
  .kv-grid3 .kv-r { grid-template-columns: 58px 1fr; font-size: 10.2px; }
  .kv-grid3 .kv-h b { font-size: 12.6px; }
  .kv-grid3 .kv-card { padding: 12px 12px 10px; }
  .kv-lead { font-size: 12.4px; line-height: 1.45; color: var(--muted); }
  .kv-tag { display: inline-block; font-size: 9px; letter-spacing: .1em; text-transform: uppercase; font-weight: 700; padding: 2px 8px; border-radius: 10px; background: var(--b50); color: var(--b700); margin-left: 6px; vertical-align: middle; }
</style>"""


def head(eyebrow, title, lead):
    return (f'<div class="row" style="gap:40px;align-items:flex-end"><div style="flex:1"><div class="eyebrow" style="color:var(--s600)">{eyebrow}</div>'
            f'<h2 class="title mt8" style="font-size:25px">{title}</h2></div><p class="kv-lead" style="flex:1.3">{lead}</p></div>')


def row(cls, label, text):
    return f'<div class="kv-r {cls}"><span>{label}</span><div>{text}</div></div>'


def card(n, name, rows, fid, key):
    r = "".join(row(c, l, t) for c, l, t in rows)
    return (f'<div class="kv-card"><div class="kv-h"><span class="kv-n">{n}</span><b>{name}</b></div>{r}'
            f'<div class="fig">{fig(fid, key)}</div></div>')


def page(body, extra_style=""):
    return f'<section class="page" data-section="{SECTION}">\n{STYLE}\n<div class="inner">\n{body}\n</div>\n</section>\n'


def page1():
    cols = [("Key Vault Standard", "s", "var(--b600)"), ("Key Vault Premium", "s", "var(--b700)"),
            ("Managed HSM", "s", "var(--t600)"), ("Managed HSM + EKM", "s", "var(--s800)")]
    rows = [
        ("i-shield", "Protection", ["Software, FIPS 140 Level 1", "HSM-backed keys, FIPS 140-3 Level 3", "Single-tenant HSM, FIPS 140-3 Level 3", "Key stays in your own HSM outside Microsoft"]),
        ("i-gauge", "SLA", ["99.99%", "99.99%", "99.9% in one region; 99.99% when replicated across regions", "No end-to-end SLA; the Managed HSM SLA covers only the service"]),
        ("i-doc", "Holds", ["Asymmetric keys, secrets, certificates", "Asymmetric and symmetric keys (preview), secrets, certificates", "Asymmetric and symmetric keys", "Asymmetric and symmetric keys"]),
        ("i-layers", "Zones", ["Automatic zone redundancy in zone regions", "Automatic zone redundancy in zone regions", "Not zone-based; partitions sit on separate servers in different racks", "Depends on your HSM"]),
        ("i-route", "Replication", ["To the paired region only (same geography); none without a pair", "To the paired region only (same geography); none without a pair", "Multi-region replication to one extended region, paired or not", "None; EKM does not support geo-replication"]),
        ("i-loop", "Failover", ["Microsoft-managed; read-only after failover", "Microsoft-managed; read-only after failover", "Both regions stay active; reads and writes continue", "No failover target; recovery depends on the failing part"]),
    ]
    th = "".join(f'<div style="background:{c};color:#fff;padding:8px 10px;font-size:11.4px;font-weight:650;border-radius:9px 9px 0 0">{n}</div>' for n, _, c in cols)
    cells = ""
    for icon, lab, vals in rows:
        cells += f'<div style="display:flex;gap:7px;align-items:center;font-size:10px;letter-spacing:.08em;text-transform:uppercase;font-weight:700;color:var(--s600);border-top:1px solid var(--line-soft);padding:6px 0"><svg width="16" height="16" style="color:var(--b600);flex:none"><use href="#{icon}"/></svg>{lab}</div>'
        for v in vals:
            cells += f'<div style="border-top:1px solid var(--line-soft);padding:6px 10px;font-size:10.8px;line-height:1.36;color:var(--text)">{v}</div>'
    grid = (f'<div id="figKVTiers" class="figure" style="display:grid;grid-template-columns:116px repeat(4,1fr);margin-top:12px;border:1px solid var(--line);border-radius:10px;padding:0 0 4px;overflow:hidden">'
            f'<div></div>{th}{cells}</div>')

    steps = [("Outage begins", "var(--s600)", "0"), ("Public endpoints fail over", "var(--b600)", "a few minutes"),
             ("Private endpoints follow", "var(--b700)", "up to +20 minutes"), ("Vault is read-only", "var(--w600)", "until failover ends")]
    tl = ""
    for i, (t, c, sub) in enumerate(steps):
        tl += (f'<div style="flex:1;position:relative"><div style="height:6px;background:{c};border-radius:3px"></div>'
               f'<div style="font-size:11px;font-weight:650;color:var(--ink);margin-top:6px">{t}</div><div style="font-size:10.4px;color:var(--muted)">{sub}</div></div>')
    constraints = [("3+0", "No paired region", "Qatar Central, Belgium Central, Spain Central"),
                   ("3+1", "Paired, asymmetric", "West US 3 → East US"),
                   ("3+1", "Paired outside the geography", "Brazil South ↔ South Central US")]
    cs = "".join(f'<div style="display:flex;gap:10px;align-items:center;padding:5px 0;border-top:1px solid var(--line-soft)"><span style="min-width:36px;text-align:center;background:var(--b600);color:#fff;border-radius:8px;font-size:11px;font-weight:700;padding:4px 0">{a}</span>'
                 f'<div style="font-size:10.8px;line-height:1.35"><b style="color:var(--ink)">{b}</b><br><span style="color:var(--muted)">{c}</span></div></div>' for a, b, c in constraints)
    body = (head("Service guides · Key Vault", "Azure Key Vault across regions",
                 "Key Vault is often a runtime dependency. Key Vault is multi-tenant; Managed HSM is single-tenant. Pick the product first, then the pattern. Each product handles regions differently.")
            + grid
            + '<div class="row mt12" style="gap:24px;align-items:stretch">'
              '<div style="flex:1.45;border:1px solid var(--line);border-radius:12px;padding:12px 16px"><div class="eyebrow" style="color:var(--b600)">Paired-region failover · Standard and Premium</div>'
              f'<div style="display:flex;gap:10px;margin-top:10px">{tl}</div>'
              '<p style="font-size:10.6px;color:var(--muted);margin-top:8px;line-height:1.4">Microsoft replicates vault contents to the paired region and runs a tested failover. Some pairs, and all nonpaired regions, do not use this model. For the current list, see Reliability in Azure Key Vault.</p></div>'
              f'<div style="flex:1;border:1px solid var(--line);border-radius:12px;padding:12px 16px"><div class="eyebrow" style="color:var(--b600)">Regional design constraints</div><div style="margin-top:6px">{cs}</div></div></div>'
            + '<div class="note mt12" style="padding:9px 14px"><h4>Data can be safe while the app is down</h4>'
              '<p class="small" style="color:var(--ink);font-size:10.8px">Applications can require keys, secrets, and certificates simply to initialize, so data can be recoverable while the application still cannot start.</p></div>')
    return page(body)


def page2():
    c1 = card("1", "Key Vault in each region", [
        ("cr", "Created in", "Each vault. CI/CD and IaC load the same secrets and certificates into every vault."),
        ("ok", "Outage", "Each region keeps full read and write on its own vault."),
        ("bf", "Best for", "Mission-critical workloads that need a short recovery time."),
        ("lm", "Watch for", "You must keep the vaults in sync with your pipeline."),
    ], "figKVS1", "S1")
    c2 = card("2", "Key Vault in a paired region", [
        ("cr", "Created in", "One vault. Microsoft fails it over to the paired region."),
        ("ok", "Outage", "Read-only until failover ends: you can read, but not create, update, or rotate."),
        ("bf", "Best for", "Less critical workloads that accept read-only access and Microsoft's failover timing."),
        ("lm", "Watch for", "Fails over only to a pair in the same geography that is paired in both directions."),
    ], "figKVS2", "S2")
    guide = ('<div class="row mt12" style="gap:20px;align-items:stretch"><div class="note" style="flex:1;padding:10px 14px"><h4>Design guidance</h4>'
             '<p class="small" style="color:var(--ink);font-size:10.8px">Treat each region as its own deployment stamp with its own vault. Roll secrets out through a pipeline, one region at a time, so one bad change cannot reach every region. App-level fallback to another region\'s vault is optional and needs careful design of networking (private endpoints) and identity (managed identities). Do not treat the IaC repository itself as a store for secret values.</p></div>'
             '<div style="flex:.8;background:var(--s800);border-radius:12px;padding:10px 16px;color:#fff;display:flex;flex-direction:column;justify-content:center"><p style="font-size:11.4px;line-height:1.4;color:#fff">Managed HSM and EKM do not hold secrets or certificates. Use Standard or Premium for both.</p></div></div>')
    body = (head("Service guides · Key Vault · Secrets and certificates", "Secrets and certificates: two patterns",
                 "Secrets and certificates can be loaded into any vault by a pipeline. That makes a vault in each region practical.")
            + f'<div class="kv-grid2 mt12">{c1}{c2}</div>' + guide)
    return page(body)


def page3():
    k1 = card("1", "One Key Vault per region", [
        ("cr", "Created in", "Key Vault Standard or Premium, one vault per workload per region."),
        ("ok", "Outage", "Each region works on its own vault, full read and write."),
        ("bf", "Best for", "Workloads whose services can use a separate key in each region."),
        ("lm", "Watch for", "Services that geo-replicate cannot use two vaults. Storage with GRS uses one key from one vault for both copies, so a vault outage affects both."),
    ], "figKVK1", "K1")
    k2 = card("2", "One Premium vault per region + external HSM", [
        ("cr", "Created in", "Imported from your external HSM (BYOK) into a Premium vault in each region."),
        ("ok", "Outage", "Each region works on its own vault, full read and write."),
        ("bf", "Best for", "You must own and hold the master key, or meet BYOK rules, and want to control recovery time."),
        ("lm", "Watch for", "Same service limits as pattern 1, and extra cost."),
    ], "figKVK2", "K2")
    body = (head("Service guides · Key Vault · Keys (1 of 2)", "Keys: vault-based patterns",
                 "Patterns 1 and 2 use Key Vault. Customer-managed keys have extra limits, so design them separately from secrets.")
            + f'<div class="kv-grid2 mt12">{k1}{k2}</div>'
            + '<div class="note mt12" style="padding:9px 14px"><h4>Check before you pick</h4><p class="small" style="color:var(--ink);font-size:10.8px">Confirm that every service using the key supports your pattern. Standard does not support BYOK; check supported HSMs for Premium. Customer-managed keys have extra limits, so design them separately from secrets.</p></div>')
    return page(body)


def page4():
    k3 = card("3", "Managed HSM with geo-replication", [
        ("cr", "Created in", "Managed HSM with multi-region replication."),
        ("ok", "Outage", "Reads and writes stay available in the healthy region."),
        ("bf", "Best for", "Own and hold the master key; mission-critical with customer-controlled recovery."),
        ("lm", "Watch for", "Cost. Keys, role definitions, and role assignments replicate asynchronously within 6 minutes; last changes may be lost if the primary cannot be recovered."),
    ], "figKVK3", "K3")
    k4 = card("4", "Managed HSM geo-replication + external HSM", [
        ("cr", "Created in", "Imported from your external HSM, then replicated."),
        ("ok", "Outage", "Reads and writes stay available in the healthy region."),
        ("bf", "Best for", "Same as pattern 3, with your HSM as the key origin."),
        ("lm", "Watch for", "Cost. Same replication window as pattern 3."),
    ], "figKVK4", "K4")
    k5 = card("5", "Managed HSM without geo-replication + EKM", [
        ("cr", "Created in", "Key never leaves your HSM."),
        ("ok", "Outage", "Depends on the failing part: Managed HSM, EKM proxy, your HSM, or the region. No failover target, so wait for restore."),
        ("bf", "Best for", "You must own and hold the key outside Microsoft."),
        ("lm", "Watch for", "No geo-replication or end-to-end SLA. Proxy or HSM failures can interrupt Azure workloads and do not count against their SLAs."),
    ], "figKVK5", "K5")
    body = (head("Service guides · Key Vault · Keys (2 of 2)", "Keys: Managed HSM patterns",
                 "Patterns 3 to 5 use Managed HSM. Use two regions with replication, or keep the key in your own HSM.")
            + f'<div class="kv-grid3 mt12">{k3}{k4}{k5}</div>'
            + '<p class="small muted mt8" style="font-size:10.2px">Enable Managed HSM multi-region replication to one extended region. Both regions are active and Azure Traffic Manager routes to the closest one; avoid caching DNS longer than the TTL. EKM adds network round trips to your proxy and HSM on every key operation. Managed HSM does not support backup and restore of external keys: recreate the external key reference.</p>')
    return page(body)


NODE = dict(h=52)


def node(x, y, w, t1, t2="", kind="q"):
    fill, stroke, c1, c2 = {"q": ("#fff", "#0F6CBD", "#0A2340", "#5B6778"),
                            "s": ("#EDF8F6", "#04807A", "#03615F", "#03615F"),
                            "k": ("#EEF5FC", "#0F6CBD", "#0B3A63", "#0F548C"),
                            "w": ("#F8E8DD", "#A84E1F", "#A84E1F", "#A84E1F"),
                            "r": ("#0F6CBD", "#0F6CBD", "#fff", "#DDEBF9")}[kind]
    s = f'<rect x="{x}" y="{y}" width="{w}" height="52" rx="10" fill="{fill}" stroke="{stroke}" stroke-width="1.3"/>'
    if t2:
        s += f'<text x="{x + 10}" y="{y + 21}" font-size="10.6" font-weight="700" fill="{c1}">{t1}</text><text x="{x + 10}" y="{y + 38}" font-size="9.6" fill="{c2}">{t2}</text>'
    else:
        s += f'<text x="{x + 10}" y="{y + 31}" font-size="10.6" font-weight="650" fill="{c1}">{t1}</text>'
    return s


def qnode(x, y, w, l1, l2):
    return (f'<rect x="{x}" y="{y}" width="{w}" height="52" rx="10" fill="#fff" stroke="#0F6CBD" stroke-width="1.3"/>'
            f'<text x="{x + 10}" y="{y + 22}" font-size="10.4" font-weight="650" fill="#0A2340">{l1}</text>'
            f'<text x="{x + 10}" y="{y + 37}" font-size="10.4" font-weight="650" fill="#0A2340">{l2}</text>')


def lab(x, y, t, c="#0F548C"):
    return f'<text x="{x}" y="{y}" font-size="9.4" font-weight="700" fill="{c}">{t}</text>'


def ln(d, head=None, c="#2B88D8"):
    s = f'<path d="{d}" fill="none" stroke="{c}" stroke-width="1.6"/>'
    if head:
        s += f'<path d="{head}" fill="none" stroke="{c}" stroke-width="1.6" stroke-linejoin="round"/>'
    return s


def tree_svg():
    BX, BW = 180, 250
    CX, CW = 470, 210
    DX, DW = 720, 220
    r = [0, 74, 168, 242, 304, 376, 438]
    mid = BX + BW // 2

    def yes(x0, x1, y, lx=None):
        return ln(f"M{x0} {y + 26} H{x1}", f"M{x1 - 6} {y + 21}l6 5-6 5") + lab(lx or x0 + 8, y + 19, "Yes")

    def no_down(x, y0, y1):
        return ln(f"M{x} {y0 + 52} V{y1}", f"M{x - 5} {y1 - 6}l5 6 5-6") + lab(x + 8, y0 + 52 + 17, "No")

    s = ""
    s += '<rect x="0" y="214" width="140" height="52" rx="26" fill="#243A57"/><text x="70" y="237" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">What are you</text><text x="70" y="252" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">protecting?</text>'
    s += ln("M140 240 C164 240 156 26 180 26", "M174 21l6 5-6 5") + lab(150, 110, "Secrets or", "#04807A").replace("<text", '<text text-anchor="end"') + lab(150, 122, "certificates", "#04807A").replace("<text", '<text text-anchor="end"')
    s += ln(f"M140 240 C164 240 156 {r[2] + 26} 180 {r[2] + 26}", f"M174 {r[2] + 21}l6 5-6 5") + lab(140, 200, "Keys", "#0F548C").replace("<text", '<text text-anchor="end"')
    s += qnode(BX, r[0], BW, "Need full read and write in the", "surviving region (short recovery time)?")
    s += yes(BX + BW, DX, r[0]) + node(DX, r[0], DW, "Secrets pattern 1", "Key Vault in each region", "s")
    s += no_down(mid, r[0], r[1])
    s += qnode(BX, r[1], BW, "Is there a pair in the same geography,", "paired in both directions?")
    s += yes(BX + BW, DX, r[1]) + node(DX, r[1], DW, "Secrets pattern 2", "Key Vault in a paired region", "s")
    s += lab(mid + 8, r[1] + 70, "No: use secrets pattern 1", "#04807A")
    s += qnode(BX, r[2], BW, "Must the key stay in your own HSM", "outside Microsoft?")
    s += yes(BX + BW, DX, r[2]) + node(DX, r[2], DW, "Keys pattern 5", "Managed HSM + EKM", "w")
    s += no_down(mid, r[2], r[3])
    s += qnode(BX, r[3], BW, "Mission-critical: need read and write in", "a healthy region during failover?")
    s += yes(BX + BW, CX, r[3])
    s += qnode(CX, r[3], CW, "Must you import the key from", "your own HSM (BYOK)?")
    s += yes(CX + CW, DX, r[3], CX + CW + 4) + node(DX, r[3], DW, "Keys pattern 4", "Managed HSM geo-replication + external HSM", "k")
    cm = CX + CW // 2
    s += ln(f"M{cm} {r[3] + 52} V{r[4] + 26} H{DX}", f"M{DX - 6} {r[4] + 21}l6 5-6 5") + lab(cm + 8, r[3] + 69, "No")
    s += node(DX, r[4], DW, "Keys pattern 3", "Managed HSM with geo-replication", "k")
    s += no_down(mid, r[3], r[5])
    s += qnode(BX, r[5], BW, "Must you import the key from", "your own HSM (BYOK)?")
    s += yes(BX + BW, DX, r[5]) + node(DX, r[5], DW, "Keys pattern 2", "Premium vault per region + external HSM", "k")
    s += ln(f"M{mid} {r[5] + 52} V{r[6] + 26} H{DX}", f"M{DX - 6} {r[6] + 21}l6 5-6 5") + lab(mid + 8, r[5] + 69, "No")
    s += node(DX, r[6], DW, "Keys pattern 1", "One Key Vault per region", "k")
    return s


def page5():
    inner = tree_svg()
    svg_tree = (f'<svg viewBox="0 0 940 492" width="100%" role="img" aria-label="Decision tree. For secrets and certificates: if you need full read and write in the surviving region, use a Key Vault in each region; otherwise, if a pair exists in the same geography and is paired both ways, use a Key Vault in a paired region. For keys: if the key must stay in your own HSM outside Microsoft, use Managed HSM with EKM; otherwise, if you need read and write in a healthy region during failover, use Managed HSM with geo-replication, with an external HSM if you import the key; otherwise use a Premium vault per region with an external HSM if you import the key, or one Key Vault per region." '
                f'font-family="{FONT}" style="display:block">{inner}</svg>')
    refs = [
        ("Reliability in Azure Key Vault", "https://learn.microsoft.com/azure/reliability/reliability-key-vault"),
        ("Azure Key Vault availability and redundancy", "https://learn.microsoft.com/azure/key-vault/general/disaster-recovery-guidance"),
        ("Azure paired regions", "https://learn.microsoft.com/azure/reliability/regions-paired"),
        ("Regions that support availability zones", "https://learn.microsoft.com/azure/reliability/availability-zones-region-support"),
        ("Managed HSM multi-region replication", "https://learn.microsoft.com/azure/key-vault/managed-hsm/multi-region-replication"),
        ("Managed HSM overview", "https://learn.microsoft.com/azure/key-vault/managed-hsm/overview"),
        ("Supported HSMs for BYOK", "https://learn.microsoft.com/azure/key-vault/keys/hsm-protected-keys"),
        ("Services that support customer-managed keys", "https://learn.microsoft.com/azure/security/fundamentals/encryption-models"),
        ("How to choose the right key management solution", "https://learn.microsoft.com/azure/security/fundamentals/key-management-choose"),
        ("Key Vault and Managed HSM SLAs", "https://www.microsoft.com/licensing/docs/view/Service-Level-Agreements-SLA-for-Online-Services"),
    ]
    items = "".join(f'<li><a href="{u}">{t}</a></li>' for t, u in refs)
    body = (head("Service guides · Key Vault · Decision tree", "Which Key Vault pattern fits?",
                 "Answer from the left. Each answer ends at one pattern from the previous pages. Validate current service behavior before you commit.")
            + f'<div class="figure" id="figKVTree" style="margin-top:8px">{svg_tree}</div>'
            + '<div class="eyebrow mt8" style="color:var(--s600)">Reference links · Microsoft Learn</div>'
            + f'<ul style="list-style:none;columns:2;column-gap:30px;margin-top:4px;font-size:10.2px;line-height:1.55">{items}</ul>')
    return page(body)


def main():
    for old in ("22a4-kvpattern.html",):
        p = os.path.join(PAGES, old)
        if os.path.exists(p):
            os.remove(p)
    out = {"22a4-kv1-overview.html": page1(), "22a4-kv2-secrets.html": page2(), "22a4-kv3-keys-a.html": page3(),
           "22a4-kv4-keys-b.html": page4(), "22a4-kv5-decision.html": page5()}
    for name, html in out.items():
        with open(os.path.join(PAGES, name), "w", encoding="utf-8", newline="\n") as fh:
            fh.write(html)
    figs = json.load(open(FIGJSON, encoding="utf-8"))
    figs.pop("figKVPattern", None)
    for fid, (name, _) in FIGNAMES.items():
        figs[fid] = name
    with open(FIGJSON, "w", encoding="utf-8", newline="\n") as fh:
        json.dump(figs, fh, indent=1)
        fh.write("\n")
    print("wrote", ", ".join(out))


if __name__ == "__main__":
    main()
