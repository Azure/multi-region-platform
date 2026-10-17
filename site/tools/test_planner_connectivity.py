#!/usr/bin/env python3
"""Browser regressions for multiple hub connections and authoritative peering suggestions."""
import functools
import http.server
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


def check_peering_locations(page):
    page.get_by_role("tab", name="Latency", exact=False).click()
    page.evaluate("MRP.core.S.sites=[]; MRP.kit.hooks.commit()")
    catalog = page.evaluate("MRP.core.D.lat.peering.map(p => p.name)")
    assert len(catalog) > 50
    peer = page.get_by_role("combobox", name="Add a peering location", exact=True)
    options = page.get_by_role("listbox")
    peer.click()
    assert options.locator(".pl-pop-l").all_text_contents() == catalog
    assert options.get_by_text("Keep typing to narrow", exact=False).count() == 0
    # Scroll to and pick an entry beyond the old 50-option cutoff without searching.
    last = options.get_by_role("option").last
    last.scroll_into_view_if_needed()
    assert options.evaluate("e => e.scrollTop > 0")
    last.click()
    assert page.evaluate("MRP.core.S.sites.map(s => s.peering)") == [catalog[-1]]
    peer.click()
    assert options.locator(".pl-pop-l").all_text_contents() == catalog[:-1]
    # The full list also participates in keyboard navigation.
    peer.press("ArrowUp")
    assert options.locator(".pl-pop-o.on .pl-pop-l").inner_text() == catalog[-2]
    peer.press("Enter")
    assert page.evaluate("MRP.core.S.sites.map(s => s.peering)") == catalog[-2:][::-1]
    peer.click()
    peer.fill(catalog[60])
    assert options.get_by_text(catalog[60], exact=True).count() == 1
    peer.press("Escape")
    page.get_by_role("tab", name="Regional design", exact=False).click()


def main():
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0),
        functools.partial(QuietHandler, directory=str(ROOT / "docs")))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    url = f"http://127.0.0.1:{server.server_port}/region-planner.html#design"
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch()
            page = browser.new_page(viewport={"width": 1440, "height": 1000})
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.goto(url)
            page.wait_for_selector('#planner[data-ready="1"]')
            page.evaluate("""() => {
              const ex = JSON.parse(JSON.stringify(MRP.EXAMPLE));
              ex.current.push({id:'northeurope',hub:true});
              MRP.core.replace(ex); MRP.kit.hooks.render();
            }""")
            hubs = page.get_by_role("combobox", name="Hub Connections", exact=True)
            assert hubs.input_value() == "West Europe"
            hubs.click()
            options = page.get_by_role("listbox")
            assert options.get_attribute("aria-multiselectable") == "true"
            assert options.get_by_role("option", name="West Europe", exact=True).get_attribute("aria-selected") == "true"
            options.get_by_role("option", name="North Europe", exact=True).click()
            assert options.is_visible()
            assert options.get_by_role("option", name="North Europe", exact=True).get_attribute("aria-selected") == "true"
            assert page.evaluate("MRP.core.effective(MRP.core.reg('swedencentral')).hubConnections") == ["westeurope", "northeurope"]
            page.keyboard.press("Escape")
            assert hubs.input_value() == "West Europe, North Europe"
            assert page.evaluate("JSON.parse(localStorage.getItem('mrp-planner')).regions[0].design.hubConnections") == ["westeurope", "northeurope"]

            # Search and keyboard toggles keep independent selection state.
            hubs.click()
            hubs.fill("North")
            page.keyboard.press("Enter")
            assert options.get_by_role("option", name="North Europe", exact=True).get_attribute("aria-selected") == "false"
            page.keyboard.press("Escape")
            hubs.click()
            hubs.press("ArrowDown")
            hubs.press(" ")
            assert options.get_by_role("option", name="North Europe", exact=True).get_attribute("aria-selected") == "true"
            page.keyboard.press("Tab")
            assert options.is_hidden()
            assert hubs.input_value() == "West Europe, North Europe"

            # Reopening JSON and reloading preserve both hubs, as do review, text and Excel.
            page.evaluate("MRP.core.replace(JSON.parse(JSON.stringify(MRP.core.S))); MRP.kit.hooks.render()")
            page.reload()
            page.wait_for_selector('#planner[data-ready="1"]')
            assert hubs.input_value() == "West Europe, North Europe"
            assert "Hub Connections: West Europe and North Europe" in page.evaluate("MRP.core.recordText()")
            values = page.evaluate("""() => MRP.workbook().sheets.find(s => s.name === 'Regional design')
              .rows.map(row => row.map(c => c && c.v))""")
            assert any(row[0] == "Hub Connections" and "West Europe and North Europe" in row for row in values if row)
            page.get_by_role("tab", name="Review + export", exact=False).click()
            assert page.locator(".pl-kv").get_by_text("West Europe and North Europe", exact=True).count() == 1
            page.get_by_role("tab", name="Regional design", exact=False).click()
            page.locator("#pl-network-toggle").click()
            page.wait_for_function("document.querySelector('#pl-network-notice').hidden")
            frame = page.locator("#pl-network iframe").element_handle().content_frame()
            links = frame.evaluate("spec.region_links")
            assert {"from": "swedencentral", "to": "westeurope"} in links
            assert {"from": "swedencentral", "to": "northeurope"} in links
            assert "Hub Connections: West Europe and North Europe" in frame.locator("#plannerDefinitions").text_content()

            # Clearing all selections must not silently bring the default back.
            hubs.click()
            options.get_by_role("option", name="West Europe", exact=True).click()
            options.get_by_role("option", name="North Europe", exact=True).click()
            hubs.press("Escape")
            assert hubs.input_value() == ""
            page.evaluate("MRP.core.replace(JSON.parse(JSON.stringify(MRP.core.S))); MRP.kit.hooks.render()")
            assert page.evaluate("MRP.core.effective(MRP.core.reg('swedencentral')).hubConnections") == []
            # Legacy hub values, including the default example, still load.
            page.evaluate("""() => {
              const C = MRP.core, r = C.reg('swedencentral'), d = C.design(r);
              delete d.hubConnections; d.hub='northeurope';
              C.replace(JSON.parse(JSON.stringify(C.S))); MRP.kit.hooks.render();
            }""")
            assert hubs.input_value() == "North Europe"

            check_peering_locations(page)

            # Latency cities (including arbitrary customer names) never supply circuit options.
            page.evaluate("""() => {
              MRP.core.S.sites = [
                {id:'customer',kind:'city',city:{n:'Customer Chicago DC',lat:41.88,lon:-87.63},peering:'Chicago',edits:{}},
                {id:'unknown',kind:'peering',peering:'Not an Azure peering location',edits:{}}
              ];
              MRP.kit.hooks.commit();
            }""")
            connectivity = page.get_by_role("combobox", name="Existing connectivity", exact=True)
            connectivity.click()
            assert options.get_attribute("aria-multiselectable") is None
            connectivity.fill("Customer Chicago DC")
            assert page.locator(".pl-pop-o").count() == 0
            connectivity.fill("Not an Azure peering location")
            assert page.locator(".pl-pop-o").count() == 0
            # Chicago is itself a valid Azure metro; it appears only from the catalog.
            connectivity.fill("Chicago")
            assert options.get_by_role("option").filter(has=page.get_by_text("ExpressRoute circuit in Chicago", exact=True)).count() == 1
            connectivity.fill("Frankfurt")
            options.get_by_role("option").filter(has=page.get_by_text("ExpressRoute circuit in Frankfurt", exact=True)).click()
            assert connectivity.input_value() == "ExpressRoute circuit in Frankfurt"
            page.evaluate("MRP.core.S.sites=[]; MRP.kit.hooks.commit()")
            connectivity.click()
            connectivity.fill("Frankfurt")
            assert options.get_by_role("option").filter(has=page.get_by_text("ExpressRoute circuit in Frankfurt", exact=True)).count() == 1
            page.keyboard.press("Escape")
            connectivity.fill("Site-to-site VPN to customer datacenter")
            connectivity.press("Tab")
            assert page.evaluate("MRP.core.design(MRP.core.reg('swedencentral')).hybridUse") == "Site-to-site VPN to customer datacenter"
            page.evaluate("MRP.core.D.lat=null; MRP.kit.hooks.commit()")
            assert page.get_by_text("The Azure peering-location catalog is unavailable", exact=False).is_visible()
            connectivity.click()
            assert options.is_hidden()
            assert connectivity.input_value() == "Site-to-site VPN to customer datacenter"

            for theme in ("light", "dark"):
                page.evaluate("theme => document.documentElement.dataset.theme=theme", theme)
                for width in (390, 1440):
                    page.set_viewport_size({"width": width, "height": 1000})
                    hubs.click()
                    assert options.is_visible()
                    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
                    box = options.bounding_box()
                    assert box["x"] >= 0 and box["x"] + box["width"] <= width
                    hubs.press("Escape")
            assert not errors, errors
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
    print("Hub multi-select, persistence, legacy plans, review/export, diagram, full Latency peering list and Azure peering suggestions passed.")


if __name__ == "__main__":
    main()
