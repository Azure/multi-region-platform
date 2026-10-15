#!/usr/bin/env python3
"""Browser regression checks for the Services limit and ten-row viewport."""
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
      C.D.hasCatalog = catalog;
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
            page.wait_for_function("MRP.core.D.products !== null")
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
        print("Services: 100-service limit, ten-row scrolling, persistence, export and print passed.")
    finally:
        server.shutdown()
        server.server_close()


if __name__ == "__main__":
    main()
