#!/usr/bin/env python3
"""Browser checks for catalog selection, pricing inheritance and the Services table."""
import functools
import http.server
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


def seed(page, count, catalog=True):
    page.evaluate("""({count, catalog}) => {
      const C = MRP.core, s = C.blank();
      s.current = [{id:'westeurope',hub:true}];
      s.regions = ['swedencentral'].map(C.newRegion);
      s.services = C.D.services.slice(0, count).map((x, i) =>
        ({id:'v'+i, service:x.name, product:'', weight:''}));
      C.D.hasAvailability = catalog;
      C.replace(s); MRP.ui.tab = 'services'; MRP.kit.hooks.render();
    }""", {"count": count, "catalog": catalog})
    assert page.locator(".pl-services-scroll tbody tr").count() == count


def check_viewport(page, count):
    dimensions = page.locator(".pl-services-scroll").evaluate("""e => {
      e.scrollTop = 0;
      const rows = [...e.querySelectorAll('tbody tr')];
      const top = e.getBoundingClientRect().top;
      return {
        visible: rows.filter(r => r.getBoundingClientRect().bottom <= top + e.clientHeight + 1).length,
        overflow: e.scrollHeight > e.clientHeight
      };
    }""")
    assert dimensions == {"visible": min(count, 10), "overflow": count > 10}, dimensions


def check_catalog_selections(page):
    page.evaluate("""() => {
      const C = MRP.core, s = C.blank();
      s.current = [{id:'westeurope',hub:true}]; s.baseline = 'westeurope';
      s.regions = ['swedencentral'].map(C.newRegion);
      s.services = [{id:'vm',service:'Virtual Machines',product:'',sku:'',weight:''}];
      C.replace(s); MRP.ui.tab = 'services'; MRP.kit.hooks.render();
    }""")
    product = page.get_by_role("combobox", name="Product of Virtual Machines", exact=True)
    sku = page.get_by_role("combobox", name="SKU of Virtual Machines", exact=True)
    assert sku.is_disabled()
    product.fill("Virtual Machines")
    page.get_by_role("option", name="Virtual Machines", exact=True).click()
    assert sku.is_enabled()
    sku.click()
    choice = page.locator('#pl-pop [role="option"]').first
    sku_name = choice.inner_text()
    choice.click()
    assert sku.input_value() == sku_name
    assert page.evaluate("MRP.core.S.services[0].sku") == sku_name
    expected = page.evaluate("""() => {
      const C = MRP.core, s = C.S.services[0];
      return C.cols().map(r => ({state:C.availability(s,r.id), zones:C.zoneText(C.availabilityDetails(s,r.id))}));
    }""")
    for cell, value in zip(page.locator(".pl-services-scroll tbody td[class*='av-']").all(), expected):
        assert f"av-{value['state']}" in cell.get_attribute("class")
        assert cell.locator(".pl-av-meta").count() == bool(value["zones"])
        if value["zones"]:
            assert cell.locator(".pl-av-meta").inner_text() == value["zones"]
    exported = page.evaluate("""() =>
      MRP.workbook().sheets.find(s => s.name === 'Services').rows.find(r => r[0] && r[0].s === 'int').map(c => c.v)
    """)
    assert exported[2:4] == ["Virtual Machines", sku_name]
    page.reload()
    page.wait_for_selector('#planner[data-ready="1"]')
    assert sku.input_value() == sku_name
    page.get_by_role("button", name="Clear Product of Virtual Machines", exact=True).click()
    assert page.evaluate("MRP.core.S.services[0].sku") == ""
    assert sku.is_disabled()

    page.evaluate("""() => {
      MRP.core.S.services.push({id:'app',service:'App Service',product:'',sku:'',weight:25},
        {id:'free',service:'Azure Advisor',product:'',sku:'',weight:0});
      MRP.kit.hooks.commit();
    }""")
    page.locator("#tab-pricing").click()
    page.wait_for_function("MRP.core.D.pricing.westeurope")
    assert page.locator(".pl-pt tbody th").filter(has_text="Azure App Service").count() == 1
    assert page.locator(".pl-pt tbody th").filter(has_text="No Retail meter (free service)").count() == 1
    assert page.evaluate("MRP.core.priceRows().find(s=>s.id==='app').retailService") == "Azure App Service"
    page.locator("#tab-services").click()
    zone_count = page.evaluate("""() => {
      const C = MRP.core;
      for (const service of C.D.services) for (const product of Object.values(service.products))
        for (const sku of Object.values(product.skus)) for (const [rid, entry] of Object.entries(sku.regions)) {
          if (!C.D.byId[rid] || !entry.available || !entry.zoneCounts.length) continue;
          const s = C.blank(); s.current = [{id:rid,hub:true}];
          s.services = [{id:'az',service:service.name,product:product.name,sku:sku.name,weight:''}];
          C.replace(s); MRP.kit.hooks.render();
          return C.zoneText(C.availabilityDetails(s.services[0],rid));
        }
      throw new Error('No available SKU has AZ data in this catalog');
    }""")
    assert page.locator(".pl-av-meta").inner_text() == zone_count
    assert page.evaluate("""() =>
      MRP.workbook().sheets.find(s => s.name === 'Services').rows.find(r => r[0] && r[0].s === 'int')[4].v
    """) == "Available\n" + zone_count


def main():
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0),
        functools.partial(QuietHandler, directory=str(ROOT / "docs")))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch()
            page = browser.new_page(viewport={"width": 1440, "height": 1100})
            errors = []
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.goto(f"http://127.0.0.1:{server.server_port}/region-planner.html#services")
            page.wait_for_selector('#planner[data-ready="1"]')
            page.wait_for_function("MRP.core.D.services.length >= 101")
            page.wait_for_function("MRP.core.D.hasAvailability")
            check_catalog_selections(page)
            add = page.get_by_role("combobox", name="Add a service", exact=True)

            seed(page, 20)
            add.click()
            page.locator('#pl-pop [role="option"]').first.click()
            assert page.locator(".pl-services-scroll tbody tr").count() == 21

            seed(page, 99)
            add.click()
            page.locator('#pl-pop [role="option"]').first.click()
            assert page.locator(".pl-count").inner_text() == "100 of 100"
            assert add.is_disabled()
            assert page.locator(".pl-services-scroll tbody tr").count() == 100
            assert page.evaluate("""() =>
              JSON.parse(localStorage.getItem('mrp-planner')).services.length""") == 100
            assert page.evaluate("""() =>
              MRP.workbook().sheets.find(s => s.name === 'Services').rows
                .filter(r => r[0] && r[0].s === 'int').length""") == 100
            page.reload()
            page.wait_for_selector('#planner[data-ready="1"]')
            assert page.locator(".pl-count").inner_text() == "100 of 100"

            for theme in ("light", "dark"):
                page.evaluate("t => document.documentElement.dataset.theme = t", theme)
                for width in (375, 768, 1440):
                    page.set_viewport_size({"width": width, "height": 1100})
                    page.wait_for_timeout(100)
                    check_viewport(page, 100)
                    table = page.locator(".pl-services-scroll")
                    table.evaluate("e => e.scrollTop = e.scrollHeight")
                    assert table.evaluate("""e =>
                      Math.abs(e.querySelector('thead th').getBoundingClientRect().top
                        - e.getBoundingClientRect().top) < 1""")
                    assert table.locator("tbody tr").last.evaluate("""r =>
                      r.getBoundingClientRect().bottom <=
                        r.closest('.pl-scroll').getBoundingClientRect().bottom + 1""")
                    before = table.evaluate("e => e.scrollTop")
                    page.evaluate("MRP.kit.hooks.render()")
                    assert abs(table.evaluate("e => e.scrollTop") - before) < 1

            page.set_viewport_size({"width": 1440, "height": 1100})
            page.get_by_role("button", name="Remove ", exact=False).last.click()
            assert add.is_enabled()
            add.click()
            page.locator('#pl-pop [role="option"]').first.click()
            assert page.locator(".pl-count").inner_text() == "100 of 100"

            page.emulate_media(media="print")
            assert page.locator(".pl-services-scroll").evaluate("e => e.clientHeight >= e.scrollHeight")
            page.emulate_media(media="screen")
            for count in (1, 10, 11):
                seed(page, count)
                check_viewport(page, count)

            seed(page, 99, catalog=False)
            add.fill("Custom service")
            add.press("Enter")
            assert page.locator(".pl-count").inner_text() == "100 of 100"
            assert add.is_disabled()
            assert page.locator(".pl-services-scroll tbody th").last.inner_text() == "Custom service"
            assert not errors, errors
            browser.close()
        print("Services: CSV selectors, mapped pricing, AZ details, 100-service limit, scrolling, persistence, export and print passed.")
    finally:
        server.shutdown()
        server.server_close()


if __name__ == "__main__":
    main()
