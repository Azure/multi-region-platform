#!/usr/bin/env python3
"""Browser regression checks for the embedded networking designer and printed diagram."""
import functools
import http.server
import tempfile
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


def check_current_profile_and_circuit_inheritance(browser, url):
    page = browser.new_page(viewport={"width": 1440, "height": 1100})
    page.goto(url)
    page.wait_for_selector('#planner[data-ready="1"]')
    page.evaluate("""() => {
      const input = JSON.parse(JSON.stringify(MRP.EXAMPLE));
      input.current = [
        {id:'westeurope',profile:'Full platform',circuit:'Amsterdam'},
        {id:'northeurope',profile:'Full platform',circuit:'Dublin2'}
      ];
      input.sites = [
        {id:'rotterdam',kind:'city',city:{n:'Rotterdam',lat:51.92,lon:4.48},peering:'',edits:{}},
        {id:'cork',kind:'city',city:{n:'Cork',lat:51.90,lon:-8.47},peering:'',edits:{}},
        {id:'amsterdam',kind:'peering',peering:'Amsterdam',edits:{}},
        {id:'dublin2',kind:'peering',peering:'Dublin2',edits:{}}
      ];
      input.regions[0].design.hybridUse = 'ExpressRoute circuit in Amsterdam';
      MRP.core.replace(input); MRP.kit.hooks.render();
    }""")
    page.locator("#pl-network-toggle").click()
    page.wait_for_function("document.querySelector('#pl-network-notice').hidden")
    frame = page.locator("#pl-network iframe").element_handle().content_frame()
    for topology in ("Hub-and-spoke virtual networks", "Azure Virtual WAN"):
        page.evaluate("""topology => {
          MRP.core.S.estate.topology = topology;
          MRP.kit.hooks.commit();
        }""", topology)
        for region in ("westeurope", "northeurope"):
            resolved = frame.evaluate("""id => {
              const region = regionById(spec, id);
              return Object.fromEntries(['firewall','dns','er_gateway'].map(role =>
                [role, resolveRole(spec, region, role)]));
            }""", region)
            assert resolved["firewall"] == {"owner": region, "product": "azure-firewall"}, resolved
            assert resolved["dns"] == {"owner": region, "product": "private-resolver"}, resolved
            assert resolved["er_gateway"] == {"owner": region, "product": "expressroute"}, resolved
        connections = frame.evaluate("spec.hybrid_connections")
        amsterdam = [c for c in connections if c.get("peering_location") == "Amsterdam"]
        dublin = [c for c in connections if c.get("peering_location") == "Dublin2"]
        assert amsterdam and dublin, connections
        assert all("northeurope" not in c["connects_to"] for c in amsterdam)
        assert all(c["connects_to"] == ["northeurope"] for c in dublin)
        assert frame.locator("#diagram").get_by_text("Dublin2", exact=True).count() == 1
        onprem = frame.evaluate("spec.onprem")
        assert {"rotterdam", "cork"} <= {s["id"] for s in onprem}
        assert not any(s["name"] in ("Amsterdam", "Dublin2") for s in onprem), onprem
        assert page.evaluate("MRP.network.preparePrint()")
        assert "Dublin2" in page.locator("#pl-network-print").text_content()
    # Existing infrastructure must not depend on a new region consuming its services.
    page.evaluate("MRP.core.S.regions.forEach(r => r.selected=false); MRP.kit.hooks.commit()")
    assert frame.evaluate("spec.regions.map(r => r.id)") == ["westeurope", "northeurope"]
    assert {c["peering_location"] for c in frame.evaluate("spec.hybrid_connections")} == {"Amsterdam", "Dublin2"}
    page.get_by_role("tab", name="Scope", exact=False).click()
    primary = page.get_by_role("combobox", name="Primary ExpressRoute circuit of North Europe", exact=True)
    primary.select_option("Amsterdam")
    connections = frame.evaluate("spec.hybrid_connections")
    assert {c["peering_location"] for c in connections} == {"Amsterdam"}
    assert all(set(c["connects_to"]) == {"westeurope", "northeurope"} for c in connections)
    primary.select_option("")
    assert frame.evaluate("resolveRole(spec,regionById(spec,'northeurope'),'er_gateway')") is None
    assert frame.evaluate("resolveRole(spec,regionById(spec,'northeurope'),'firewall').owner") == "northeurope"
    page.evaluate("""() => {
      const C = MRP.core, r = C.reg('swedencentral'), d = C.design(r);
      C.S.current[0].circuit = 'Dublin2';
      r.selected = true;
      d.profile = 'Remote platform';
      d.ss.gateway = {p:'Remote', from:'westeurope'};
      d.hybridPath = MRP.HYBRID_PATHS[0].id;
      C.S.sites.find(s => s.id === 'rotterdam').peering = 'Amsterdam';
      MRP.kit.hooks.commit();
    }""")
    assert frame.evaluate("circuitsAt(spec,'westeurope')[0].peering_location") == "Dublin2"
    page.close()


def main():
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0),
        functools.partial(QuietHandler, directory=str(ROOT / "docs")))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    url = f"http://127.0.0.1:{server.server_port}/region-planner.html#design"
    try:
        with sync_playwright() as playwright, tempfile.TemporaryDirectory() as artifacts:
            browser = playwright.chromium.launch()
            check_remote_spoke_peerings(browser, url)
            check_scope_peering_options(browser, url)
            check_current_profile_and_circuit_inheritance(browser, url)
            page = browser.new_page(viewport={"width": 1440, "height": 1100})
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.goto(url)
            page.wait_for_selector('#planner[data-ready="1"]')
            page.evaluate("""() => {
              MRP.core.replace(JSON.parse(JSON.stringify(MRP.EXAMPLE)));
              MRP.kit.hooks.render();
            }""")
            # On Regional design the map waits behind a button; it is the same map as on the Latency tab.
            assert page.locator("#pl-latency-map").count() == 0
            page.get_by_role("button", name="Show the map", exact=True).click()
            page.wait_for_selector(".pl-map-land")
            assert page.locator("#pl-network iframe").count() == 0
            assert page.evaluate("""() => document.querySelector('#pl-latency-map')
              .compareDocumentPosition(document.querySelector('#pl-network')) & Node.DOCUMENT_POSITION_FOLLOWING""")
            assert page.evaluate("MRP.network.preparePrint()")
            assert page.locator("#pl-network-print svg").count() == 0
            page.emulate_media(media="print")
            assert not page.locator("#pl-network").is_visible()
            page.emulate_media(media="screen")
            toggle = page.get_by_role("button", name="Enable Advanced Networking Design Tool", exact=True)
            toggle.focus()
            page.keyboard.press("Enter")
            explorer = page.frame_locator("#pl-network iframe")
            explorer.locator("#diagram .region").first.wait_for()
            page.wait_for_function("document.querySelector('#pl-network-notice').hidden")
            assert page.locator('#pl-network-toggle').get_attribute("aria-expanded") == "true"
            frame = page.locator("#pl-network iframe").element_handle().content_frame()
            inherited = frame.evaluate("spec")
            assert frame.evaluate("Object.fromEntries(Object.entries(RULES.patterns).map(([id,p]) => [id,p.label]))") == {
                "full-hub": "Full platform", "minimal-hub": "Minimal platform",
                "remote-hub": "Remote platform", "disconnected": "Governance-Only",
            }
            assert "Minimal platform" in explorer.locator("#diagram").text_content()
            assert "New region - Minimal platform" in explorer.locator("#plannerDefinitions").text_content()
            assert [r["id"] for r in inherited["regions"]] == ["westeurope", "swedencentral"]
            assert inherited["regions"][1]["pattern"] == "minimal-hub"
            assert inherited["regions"][1]["remote_hub"] == "westeurope"
            assert inherited["regions"][1]["capabilities"]["firewall"] == "local"
            assert inherited["regions"][1]["capabilities"]["dns"] == "local"
            circuit = inherited["hybrid_connections"][0]
            assert circuit["peering_location"] == "Frankfurt"
            assert set(circuit["connects_to"]) == {"westeurope", "swedencentral"}
            assert inherited["onprem"] == [
                {"id": "s1", "name": "Stockholm"},
                {"id": "s2", "name": "Oslo"},
                {"id": "circuit-Frankfurt", "name": "Site not specified"},
            ]
            explorer.locator("#btnWorkbook").click()
            assert explorer.locator("#plannerDefinitions").is_visible()
            assert "Backup vaults: Local" in explorer.locator("#plannerDefinitions").text_content()
            assert "Domain controllers: Remote from West Europe" in " ".join(
                explorer.locator("#plannerDefinitions li").all_text_contents())
            explorer.locator("#btnWorkbook").click()
            assert explorer.locator("#plannerDefinitions").is_hidden()
            assert page.locator("body").evaluate("e => e.classList.contains('network-wide')")
            assert not page.locator("#side-nav").is_visible()
            page.get_by_role("button", name="Table of contents", exact=True).click()
            assert page.locator("#side-nav").is_visible()
            page.locator(".nav-backdrop").click(position={"x": 400, "y": 20})
            assert not page.locator("#side-nav").is_visible()
            assert not explorer.locator("#btnTheme").is_visible()
            explorer.get_by_role("button", name="Editor", exact=True).click()
            assert explorer.locator("#editor").is_visible()
            explorer.locator("#etab-regions").click()
            assert explorer.locator('select[data-path="regions.1.remote_hub"]').evaluate(
                "e => e.labels[0].firstChild.textContent") == "Full-Platform region"
            assert not explorer.locator("aside").is_visible()
            assert explorer.locator(".canvas").bounding_box()["width"] >= 700
            explorer.get_by_role("button", name="Details", exact=True).click()
            assert not explorer.locator("#editor").is_visible()
            assert explorer.locator("aside").is_visible()
            assert explorer.locator(".canvas").bounding_box()["width"] >= 700
            explorer.get_by_role("button", name="Editor", exact=True).click()
            page.locator("#pl-network-full").click()
            assert page.locator("html").evaluate("e => e.classList.contains('network-full')")
            full_box = page.locator("#pl-network iframe").bounding_box()
            assert full_box["y"] < 80 and full_box["width"] >= 1400 and full_box["height"] >= 1000, full_box
            assert page.evaluate("""() => { const r = document.querySelector('#pl-network iframe').getBoundingClientRect();
              return document.elementFromPoint(r.x + r.width / 2, r.y + 10).tagName === 'IFRAME'; }""")
            assert explorer.locator(".canvas").bounding_box()["width"] >= 1000
            assert page.locator("#pl-network-full").inner_text() == "Exit full page"
            page.keyboard.press("Escape")
            assert not page.locator("html").evaluate("e => e.classList.contains('network-full')")
            assert page.locator("#pl-network-full").inner_text() == "Expand to full page"
            page.locator("#pl-network-full").click()
            page.locator("#pl-network-full").click()
            assert page.locator("#pl-network iframe").bounding_box()["height"] < 950
            page.evaluate("document.documentElement.dataset.theme='dark'")
            page.wait_for_function("""() => document.querySelector('#pl-network iframe')
              .contentDocument.documentElement.dataset.theme === 'dark'""")
            frame.evaluate("choose(0, 'egress'); zoom(0.5)")
            with page.expect_popup() as opened:
                explorer.get_by_role("button", name="Present", exact=True).click()
            presentation = opened.value
            presentation.wait_for_selector("body.present")
            assert presentation.locator("#editor").is_hidden()
            assert presentation.locator("aside").is_hidden()
            assert not presentation.locator("#btnTheme").is_visible()
            assert presentation.evaluate("ui.type") == "egress"
            assert presentation.evaluate("session.timer") is None
            assert not frame.evaluate("document.body.classList.contains('present')")
            frame.evaluate("spec.title = 'Live presentation update'; onSpecChange(true)")
            presentation.wait_for_function("spec.title === 'Live presentation update'")
            frame.evaluate("setLayer('dns', false)")
            presentation.wait_for_selector("#diagram.no-dns")
            frame.evaluate("setLayer('dns', true)")
            presentation.wait_for_selector("#diagram:not(.no-dns)")
            page.evaluate("document.documentElement.dataset.theme='light'")
            presentation.wait_for_function("document.documentElement.dataset.theme === 'light'")
            frame.evaluate("() => { window.nativeOpen = window.open; window.open = () => null; }")
            presentation.close()
            explorer.get_by_role("button", name="Present", exact=True).click()
            explorer.get_by_text("Presentation was blocked by your browser.", exact=False).wait_for()
            frame.evaluate("() => { window.open = window.nativeOpen; }")
            with page.expect_popup() as reopened:
                explorer.locator("#diagram").focus()
                explorer.locator("body").press("f")
            reopened.value.wait_for_selector("body.present")
            with reopened.value.expect_event("close"):
                reopened.value.evaluate("""() => {
                  setTimeout(() => document.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape'})), 50);
                }""")
            frame.evaluate("""() => {
              spec.title = 'Custom network print test';
              onSpecChange(true); setTheme('dark'); zoom(0.5);
            }""")
            original_view = explorer.locator("#diagram").get_attribute("viewBox")
            assert page.evaluate("MRP.network.preparePrint()")
            expected_view = frame.evaluate("`0 0 ${layout.width} ${layout.height}`")
            assert page.locator("#pl-network-print svg").get_attribute("viewBox") == expected_view
            assert original_view != expected_view
            assert "Custom network print test" in page.locator("#pl-network-print > h2").inner_text()
            assert explorer.locator("html").get_attribute("data-theme") == "dark"
            assert page.locator("#pl-network-print .rname").first.evaluate(
                "e => e.style.fill") == "rgb(36, 36, 36)"
            assert page.locator("#pl-network-print [id]").evaluate_all(
                "es => es.every(e => e.id.startsWith('pl-network-'))")
            assert page.locator("#pl-network-print .region").count() == explorer.locator("#diagram .region").count()

            page.get_by_role("button", name="Hide Advanced Networking Design Tool", exact=True).click()
            assert not page.locator("#pl-network-body").is_visible()
            assert not page.locator("body").evaluate("e => e.classList.contains('network-wide')")
            assert not page.locator("#side-nav").is_visible()
            page.get_by_role("button", name="Show Advanced Networking Design Tool", exact=True).click()
            assert explorer.locator("#title").inner_text() == "Custom network print test"
            page.evaluate("MRP.kit.hooks.render()")
            assert explorer.locator("#title").inner_text() == "Custom network print test"
            page.get_by_role("tab", name="Review + export", exact=False).click()
            assert not page.locator("#pl-network").is_visible()
            assert not page.locator("body").evaluate("e => e.classList.contains('network-wide')")
            assert not page.locator("#side-nav").is_visible()
            frame.evaluate("spec.title = 'Latest design on review'; onSpecChange(true)")
            page.evaluate("""() => {
              window.print = () => { window.printCalled = true;
                window.dispatchEvent(new Event('beforeprint')); };
            }""")
            page.get_by_role("button", name="Print", exact=True).click()
            assert page.evaluate("window.printCalled")
            assert "Latest design on review" in page.locator("#pl-network-print > h2").text_content()
            page.emulate_media(media="print")
            assert page.locator("#pl-network-print svg").is_visible()
            assert not page.locator("#pl-network iframe").is_visible()
            page.pdf(path=str(Path(artifacts) / "network-design.pdf"), format="A4", print_background=True)
            assert (Path(artifacts) / "network-design.pdf").stat().st_size > 10000
            page.emulate_media(media="screen")
            page.get_by_role("tab", name="Regional design", exact=False).click()
            assert explorer.locator("#title").inner_text() == "Latest design on review"
            for width in (375, 768, 1440):
                page.set_viewport_size({"width": width, "height": 1100})
                assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), width
                explorer.get_by_role("button", name="Details", exact=True).click()
                explorer.get_by_role("button", name="Editor", exact=True).click()
                canvas_width = explorer.locator(".canvas").bounding_box()["width"]
                frame_width = page.locator("#pl-network iframe").bounding_box()["width"]
                assert canvas_width >= (frame_width - 40 if width <= 768 else 700), (width, canvas_width)
                if width == 375:
                    assert explorer.locator(".canvas").bounding_box()["height"] >= 450
                page.locator("#pl-network").screenshot(path=str(Path(artifacts) / f"network-{width}.png"))
            assert not errors, errors

            # Workbook edits, replacement and empty state must replace stale inherited definitions.
            inherited_page = browser.new_page(viewport={"width": 1440, "height": 1100})
            inherited_page.on("pageerror", lambda error: errors.append(str(error)))
            inherited_page.goto(url)
            inherited_page.wait_for_selector('#planner[data-ready="1"]')
            inherited_page.evaluate("""() => {
              localStorage.setItem('geolz-explorer.spec.v1', 'standalone sentinel');
              MRP.core.replace(JSON.parse(JSON.stringify(MRP.EXAMPLE))); MRP.kit.hooks.render();
            }""")
            inherited_page.locator("#pl-network-toggle").click()
            inherited_page.wait_for_function("document.querySelector('#pl-network-notice').hidden")
            inherited_frame = inherited_page.locator("#pl-network iframe").element_handle().content_frame()
            assert inherited_frame.evaluate("spec.regions.length") == 2
            assert inherited_page.evaluate("localStorage.getItem('geolz-explorer.spec.v1')") == "standalone sentinel"
            inherited_page.evaluate("""() => {
              const C = MRP.core, r = C.reg('swedencentral'), d = C.design(r);
              d.profile = 'Remote platform';
              d.ss.dnsres = {p:'Remote', from:'westeurope'};
              d.ss.inspect = {p:'Remote', from:'westeurope'};
              d.ss.gateway = {p:'Remote', from:'westeurope'};
              d.hybridPath = MRP.HYBRID_PATHS[0].id;
              d.custom.push({id:'custom1',name:'Internal registry',p:'Local',note:'Regional images'});
              MRP.kit.hooks.commit();
            }""")
            state = inherited_frame.evaluate("spec")
            assert state["regions"][1]["pattern"] == "remote-hub"
            assert state["hybrid_connections"][0]["connects_to"] == ["westeurope"]
            assert inherited_frame.evaluate("resolveRole(spec,spec.regions[1],'dns').owner") == "westeurope"
            assert "Internal registry: Local - Regional images" in " ".join(
                inherited_frame.locator("#plannerDefinitions li").all_text_contents())
            assert inherited_page.evaluate("MRP.network.preparePrint()")
            assert "Internal registry" in inherited_page.locator("#pl-network-print").text_content()

            with inherited_page.expect_popup() as inherited_popup:
                inherited_frame.locator("#btnPresent").click()
            live = inherited_popup.value
            live.wait_for_selector("body.present")
            inherited_page.get_by_role("tab", name="Scope", exact=False).click()
            inherited_page.locator('[data-k="meta/name"]').fill("Workbook live inheritance")
            live.wait_for_function("spec.title === 'Workbook live inheritance'")
            assert inherited_frame.evaluate("spec.title") == "Workbook live inheritance"
            live.close()
            inherited_page.get_by_role("tab", name="Regional design", exact=False).click()
            inherited_frame.evaluate("spec.title='Temporary refinement'; onSpecChange(true)")
            inherited_page.evaluate("MRP.kit.hooks.render()")
            assert inherited_frame.evaluate("spec.title") == "Temporary refinement"
            inherited_frame.locator("#btnClearSaved").click()
            assert inherited_frame.evaluate("spec.title") == "Workbook live inheritance"
            assert inherited_page.evaluate("localStorage.getItem('geolz-explorer.spec.v1')") == "standalone sentinel"

            inherited_page.evaluate("""() => {
              const C = MRP.core, d = C.design(C.reg('swedencentral'));
              d.profile='Governance-Only'; MRP.kit.hooks.commit();
            }""")
            assert inherited_frame.evaluate("spec.regions[1].pattern") == "disconnected"
            assert inherited_frame.evaluate("spec.hybrid_connections.map(c => c.connects_to)") == [["westeurope"]]
            inherited_page.evaluate("""() => {
              const C = MRP.core, d = C.design(C.reg('swedencentral'));
              d.profile='Full platform'; d.topology='Azure Virtual WAN';
              d.hybrid='Change'; d.hybridPath='SD-WAN or network virtual appliance in this region';
              d.hybridChange='Add SD-WAN'; MRP.kit.hooks.commit();
            }""")
            text = inherited_frame.locator("#plannerDefinitions").text_content()
            assert "mixed topologies are not modelled" in text
            assert "SD-WAN/NVA hybrid paths" in text
            assert inherited_frame.evaluate("spec.hybrid_connections.map(c => c.connects_to)") == [["westeurope"]]
            inherited_page.evaluate("""() => {
              const C = MRP.core, d = C.design(C.reg('swedencentral'));
              C.S.estate.topology='Azure Virtual WAN';
              d.ss.gateway={p:'Local'}; d.hybrid='Reuse';
              d.hybridPath='Site-to-site VPN to a gateway in this region'; MRP.kit.hooks.commit();
            }""")
            assert inherited_frame.evaluate("spec.defaults.topology") == "vwan"
            assert inherited_frame.evaluate(
                "spec.hybrid_connections.filter(c => c.type === 'vpn').map(c => c.site)") == ["s1", "s2"]
            assert inherited_frame.evaluate("spec.hybrid_connections.length") == 3
            inherited_page.evaluate("""() => {
              const C = MRP.core;
              C.S.current.push({id:'northeurope',hub:true,circuit:'Frankfurt'});
              const r = C.newRegion('francecentral');
              r.outcome='Qualified'; r.selected=true; C.S.regions.push(r);
              const d = C.design(r); d.profile='Full platform'; d.topology='Azure Virtual WAN';
              d.hub='northeurope'; d.hybrid='Reuse';
              d.hybridUse='ExpressRoute circuit in Frankfurt';
              d.hybridPath='New virtual hub in this region, connected to the existing circuits (Virtual WAN)';
              MRP.kit.hooks.commit();
            }""")
            multi = inherited_frame.evaluate("spec")
            assert {r["id"] for r in multi["regions"]} == {
                "westeurope", "northeurope", "swedencentral", "francecentral"}
            assert next(r for r in multi["regions"] if r["id"] == "francecentral")["pattern"] == "full-hub"
            er = next(c for c in multi["hybrid_connections"] if c["type"] == "expressroute")
            assert set(er["connects_to"]) == {"westeurope", "francecentral", "northeurope"}
            inherited_page.evaluate("""() => {
              const C = MRP.core, input = JSON.parse(JSON.stringify(MRP.EXAMPLE));
              input.current = [
                {id:'westeurope',profile:'Full platform',circuit:'Frankfurt'},
                {id:'northeurope',profile:'Minimal platform',circuit:'Dublin'},
                {id:'francecentral',profile:'Remote platform'},
                {id:'uksouth',profile:'Governance-Only'}
              ];
              input.sites.push({id:'dublin',kind:'peering',peering:'Dublin',edits:{}});
              input.regions[0].design.hubConnections = ['westeurope','northeurope'];
              input.regions[0].design.hybridUse = '';
              C.replace(input); MRP.kit.hooks.commit();
            }""")
            profiles = inherited_frame.evaluate("Object.fromEntries(spec.regions.map(r => [r.id,r.pattern]))")
            assert {key: profiles[key] for key in ["westeurope", "northeurope", "francecentral", "uksouth"]} == {
                "westeurope": "full-hub", "northeurope": "minimal-hub",
                "francecentral": "remote-hub", "uksouth": "disconnected"}
            inherited_page.evaluate("""() => {
              MRP.core.S.current.find(c => c.id === 'northeurope').profile = 'Full platform';
              MRP.kit.hooks.commit();
            }""")
            assert inherited_frame.evaluate("spec.hybrid_connections[0].peering_location") == "Frankfurt"
            assert inherited_frame.evaluate("spec.hybrid_connections[0].connects_to.sort()") == ["swedencentral", "westeurope"]
            inherited_page.evaluate("MRP.core.replace({v:2}); MRP.kit.hooks.render()")
            assert inherited_frame.evaluate("spec.regions.length") == 0
            assert inherited_frame.evaluate("spec.hybrid_connections.length") == 0
            assert inherited_page.evaluate("MRP.network.preparePrint()")
            assert not errors, errors
            inherited_page.close()

            # A failed tool load must not silently produce a report missing the design.
            failed = browser.new_page()
            failed.route("**/tools/geolz-explorer/index.html?embed=planner",
                lambda route: route.fulfill(status=503, body="Tool unavailable"))
            failed.goto(url)
            failed.wait_for_selector('#planner[data-ready="1"]')
            failed.get_by_role("button", name="Enable Advanced Networking Design Tool", exact=True).click()
            failed.get_by_text("The networking design tool could not be loaded.", exact=False).wait_for()
            assert not failed.evaluate("MRP.network.preparePrint()")
            failed.evaluate("MRP.ui.tab='review'; MRP.kit.hooks.render()")
            failed.emulate_media(media="print")
            assert failed.locator("#pl-network-notice").is_visible()
            assert not failed.locator("#pl-network-print").is_visible()
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
    print("Networking designer: navigation collapse, diagram width, exclusive side panels, host theme, live popup, blocked popup, state retention, full diagram print, responsive layout and failures passed.")


def check_remote_spoke_peerings(browser, url):
    page = browser.new_page(viewport={"width": 1440, "height": 1100})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(url)
    page.wait_for_selector('#planner[data-ready="1"]')
    page.evaluate("""() => {
      const input = JSON.parse(JSON.stringify(MRP.EXAMPLE));
      input.current.push({id:'northeurope',profile:'Full platform',circuit:'Frankfurt'});
      const remote = JSON.parse(JSON.stringify(input.regions[0]));
      remote.id = 'italynorth';
      remote.design.profile = 'Remote platform';
      remote.design.ss = Object.fromEntries(['inspect','dnsres','gateway'].map(id =>
        [id,{p:'Remote',from:'westeurope'}]));
      input.regions.push(remote);
      const isolated = JSON.parse(JSON.stringify(remote));
      isolated.id = 'uksouth'; isolated.design.profile = 'Governance-Only';
      input.regions.push(isolated);
      MRP.core.replace(input); MRP.kit.hooks.render();
    }""")
    page.locator("#pl-network-toggle").click()
    page.wait_for_function("document.querySelector('#pl-network-notice').hidden")
    frame = page.locator("#pl-network iframe").element_handle().content_frame()
    frame.locator("#btnEditor").click()
    frame.locator("#etab-links").click()
    hub = frame.get_by_role("checkbox", name="Global VNet peering: Italy North spokes to North Europe hub", exact=True)
    assert hub.count() == 1, "Remote spokes need an independent peering control for another region's hub"
    assert frame.get_by_role("checkbox", name="Global VNet peering: Italy North spokes to UK South spokes", exact=True).is_disabled()
    hub.check()
    path = frame.evaluate("crossRegionPath(spec,regionById(spec,'italynorth'),regionById(spec,'northeurope'))")
    assert not path["na"] and "northeurope.firewall" in [s["id"] for s in path["steps"]]
    assert "westeurope.firewall" not in [s["id"] for s in path["steps"]]
    spoke = frame.get_by_role("checkbox", name="Global VNet peering: Italy North spokes to Sweden Central spokes", exact=True)
    spoke.check()
    path = frame.evaluate("crossRegionPath(spec,regionById(spec,'italynorth'),regionById(spec,'swedencentral'))")
    assert [s["id"] for s in path["steps"] if s["id"]] == ["italynorth.spoke", "swedencentral.spoke"]
    assert path["matrix"] == "Direct peering (uninspected)"
    assert frame.evaluate("regionById(spec,'italynorth').remote_hub") == "westeurope"
    assert frame.locator('#diagram path.lnk[data-layer="peering"]').count() == 2
    frame.locator('[data-act="undo"]').click()
    assert not spoke.is_checked()
    frame.locator('[data-act="redo"]').click()
    assert spoke.is_checked()
    frame.evaluate("loadSpec(JSON.parse(JSON.stringify(spec)))")
    assert spoke.is_checked(), "Saving/reopening must retain explicit spoke peerings"
    assert page.evaluate("MRP.network.preparePrint()")
    assert page.locator('#pl-network-print path.lnk[data-layer="peering"]').count() == 2
    parent_spokes = frame.get_by_role("checkbox", name="Global VNet peering: Italy North spokes to West Europe spokes", exact=True)
    parent_spokes.check()
    frame.evaluate("choose(spec.regions.findIndex(r=>r.id==='italynorth'),'east_west','westeurope')")
    assert frame.locator('#diagram path.used[data-peer="spoke-peering:italynorth:westeurope"]').count() == 1
    parent_spokes.uncheck()
    frame.evaluate("""() => {
      const i=spec.regions.findIndex(r=>r.id==='italynorth'), previous=spec.regions[i].remote_hub;
      spec.regions[i].remote_hub='northeurope'; remoteHubChange(i,previous); onSpecChange(true);
    }""")
    assert frame.evaluate("backboneConnections(spec).filter(c=>c.from==='italynorth'&&c.to==='northeurope').length") == 1
    frame.locator("#etab-estate").click()
    frame.locator('select[data-path="defaults.topology"]').select_option("vwan")
    frame.locator("#etab-links").click()
    assert hub.is_disabled(), "A managed virtual hub cannot accept global VNet peering"
    assert frame.get_by_role("checkbox", name="Global VNet peering: Italy North spokes to West Europe hub", exact=True).is_disabled()
    assert spoke.is_checked()
    frame.evaluate("setPath(spec,'regions.3.pattern','full-hub'); dropLinks(spec,spec.regions[3]); onSpecChange(true)")
    assert frame.evaluate("spec.region_links.filter(l => ['spoke-hub','spoke-peering'].includes(l.kind))") == []
    assert not errors, errors
    page.close()


def check_scope_peering_options(browser, url):
    page = browser.new_page(viewport={"width": 1440, "height": 1100})
    page.goto(url)
    page.wait_for_selector('#planner[data-ready="1"]')
    page.evaluate("""() => {
      const input = JSON.parse(JSON.stringify(MRP.EXAMPLE));
      input.current[0].circuit = 'Amsterdam Metro';
      input.sites = input.sites.filter(s => s.kind === 'city').concat(
        ['Amsterdam','Amsterdam Metro','Dublin2'].map(peering => ({id:peering,kind:'peering',peering,edits:{}})));
      input.regions[0].design.hybridUse = 'ExpressRoute circuit in Amsterdam Metro';
      MRP.core.replace(input); MRP.kit.hooks.render();
    }""")
    page.locator("#pl-network-toggle").click()
    page.wait_for_function("document.querySelector('#pl-network-notice').hidden")
    frame = page.locator("#pl-network iframe").element_handle().content_frame()
    frame.evaluate("selectItem('conn:'+spec.hybrid_connections[0].id)")
    selected = frame.locator("#selPanel")
    location = selected.locator('select[data-path$=".peering_location"]')
    resiliency = selected.locator("select[data-resiliency]")
    locations = location.locator("option").all_text_contents()
    assert locations == ["Amsterdam Metro"], locations
    resiliency.select_option("standard")
    assert location.locator("option").all_text_contents() == ["Amsterdam", "Dublin2"]
    location.select_option("Dublin2")
    resiliency.select_option("metro")
    assert location.input_value() == "Amsterdam Metro"
    assert frame.evaluate("spec.hybrid_connections.every(c => c.peering_location === 'Amsterdam Metro')")
    with page.expect_popup() as popup:
        frame.locator("#btnPresent").click()
    presentation = popup.value
    presentation.wait_for_selector("body.present")
    assert presentation.evaluate("peeringGroups('metro').flatMap(([,locations])=>locations)") == ["Amsterdam Metro"]
    presentation.close()
    page.evaluate("""() => {
      MRP.core.S.sites = MRP.core.S.sites.filter(s => s.kind === 'city' || s.peering === 'Amsterdam Metro');
      MRP.kit.hooks.commit();
    }""")
    frame.evaluate("selectItem('conn:'+spec.hybrid_connections[0].id)")
    assert resiliency.locator('option[value="standard"]').get_attribute("disabled") is not None
    frame.locator("#etab-hybrid").click()
    frame.locator("#selPanel [data-act='sel-clear']").click()
    frame.locator("select[data-addconn]").first.select_option("new:expressroute")
    assert location.input_value() == "Amsterdam Metro"
    page.evaluate("MRP.core.S.sites=MRP.core.S.sites.filter(s => s.kind==='city'); MRP.kit.hooks.commit()")
    assert frame.locator('select[data-addconn] option[value="new:expressroute"]').count() == 0
    page.close()
    standalone = browser.new_page()
    standalone.goto(url.split("/region-planner.html")[0] + "/tools/geolz-explorer/index.html")
    standalone.wait_for_selector("#diagram .region")
    assert standalone.evaluate("peeringGroups().flatMap(([,locations])=>locations).length") > 50
    standalone.close()


if __name__ == "__main__":
    main()
