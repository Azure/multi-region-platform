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


def main():
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0),
        functools.partial(QuietHandler, directory=str(ROOT / "docs")))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    url = f"http://127.0.0.1:{server.server_port}/region-planner.html#design"
    try:
        with sync_playwright() as playwright, tempfile.TemporaryDirectory() as artifacts:
            browser = playwright.chromium.launch()
            page = browser.new_page(viewport={"width": 1440, "height": 1100})
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.goto(url)
            page.wait_for_selector('#planner[data-ready="1"]')
            page.evaluate("""() => {
              MRP.core.replace(JSON.parse(JSON.stringify(MRP.EXAMPLE)));
              MRP.kit.hooks.render();
            }""")
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
            assert [r["id"] for r in inherited["regions"]] == ["westeurope", "swedencentral"]
            assert inherited["regions"][1]["pattern"] == "minimal-hub"
            assert inherited["regions"][1]["remote_hub"] == "westeurope"
            assert inherited["regions"][1]["capabilities"]["firewall"] == "local"
            assert inherited["regions"][1]["capabilities"]["dns"] == "local"
            circuit = inherited["hybrid_connections"][0]
            assert circuit["peering_location"] == "Frankfurt"
            assert set(circuit["connects_to"]) == {"westeurope", "swedencentral"}
            assert inherited["onprem"] == [{"id": "s3", "name": "Frankfurt"}]
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
            assert page.locator("#side-nav").is_visible()
            page.get_by_role("button", name="Show Advanced Networking Design Tool", exact=True).click()
            assert explorer.locator("#title").inner_text() == "Custom network print test"
            page.evaluate("MRP.kit.hooks.render()")
            assert explorer.locator("#title").inner_text() == "Custom network print test"
            page.get_by_role("tab", name="Review + export", exact=False).click()
            assert not page.locator("#pl-network").is_visible()
            assert not page.locator("body").evaluate("e => e.classList.contains('network-wide')")
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
              d.profile = 'Remote Hub Connected';
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
              d.profile='Disconnected Spokes'; MRP.kit.hooks.commit();
            }""")
            assert inherited_frame.evaluate("spec.regions[1].pattern") == "disconnected"
            assert inherited_frame.evaluate("spec.hybrid_connections.length") == 0
            inherited_page.evaluate("""() => {
              const C = MRP.core, d = C.design(C.reg('swedencentral'));
              d.profile='Full Regional Hub'; d.topology='Azure Virtual WAN';
              d.hybrid='Change'; d.hybridPath='SD-WAN or network virtual appliance in this region';
              d.hybridChange='Add SD-WAN'; MRP.kit.hooks.commit();
            }""")
            text = inherited_frame.locator("#plannerDefinitions").text_content()
            assert "mixed topologies are not modelled" in text
            assert "SD-WAN/NVA hybrid paths" in text
            assert inherited_frame.evaluate("spec.hybrid_connections.length") == 0
            inherited_page.evaluate("""() => {
              const C = MRP.core, d = C.design(C.reg('swedencentral'));
              C.S.estate.topology='Azure Virtual WAN';
              d.ss.gateway={p:'Local'}; d.hybrid='Reuse';
              d.hybridPath='Site-to-site VPN to a gateway in this region'; MRP.kit.hooks.commit();
            }""")
            assert inherited_frame.evaluate("spec.defaults.topology") == "vwan"
            assert inherited_frame.evaluate("spec.hybrid_connections.every(c => c.type === 'vpn')") is True
            assert inherited_frame.evaluate("spec.hybrid_connections.length") == 2
            inherited_page.evaluate("""() => {
              const C = MRP.core;
              C.S.current.push({id:'northeurope',hub:true});
              const r = C.newRegion('francecentral');
              r.outcome='Qualified'; r.selected=true; C.S.regions.push(r);
              const d = C.design(r); d.profile='Full Regional Hub'; d.topology='Azure Virtual WAN';
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
            assert set(er["connects_to"]) == {"francecentral", "northeurope"}
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


if __name__ == "__main__":
    main()
