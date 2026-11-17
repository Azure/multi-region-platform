#!/usr/bin/env python3
"""Browser regressions for hub connections and user-added peering circuit choices."""
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
    page.get_by_role("tab", name="Scope", exact=False).click()
    page.evaluate("MRP.core.S.sites=[]; MRP.kit.hooks.commit()")
    catalog = page.evaluate("MRP.core.D.lat.peering.map(p => p.name)")
    assert len(catalog) > 50
    assert "Amsterdam Metro" in catalog and "Dublin Metro" in catalog
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

            # Only user-added peering locations supply existing connectivity choices.
            page.evaluate("""() => {
              MRP.core.S.sites = [
                {id:'customer',kind:'city',city:{n:'Customer Chicago DC',lat:41.88,lon:-87.63},peering:'Chicago',edits:{}},
                {id:'frankfurt',kind:'peering',peering:'Frankfurt',edits:{}},
                {id:'dublin',kind:'peering',peering:'Dublin',edits:{}}
              ];
              MRP.kit.hooks.commit();
            }""")
            connectivity = page.get_by_role("combobox", name="Existing connectivity", exact=True)
            assert connectivity.locator("option").all_text_contents() == [
                "Select a peering location", "ExpressRoute circuit in Frankfurt", "ExpressRoute circuit in Dublin"]
            connectivity.select_option("ExpressRoute circuit in Frankfurt")
            assert connectivity.input_value() == "ExpressRoute circuit in Frankfurt"
            # Each current region assigns its primary circuit independently.
            page.get_by_role("tab", name="Scope", exact=False).click()
            west = page.get_by_role("combobox", name="Primary ExpressRoute circuit of West Europe", exact=True)
            north = page.get_by_role("combobox", name="Primary ExpressRoute circuit of North Europe", exact=True)
            assert west.locator("option").all_text_contents() == ["None", "Frankfurt", "Dublin"]
            west.select_option("Frankfurt")
            north.select_option("Dublin")
            page.reload()
            page.wait_for_selector('#planner[data-ready="1"]')
            assert west.input_value() == "Frankfurt"
            assert north.input_value() == "Dublin"
            assert page.evaluate("MRP.core.S.current.map(c => c.profile)") == ["Full platform", "Full platform"]
            scope = page.evaluate("MRP.workbook().sheets[0].rows.map(row => row.map(c => c.v))")
            assert ["West Europe", "Full platform", "Frankfurt", "Yes"] in scope
            assert ["North Europe", "Full platform", "Dublin", "No"] in scope
            page.get_by_role("tab", name="Regional design", exact=False).click()
            connectivity.select_option("ExpressRoute circuit in Dublin")
            page.evaluate("MRP.core.D.lat=null; MRP.kit.hooks.commit()")
            assert connectivity.locator("option").count() == 3
            assert connectivity.input_value() == "ExpressRoute circuit in Dublin"
            page.evaluate("MRP.core.S.sites=[]; MRP.kit.hooks.commit()")
            assert connectivity.is_disabled()
            assert connectivity.locator("option").count() == 1
            assert connectivity.input_value() == ""
            assert page.evaluate("MRP.core.S.current.map(c => c.circuit)") == ["", ""]
            assert page.evaluate("MRP.core.design(MRP.core.reg('swedencentral')).hybridUse") == "ExpressRoute circuit in Dublin"
            assert page.get_by_text("Previously recorded connectivity:", exact=False).is_visible()
            assert page.get_by_text("Add an ExpressRoute peering location in Scope first.", exact=True).is_visible()

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
    print("Hub multi-select, persistence, legacy plans, review/export, diagram, full peering catalog, user-added connectivity and per-region circuits passed.")


if __name__ == "__main__":
    main()
