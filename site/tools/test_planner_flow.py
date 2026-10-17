#!/usr/bin/env python3
"""Browser checks for the workbook flow: step order, folded Essentials, the sticky step strip, regions ruled out by
checks 1 to 3, check 4 answers suggested from the evidence, step states, messages, the regional design outline, and phones."""
import functools
import http.server
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
ORDER = ["scope", "checks", "services", "latency", "pricing", "capability", "design", "review"]


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


def load_example(page):
    page.evaluate("""() => {
      const ex = JSON.parse(JSON.stringify(MRP.EXAMPLE)); ex.meta.date = MRP.core.today();
      MRP.core.replace(ex); MRP.kit.hooks.render();
    }""")


def desktop(page, base):
    page.goto(f"{base}/region-planner.html#scope")
    page.wait_for_selector('#planner[data-ready="1"]')
    assert [t.get_attribute("id")[4:] for t in page.locator(".pl-tabs [role=tab]").all()] == ORDER
    # Essentials is one summary line until it is opened.
    assert page.locator("#pl-ess-b").is_hidden()
    page.get_by_role("button", name="Essentials").click()
    assert page.locator("#pl-ess-b").is_visible()
    page.get_by_role("button", name="Essentials").click()

    # The example message has its own row: it pushes Essentials down instead of covering it.
    page.locator("#pl-b-example").click()
    msg, ess = page.locator("#pl-msg .pl-mb").bounding_box(), page.locator("#pl-ess").bounding_box()
    assert msg["y"] + msg["height"] <= ess["y"] + 1, (msg, ess)
    page.get_by_role("button", name="Dismiss").click()
    assert page.locator("#pl-msg .pl-mb").count() == 0

    # A region ruled out by check 1 is folded on the evidence tabs and in check 4, and stays in the export.
    page.goto(f"{base}/region-planner.html#services")
    page.wait_for_selector('#planner[data-ready="1"]')
    heads = page.locator(".pl-services-scroll thead th").all_inner_texts()
    assert not any("Switzerland North" in h for h in heads), heads
    assert page.locator(".pl-fold").filter(has_text="Switzerland North").count() == 1
    page.locator(".pl-fold").get_by_role("button", name="Show").click()
    assert any("Switzerland North" in h for h in page.locator(".pl-services-scroll thead th").all_inner_texts())
    page.locator(".pl-fold").get_by_role("button", name="Hide").click()
    sheet = page.evaluate("MRP.workbook().sheets.find(s => s.name === 'Checks').rows.flat().map(c => c && c.v).join('|')")
    assert "Switzerland North" in sheet

    # Check 4: three answers for Poland Central come from the evidence; nothing is saved until they are accepted.
    page.locator("#tab-capability").click()
    assert page.locator(".pl-cg thead th").filter(has_text="Switzerland North").count() == 0
    assert page.evaluate("MRP.core.suggestions(MRP.core.active()).length") == 3
    assert page.evaluate("MRP.core.reg('polandcentral').checks['4.1'] || ''") == ""
    page.get_by_role("button", name="Accept Yes for 4.1, Poland Central").click()
    assert page.evaluate("MRP.core.reg('polandcentral').checks['4.1']") == "Yes"
    page.get_by_role("button", name="Accept 2 suggestions").click()
    assert page.evaluate("[MRP.core.reg('polandcentral').checks['4.2'], MRP.core.reg('polandcentral').checks['4.4']]") == ["Yes", "To validate"]
    assert page.locator("[data-act=accept]").count() == 0
    assert page.locator(".pl-ot").count() == 1

    # The step strip stays under the site header while the page scrolls.
    page.mouse.wheel(0, 1500)
    page.wait_for_timeout(200)
    top = page.evaluate("document.querySelector('#pl-tabs').getBoundingClientRect().top")
    assert abs(top - 48) <= 1, top

    # Next never opens a locked step: with nothing selected it is disabled and says why.
    page.evaluate("() => { MRP.core.S.regions.forEach(r => r.selected = false); MRP.kit.hooks.commit(); }")
    nxt = page.locator(".pl-foot-l .pl-next")
    assert nxt.is_disabled()
    assert "Select a Qualified or Conditional region" in page.locator(".pl-foot-r").inner_text()
    page.evaluate("() => { MRP.core.reg('swedencentral').selected = true; MRP.kit.hooks.commit(); }")
    assert nxt.is_enabled()

    # Review + export is complete when every selected record is.
    assert page.evaluate("MRP.core.progress().review") == "done"
    assert "complete" in page.locator("#tab-review").get_attribute("aria-label")

    # Regional design: an outline beside the record, profile defaults folded into one line, the map behind a button.
    page.locator("#tab-design").click()
    assert page.locator(".pl-dz-nav .pl-ol").count() >= 5
    assert page.locator(".pl-ssg .pl-chip").count() == 5
    assert page.locator("#pl-latency-map").count() == 0
    page.locator(".pl-ol").filter(has_text="Hybrid connectivity").click()
    page.wait_for_timeout(1200)   # the site scrolls smoothly
    sec = page.evaluate("document.querySelector('#pl-d-hybrid').getBoundingClientRect().top")
    strip = page.evaluate("document.querySelector('#pl-tabs').getBoundingClientRect().bottom")
    assert strip <= sec <= strip + 24, (strip, sec)
    page.get_by_role("button", name="Show the map", exact=True).click()
    page.wait_for_selector(".pl-map-land")

    # An old link to #outcome opens check 4 and the outcome.
    page.goto(f"{base}/region-planner.html#outcome")
    page.wait_for_selector('#planner[data-ready="1"]')
    assert page.locator("#pl-panel").get_attribute("data-tab") == "capability"


def phone(page, base):
    page.set_viewport_size({"width": 390, "height": 844})
    page.goto(f"{base}/region-planner.html#checks")
    page.wait_for_selector('#planner[data-ready="1"]')
    load_example(page)
    assert page.locator(".pl-tabs").is_hidden()
    assert page.locator("#pl-stepsel").is_visible() or page.locator(".pl-stepm").is_visible()
    # One region at a time: only the chosen region's answers show.
    shown = page.locator(".pl-cg tbody td[data-rid]:visible").evaluate_all("els => [...new Set(els.map(e => e.dataset.rid))]")
    assert shown == ["swedencentral"], shown
    page.locator(".pl-mreg-b").filter(has_text="Poland").click()
    shown = page.locator(".pl-cg tbody td[data-rid]:visible").evaluate_all("els => [...new Set(els.map(e => e.dataset.rid))]")
    assert shown == ["polandcentral"], shown
    assert page.evaluate("document.documentElement.scrollHeight") < 3000
    # The step menu moves between steps, and the footer is one row.
    page.locator("#pl-stepsel").select_option("pricing")
    assert page.locator("#pl-panel").get_attribute("data-tab") == "pricing"
    foot = page.locator(".pl-foot-bar").bounding_box()
    assert foot["height"] < 72, foot
    for b in page.locator(".pl-foot-l .pl-btn, .pl-stepm").all():
        assert b.bounding_box()["height"] >= 44
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")


def main():
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0),
        functools.partial(QuietHandler, directory=str(ROOT / "docs")))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{server.server_port}"
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch()
            page = browser.new_page(viewport={"width": 1440, "height": 900})
            errors = []
            page.on("pageerror", lambda e: errors.append(str(e)))
            desktop(page, base)
            phone(page, base)
            assert not errors, errors
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
    print("Workbook flow: step order, Essentials, messages, folded regions, suggested answers, sticky steps, locked Next, review state, design outline, old links and phones passed.")


if __name__ == "__main__":
    main()
