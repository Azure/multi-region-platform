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
    """Use the same regional container and vault geometry in all nine patterns."""
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


def paired_key(tier):
    s = source("Key Vault key generation", "Create the key in the primary vault")
    s += region(A, "Region A", "Key Vault", tier + " (primary)", "key created here", "Read + write", "rw")
    s += region(B, "Paired region", "Key Vault", "(Microsoft copy)", tier + " vault copy", "Read-only on failover", "ro", faded=True)
    s += distribution() + replication() + legend("Dashed: Microsoft-managed asynchronous replication")
    return svg(s, f"{tier} Key Vault generates a key in the primary region; Microsoft asynchronously replicates it to a paired-region copy of the same vault. Read-only after Microsoft-managed failover.")


def d_k1():
    return paired_key("Standard")


def d_k2():
    return paired_key("Premium")


def d_k3():
    s = source("Key Vault key generation", "Create a different key in each regional vault")
    s += region(A, "Region A", "Key Vault", "Std or Premium", "key created here", "Full read + write", "rw")
    s += region(B, "Region B", "Key Vault", "Std or Premium", "key created here", "Full read + write", "rw")
    s += distribution(both=True) + legend("Local key creation; no vault-to-vault replication")
    return svg(s, "A separate Key Vault, Standard or Premium, in each region. Each vault creates its own key, so the two regions hold different keys and each reads and writes independently.")


def d_k4():
    s = source(HSM_SOURCE, "BYOK: import the same key into each vault")
    s += region(A, "Region A", "Key Vault", "Premium", "key imported (BYOK)", "Full read + write", "rw")
    s += region(B, "Region B", "Key Vault", "Premium", "key imported (BYOK)", "Full read + write", "rw")
    s += distribution(both=True) + legend("Independent imports; no vault-to-vault replication")
    return svg(s, "A customer-owned external HSM is the key origin. The BYOK process imports the same key into a Premium vault in each region, with no vault-to-vault replication.")


def d_k5():
    s = source("Managed HSM key generation", "Create the key in the primary region")
    s += region(A, "Region A", "Managed HSM", "(primary)", "key created here", "Read + write", "rw")
    s += region(B, "Region B", "Managed HSM", "(extended)", "same keys and roles", "Read + write", "rw")
    s += distribution() + replication(bidirectional=True) + legend("Dashed: asynchronous replication of keys and roles")
    return svg(s, "Managed HSM creates the key in the primary region. Asynchronous multi-region replication synchronizes keys and roles between the primary and extended regions. Both regions support reads and writes.")


def d_k6():
    s = source(HSM_SOURCE, "BYOK: import the key into the primary region")
    s += region(A, "Region A", "Managed HSM", "(primary)", "key imported (BYOK)", "Read + write", "rw")
    s += region(B, "Region B", "Managed HSM", "(extended)", "replicated copy", "Read + write", "rw")
    s += distribution() + replication(bidirectional=True) + legend("Dashed: asynchronous replication of keys and roles")
    return svg(s, "A customer-owned external HSM imports the key into a Managed HSM in region A. Multi-region replication copies it to region B. Both regions stay active for reads and writes.")


def d_k7():
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


DIAGRAMS = {"S1": d_s1, "S2": d_s2, "K1": d_k1, "K2": d_k2, "K3": d_k3,
            "K4": d_k4, "K5": d_k5, "K6": d_k6, "K7": d_k7}
FIGNAMES = {
    "figKVS1": ("key-vault-secrets-per-region", "S1"),
    "figKVS2": ("key-vault-secrets-paired-region", "S2"),
    "figKVK1": ("key-vault-keys-standard-paired-region", "K1"),
    "figKVK2": ("key-vault-keys-premium-paired-region", "K2"),
    "figKVK3": ("key-vault-keys-vault-per-region", "K3"),
    "figKVK4": ("key-vault-keys-byok-per-region", "K4"),
    "figKVK5": ("key-vault-keys-managed-hsm-geo", "K5"),
    "figKVK6": ("key-vault-keys-managed-hsm-geo-byok", "K6"),
    "figKVK7": ("key-vault-keys-managed-hsm-ekm", "K7"),
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
  .kv-quad { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .kv-quad .kv-card { display:grid; grid-template-columns:1.05fr 1fr; gap:0 10px; padding:12px; }
  .kv-quad .kv-h { grid-column:1 / -1; margin-bottom:6px; }
  .kv-quad .kv-h b { font-size:12px; }
  .kv-quad .kv-r { grid-template-columns:52px 1fr; font-size:10.4px; padding:4px 0; }
  .kv-quad .fig { grid-column:2; grid-row:2 / 6; align-self:center; margin:0; }
  .kv-scenarios { display:grid; grid-template-columns:1fr 1fr; gap:5px 18px; font-size:10px; line-height:1.3; }
  .kv-scenarios p { margin:0; padding-top:4px; border-top:1px solid var(--line); }
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
        ("i-doc", "Holds", ["Asymmetric keys, secrets, certificates", "Asymmetric and symmetric keys (preview), secrets, certificates", "Asymmetric and symmetric keys", "External key references"]),
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

    body = (head("Service guides · Key Vault", "Azure Key Vault across regions",
                 "Data can be recoverable while the application cannot start without its keys, secrets, and certificates. Key Vault is multi-tenant; Managed HSM is single-tenant.")
            + '<div class="row mt12" style="gap:20px;align-items:stretch">'
              '<div class="note" style="flex:1;padding:9px 12px"><h4>Paired regions</h4><p style="font-size:10.8px;line-height:1.4">Eligible Standard/Premium vaults replicate asynchronously to a Microsoft-managed copy. Microsoft may take hours or longer to initiate failover; afterward access is read-only. Private Link reconnection can add 20 minutes.</p></div>'
              '<div class="note" style="flex:1;padding:9px 12px"><h4>Nonpaired regions and exceptions</h4><p style="font-size:10.8px;line-height:1.4">Use independent vaults or supported Managed HSM replication. Check 3+0, asymmetric 3+1, and cross-geography 3+1. Brazil South, Brazil Southeast, West US 3, and nonpaired regions lack Microsoft-managed vault failover.</p></div></div>'
            + grid
            + scenario_summary())
    return page(body)


def scenario_summary():
    rows = [
        ("Application encryption", "Match application operations; preserve identifiers and versions."),
        ("Storage GRS", "One account/key dependency. Independent vaults do not assign separate keys to GRS replicas."),
        ("Storage object replication", "Separate accounts can use independent keys and vaults."),
        ("VM disk encryption", "Regional Disk Encryption Sets; distinguish guest encryption and Secure Key Release."),
        ("Azure Site Recovery", "Pre-create target-region Disk Encryption Set and vault access. Do not infer HSM support."),
        ("PostgreSQL / MySQL Flexible", "Replica, geo-backup, and geo-restore have different key, region, and identity rules."),
        ("Database geo-replication", "SQL permits documented regional key copies; Cosmos DB has account-level CMK requirements."),
        ("Database geo-restore", "Retain historical keys; validate target region, identities, and backup requirements."),
        ("Purview Information Protection", "Identify tenant-key BYOK versus Customer Key. Preserve keys for old content."),
    ]
    anchors = ["application-level-encryption", "azure-storage-grs", "storage-object-replication",
               "vm-disk-encryption", "azure-site-recovery", "postgresql-and-mysql-flexible-server",
               "database-geo-replication", "database-geo-restore", "purview-information-protection"]
    cells = "".join(
        f'<p><b><a href="https://azure.github.io/multi-region-platform/key-vault-across-regions.html#{anchor}">{s}</a></b><br>{c}</p>'
        for (s, c), anchor in zip(rows, anchors))
    return ('<div class="eyebrow mt12" style="color:var(--s600)">Common key-management scenarios</div>'
            f'<div class="kv-scenarios" style="margin-top:5px">{cells}</div><p style="font-size:9.6px;color:var(--muted);margin-top:5px">'
            'Select a scenario for applicable patterns, linked deployment diagrams, and service-specific conditions. Conditional options are not universal support guarantees.</p>')


def page2():
    c1 = card("1", "Key Vault in each region", [
        ("cr", "Created in", "An approved pipeline loads secrets and certificates into each regional vault. IaC configures the vaults."),
        ("ok", "Outage", "Each region keeps full read and write on its own vault."),
        ("bf", "Best for", "Mission-critical workloads that need a short recovery time."),
        ("lm", "Watch for", "You must keep the vaults in sync with your pipeline."),
    ], "figKVS1", "S1")
    c2 = card("2", "Key Vault in a paired region", [
        ("cr", "Created in", "Pipeline populates primary; Microsoft asynchronously replicates to its paired-region copy."),
        ("ok", "Outage", "Read-only until failover ends: you can read, but not create, update, or rotate."),
        ("bf", "Best for", "Less critical workloads that accept read-only access and Microsoft's failover timing."),
        ("lm", "Watch for", "Check eligible same-geography pairing and exclusions. Microsoft can delay failover for hours or longer."),
    ], "figKVS2", "S2")
    guide = ('<div class="row mt12" style="gap:20px;align-items:stretch"><div class="note" style="flex:1;padding:10px 14px"><h4>Design guidance</h4>'
             '<p class="small" style="color:var(--ink);font-size:10.8px">Treat each region as a deployment stamp. Roll secrets out one region at a time; a bad change must not reach every vault at once. Optional app-level fallback needs private connectivity, managed identities, and version selection. Never store secret values in the IaC repository.</p></div>'
             '<div style="flex:.8;background:var(--s800);border-radius:12px;padding:10px 16px;color:#fff;display:flex;flex-direction:column;justify-content:center"><p style="font-size:11.4px;line-height:1.4;color:#fff">Managed HSM and EKM do not hold secrets or certificates. Use Standard or Premium for both.</p></div></div>')
    body = (head("Service guides · Key Vault · Secrets and certificates", "Secrets and certificates: two patterns",
                 "Secrets and certificates can be loaded into any vault by a pipeline. That makes a vault in each region practical.")
            + f'<div class="kv-grid2 mt12">{c1}{c2}</div>' + guide)
    return page(body)


def page3():
    k1 = card("1", "Standard vault + paired-region replication", [
        ("cr", "Origin", "Software-protected key generated in the primary vault."),
        ("ok", "Outage", "Read-only after Microsoft-managed failover."),
        ("bf", "Best for", "Software protection; accepts Microsoft recovery timing."),
        ("lm", "Watch for", "Eligible pair only. No key creation or rotation during failover."),
    ], "figKVK1", "K1")
    k2 = card("2", "Premium vault + paired-region replication", [
        ("cr", "Origin", "HSM-protected key generated in the primary vault."),
        ("ok", "Outage", "Read-only after Microsoft-managed failover."),
        ("bf", "Best for", "HSM protection; accepts Microsoft recovery timing."),
        ("lm", "Watch for", "Premium uses the same regional recovery model as Standard."),
    ], "figKVK2", "K2")
    k3 = card("3", "One Key Vault per region", [
        ("cr", "Origin", "Generate a different key in each Standard or Premium vault."),
        ("ok", "Outage", "Full local read and write in the surviving region."),
        ("bf", "Best for", "Services allowing independent regional keys."),
        ("lm", "Watch for", "Not separate keys for replicas of one GRS storage account."),
    ], "figKVK3", "K3")
    k4 = card("4", "Premium vault per region + external HSM / BYOK", [
        ("cr", "Origin", "Customer-owned external HSM; import into each vault."),
        ("ok", "Outage", "Full local read and write in the surviving region."),
        ("bf", "Best for", "External key origin with independent regional vaults."),
        ("lm", "Watch for", "Pattern 3 service constraints; coordinate imports and rotation."),
    ], "figKVK4", "K4")
    body = (head("Service guides · Key Vault · Keys (1 of 2)", "Keys: vault-based patterns",
                 "Keys - Patterns 1-4 use vaults. Compare Microsoft-managed recovery with independent regional vaults; confirm the consuming service supports the topology.")
            + f'<div class="kv-quad mt12">{k1}{k2}{k3}{k4}</div>'
            + '<div class="note mt12" style="padding:9px 14px"><h4>Key origin is not the same as recovery</h4><p class="small" style="color:var(--ink);font-size:10.8px">CMKs protect a service data encryption key. Standard supports software-key import; the HSM-to-HSM BYOK transfer patterns use Premium or Managed HSM. Importing the same material into two vaults does not automatically make a service support two vaults. Preserve required historical key versions.</p></div>')
    return page(body)


def page4():
    k5 = card("5", "Managed HSM with geo-replication", [
        ("cr", "Created in", "Managed HSM with multi-region replication."),
        ("ok", "Outage", "Reads and writes stay available in the healthy region."),
        ("bf", "Best for", "Supported shared-key dependencies with a customer-selected extended region."),
        ("lm", "Watch for", "Cost. Keys, role definitions, and role assignments replicate asynchronously within 6 minutes; last changes may be lost if the primary cannot be recovered."),
    ], "figKVK5", "K5")
    k6 = card("6", "Managed HSM geo-replication + external HSM / BYOK", [
        ("cr", "Created in", "Imported from your external HSM, then replicated."),
        ("ok", "Outage", "Reads and writes stay available in the healthy region."),
        ("bf", "Best for", "Same as Pattern 5, with a customer-owned external HSM as origin."),
        ("lm", "Watch for", "Cost, imports, and the same replication window as Pattern 5."),
    ], "figKVK6", "K6")
    k7 = card("7", "Managed HSM without geo-replication + EKM", [
        ("cr", "Created in", "Key never leaves your HSM."),
        ("ok", "Outage", "Depends on the failing part: Managed HSM, EKM proxy, your HSM, or the region. No failover target, so wait for restore."),
        ("bf", "Best for", "You must own and hold the key outside Microsoft."),
        ("lm", "Watch for", "No geo-replication or end-to-end SLA. External dependency failures can interrupt workloads; verify each service integration."),
    ], "figKVK7", "K7")
    body = (head("Service guides · Key Vault · Keys (2 of 2)", "Keys: Managed HSM patterns",
                 "Keys - Patterns 5-7 use Managed HSM. Replicate Azure-held keys, or keep physical key custody outside Microsoft. EKM does not support Secure Key Release.")
            + f'<div class="kv-grid3 mt12">{k5}{k6}{k7}</div>'
            + '<p class="small muted mt8" style="font-size:10.2px">Enable Managed HSM multi-region replication to one extended region. Both regions are active and Azure Traffic Manager routes to the closest one; avoid caching DNS longer than the TTL. EKM adds network round trips to your proxy and HSM on every key operation. Managed HSM does not support backup and restore of external keys: recreate the external key reference.</p>')
    return page(body)


def node(x, y, w, t1, t2="", kind="q"):
    fill, stroke, c1, c2 = {"q": ("#fff", "#0F6CBD", "#0A2340", "#5B6778"),
                            "s": ("#EDF8F6", "#04807A", "#03615F", "#03615F"),
                            "k": ("#EEF5FC", "#0F6CBD", "#0B3A63", "#0F548C"),
                            "w": ("#F8E8DD", "#A84E1F", "#A84E1F", "#A84E1F"),
                            "r": ("#0F6CBD", "#0F6CBD", "#fff", "#DDEBF9")}[kind]
    s = f'<rect x="{x}" y="{y}" width="{w}" height="52" rx="10" fill="{fill}" stroke="{stroke}" stroke-width="1.3"/>'
    if t2:
        s += f'<text x="{x + 10}" y="{y + 21}" font-size="14.4" font-weight="700" fill="{c1}">{t1}</text><text x="{x + 10}" y="{y + 38}" font-size="13" fill="{c2}">{t2}</text>'
    else:
        s += f'<text x="{x + 10}" y="{y + 31}" font-size="14.4" font-weight="650" fill="{c1}">{t1}</text>'
    return s


def tree_svg():
    def box(x, y, title, detail, kind="q"):
        return node(x, y, 340 if x == 850 else 310, title, detail, kind)

    def link(d, x, y, label):
        return (f'<path d="{d}" fill="none" stroke="#2B88D8" stroke-width="2" marker-end="url(#kv-tree-arrow)"/>'
                f'<text x="{x}" y="{y}" font-size="13" font-weight="700" fill="#0F548C">{label}</text>')

    def right(x, y, target, label="Yes"):
        return link(f"M{x} {y + 26} C{x + 30} {y + 26} {target - 30} {y + 26} {target} {y + 26}",
                    x + 12, y + 17, label)

    def down(x, y, target):
        return link(f"M{x} {y + 52} C{x} {y + 62} {x} {target - 10} {x} {target}",
                    x + 10, y + 70, "No")

    s = '<defs><marker id="kv-tree-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1 1 L9 5 L1 9" fill="none" stroke="#2B88D8" stroke-width="1.5"/></marker></defs>'
    s += '<text x="50" y="20" font-size="17" font-weight="700" fill="#04807A">Secrets and certificates</text>'
    s += box(50, 36, "Need full read and write", "in the surviving region?")
    s += right(360, 36, 450, "No")
    s += box(450, 36, "Eligible same-geography pair", "and accept read-only recovery?")
    s += box(850, 0, "Secrets and certificates - Pattern 2", "One vault with a paired-region copy", "s")
    s += box(850, 92, "Secrets and certificates - Pattern 1", "Independent regional vaults", "s")
    s += link("M760 62 C810 62 810 26 850 26", 773, 48, "Yes")
    s += link("M605 88 C605 118 810 118 850 118", 615, 107, "No")
    s += link("M205 88 C205 174 810 174 850 118", 215, 145, "Yes")
    s += '<text x="50" y="194" font-size="17" font-weight="700" fill="#0F548C">Keys - validate the consuming service first</text>'
    s += box(50, 210, "Must physical key custody remain", "in an HSM outside Microsoft?")
    s += right(360, 210, 850)
    s += box(850, 210, "Keys - Pattern 7", "Managed HSM + EKM; no geo-replication", "w")
    s += down(205, 210, 284)
    s += box(50, 284, "Need a shared replicated key store", "with healthy-region read and write?")
    s += right(360, 284, 450)
    s += box(450, 284, "External HSM as key origin?", "Import key material through BYOK")
    s += right(760, 284, 850)
    s += box(850, 284, "Keys - Pattern 6", "Replicated Managed HSM + BYOK", "k")
    s += link("M605 336 C605 384 810 384 850 384", 615, 359, "No")
    s += box(850, 358, "Keys - Pattern 5", "Replicated Managed HSM; generate key", "k")
    s += down(205, 284, 432)
    s += box(50, 432, "Can the service use independent", "regional vaults and keys?")
    s += right(360, 432, 450)
    s += box(450, 432, "External HSM as key origin?", "Import key material through BYOK")
    s += right(760, 432, 850)
    s += box(850, 432, "Keys - Pattern 4", "Premium vault per region + BYOK", "k")
    s += link("M605 484 C605 532 810 532 850 532", 615, 507, "No")
    s += box(850, 506, "Keys - Pattern 3", "Regional vaults; generate independent keys", "k")
    s += down(205, 432, 580)
    s += box(50, 580, "Eligible pair and accept Microsoft", "recovery timing and read-only access?")
    s += right(360, 580, 450)
    s += box(450, 580, "Require HSM-protected keys?", "Otherwise use software-protected keys")
    s += right(760, 580, 850)
    s += box(850, 580, "Keys - Pattern 2", "Premium vault + paired-region copy", "k")
    s += link("M605 632 C605 680 810 680 850 680", 615, 655, "No")
    s += box(850, 654, "Keys - Pattern 1", "Standard vault + paired-region copy", "k")
    s += down(205, 580, 654)
    s += box(50, 654, "Revisit the workload design", "No candidate meets these requirements", "w")
    return s


def page5():
    inner = tree_svg()
    svg_tree = (f'<svg viewBox="0 0 1220 730" width="100%" role="img" aria-label="Decision tree covering Secrets and certificates - Patterns 1-2 and Keys - Patterns 1-7. Check the consuming service, external key custody, shared replicated key requirements, independent regional key support, eligible pairing, BYOK, and HSM protection." '
                f'font-family="{FONT}" style="display:block">{inner}</svg>')
    refs = [
        ("Reliability in Azure Key Vault", "https://learn.microsoft.com/azure/reliability/reliability-key-vault"),
        ("Azure Key Vault availability and redundancy", "https://learn.microsoft.com/azure/key-vault/general/disaster-recovery-guidance"),
        ("Azure paired regions", "https://learn.microsoft.com/azure/reliability/regions-paired"),
        ("Managed HSM multi-region replication", "https://learn.microsoft.com/azure/key-vault/managed-hsm/multi-region-replication"),
        ("External key management", "https://learn.microsoft.com/azure/key-vault/managed-hsm/external-key-management-overview"),
        ("Supported HSMs for BYOK", "https://learn.microsoft.com/azure/key-vault/keys/hsm-protected-keys"),
        ("Services that support customer-managed keys", "https://learn.microsoft.com/azure/security/fundamentals/encryption-customer-managed-keys-support"),
        ("How to choose the right key management solution", "https://learn.microsoft.com/azure/security/fundamentals/key-management-choose"),
        ("Key Vault and Managed HSM SLAs", "https://www.microsoft.com/licensing/docs/view/Service-Level-Agreements-SLA-for-Online-Services"),
    ]
    items = "".join(f'<li><a href="{u}">{t}</a></li>' for t, u in refs)
    body = (head("Service guides · Key Vault · Decision tree", "Which Key Vault pattern fits?",
                 "Choose a candidate, not a universal support guarantee. Validate the scenario conditions on page 1 and the detailed online guidance.")
            + f'<div class="figure" id="figKVTree" data-export-width="940" style="margin-top:8px">{svg_tree}</div>'
            + '<div class="eyebrow mt8" style="color:var(--s600)">Reference links · Microsoft Learn</div>'
            + f'<ul style="list-style:none;columns:3;column-gap:18px;margin-top:4px;font-size:9.6px;line-height:1.45">{items}</ul>')
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
