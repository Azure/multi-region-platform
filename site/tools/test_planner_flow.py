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
    page.reload()
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


def workload_answers(page, base):
    page.goto(f"{base}/region-planner.html#checks")
    page.wait_for_selector('#planner[data-ready="1"]')
    page.evaluate("""() => {
      const C = MRP.core, s = C.blank();
      s.regions = ['swedencentral', 'polandcentral'].map(C.newRegion);
      C.replace(s); MRP.kit.hooks.render();
    }""")
    shared = page.locator('select[data-k="workload/3.1"]')
    assert page.get_by_text("Applies to all regions", exact=True).count() == 4
    assert page.locator(".pl-workload-regions").count() == 0
    shared.select_option("Known")
    assert page.evaluate("MRP.core.S.regions.map(r => r.checks['3.1'])") == ["Known", "Known"]
    page.locator('[data-act="workload-regions"][data-arg="3.1"]').click()
    regional = page.locator('select[data-k="workload/3.1/polandcentral"]')
    regional.select_option("Not known")
    shared.select_option("Partly known (guardrails set)")
    assert page.evaluate("MRP.core.S.regions.map(r => r.checks['3.1'])") == [
        "Partly known (guardrails set)", "Not known"]
    regional.select_option("__shared__")
    assert page.evaluate("MRP.core.reg('polandcentral').checks['3.1']") == "Partly known (guardrails set)"
    # An explicitly unanswered regional requirement is different from inheritance.
    regional.select_option("")
    page.locator('[data-act="workload-regions"][data-arg="3.1"]').click()
    page.reload()
    page.wait_for_selector('#planner[data-ready="1"]')
    assert page.locator(".pl-workload-regions").count() == 0
    assert page.evaluate("MRP.core.reg('polandcentral').checks['3.1']") == ""
    page.evaluate("""() => {
      MRP.core.S.regions.push(MRP.core.newRegion('italynorth'));
      MRP.kit.hooks.commit();
    }""")
    assert page.evaluate("MRP.core.reg('italynorth').checks['3.1']") == "Partly known (guardrails set)"
    assert page.evaluate("""() => {
      const C = MRP.core, saved = JSON.parse(JSON.stringify(C.S));
      C.replace(saved);
      return JSON.stringify(C.S.workload) === JSON.stringify(saved.workload);
    }""")
    # Earlier plans keep their regional differences and open the affected question.
    page.evaluate("""() => {
      const C = MRP.core, s = C.blank(); delete s.workload;
      s.regions = ['swedencentral', 'polandcentral'].map(C.newRegion);
      s.regions[0].checks = {'3.1': 'Known', '3.4': 'Yes'};
      s.regions[1].checks = {'3.1': 'Not known', '3.4': 'No'};
      C.replace(s); MRP.kit.hooks.render();
    }""")
    assert page.locator(".pl-workload-regions").count() == 2
    assert page.evaluate("MRP.core.S.regions.map(r => r.checks['3.4'])") == ["Yes", "No"]
    values = page.evaluate("MRP.workbook().sheets.find(s => s.name === 'Checks').rows.map(r => r.map(c => c && c.v))")
    assert any("Known" in row and "Not known" in row for row in values)
    assert any("Yes" in row and "No" in row for row in values)
    # Capability evidence never changes a workload requirement.
    page.evaluate("""() => {
      const C = MRP.core; C.D.byId.swedencentral.zones = false;
      MRP.kit.hooks.commit();
    }""")
    assert page.evaluate("MRP.core.suggestAnswer('4.2', MRP.core.reg('swedencentral'))") == "No (mandatory gap)"
    assert page.evaluate("MRP.core.reg('swedencentral').checks['3.4']") == "Yes"
    page.set_viewport_size({"width": 390, "height": 844})
    assert page.locator('select[data-k="workload/3.1"]').is_visible()
    page.locator(".pl-mreg-b").filter(has_text="Poland").click()
    assert page.locator('select[data-k="workload/3.1/polandcentral"]').is_visible()
    assert page.locator('select[data-k="workload/3.1/swedencentral"]').is_hidden()
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")


def scope_locations(page, base):
    page.set_viewport_size({"width": 1440, "height": 900})
    page.goto(f"{base}/region-planner.html#scope")
    page.wait_for_selector('#planner[data-ready="1"]')
    page.evaluate("MRP.core.replace(MRP.core.blank()); MRP.kit.hooks.render()")
    page.wait_for_function("MRP.core.D.citiesState === 'ready'")
    headings = page.locator(".pl-sec h3").all_text_contents()
    assert headings[-4:] == ["On-premises datacenters", "ExpressRoute peering locations",
                            "Current regions", "Regions to qualify"]
    # Locations can be defined before Azure regions; cloud-only plans can omit them.
    city = page.get_by_role("combobox", name="Add a datacenter city", exact=True)
    city.fill("London")
    page.get_by_role("listbox").get_by_role("option").filter(has_text="London").first.click()
    sid = page.evaluate("MRP.core.S.sites[0].id")
    assert page.evaluate("MRP.core.progress().scope") == "half"
    assert page.get_by_role("combobox", name="Peering location for London", exact=True).input_value() == ""
    page.get_by_role("spinbutton", name="Target in milliseconds for London", exact=True).fill("50")
    path = page.get_by_role("combobox", name="Peering location for London", exact=True)
    path.fill("Frankfurt")
    page.get_by_role("listbox").get_by_role("option").filter(has_text="Frankfurt").first.click()
    peer = page.get_by_role("combobox", name="Add a peering location", exact=True)
    peer.fill("Dublin")
    page.get_by_role("listbox").get_by_text("Dublin", exact=True).click()
    page.get_by_role("spinbutton", name="Target in milliseconds for Dublin", exact=True).fill("30")
    page.evaluate("""() => {
      const C = MRP.core;
      C.S.current = [{id:'westeurope', hub:true}];
      C.S.regions = [C.newRegion('swedencentral')]; MRP.kit.hooks.commit();
    }""")
    saved = page.evaluate("JSON.parse(JSON.stringify(MRP.core.S.sites))")
    page.reload()
    page.wait_for_selector('#planner[data-ready="1"]')
    assert page.evaluate("MRP.core.S.sites") == saved
    scope = page.evaluate("MRP.workbook().sheets.find(s => s.name === 'Scope').rows.map(r => r.map(c => c.v))")
    assert ["London", "Frankfurt", 50] in scope
    assert ["Dublin", "Dublin", 30] in scope
    page.get_by_role("tab", name="Latency", exact=False).click()
    assert page.get_by_role("combobox", name="Add a datacenter city", exact=True).count() == 0
    assert page.get_by_role("combobox", name="Add a peering location", exact=True).count() == 0
    assert page.locator('[data-act="rm-site"], [data-k$="/target"], [data-cb^="pl-"]').count() == 0
    assert page.locator(".pl-lt tbody tr").count() == 2
    latency = page.get_by_role("spinbutton", name="Latency from London to West Europe in milliseconds", exact=True)
    latency.fill("99")
    assert page.evaluate("MRP.core.S.sites[0].edits.westeurope") == 99
    page.get_by_role("button", name="Edit locations in Scope", exact=True).click()
    assert page.get_by_role("spinbutton", name="Target in milliseconds for London", exact=True).input_value() == "50"
    page.get_by_role("button", name="Clear Peering location for London", exact=True).click()
    assert page.evaluate("MRP.core.S.sites[0].peering") == ""
    page.get_by_role("tab", name="Latency", exact=False).click()
    assert latency.input_value() == "99"
    page.get_by_role("button", name="Restore the calculated value for London to West Europe", exact=True).click()
    assert page.evaluate("Object.keys(MRP.core.S.sites[0].edits)") == []
    assert page.get_by_text("Nearest (estimated)", exact=True).count() == 1
    page.get_by_role("button", name="Edit locations in Scope", exact=True).click()
    page.get_by_role("button", name="Remove Dublin", exact=True).click()
    assert page.evaluate("MRP.core.S.sites.map(s => s.id)") == [sid]
    page.get_by_role("button", name="Remove London", exact=True).click()
    assert page.evaluate("MRP.core.S.sites") == []

    # Missing catalogs explain the limitation without blocking manual footprint entry.
    for missing, warning in [
        ("latency-cities", "The city catalog could not be loaded."),
        ("latency", "Location reference data is unavailable."),
    ]:
        failed = page.context.browser.new_page()
        failed.route(f"**/data/{missing}.json", lambda route: route.fulfill(status=503, body="Unavailable"))
        failed.goto(f"{base}/region-planner.html#latency")
        failed.wait_for_selector('#planner[data-ready="1"]')
        failed.get_by_role("tab", name="Scope", exact=False).click()
        failed.get_by_text(warning, exact=False).first.wait_for()
        entry = failed.get_by_role("combobox", name="Add a datacenter city", exact=True)
        entry.fill("Uncatalogued datacenter")
        entry.press("Enter")
        assert failed.evaluate("MRP.core.S.sites[0].city.n") == "Uncatalogued datacenter"
        failed.close()


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
            workload_answers(page, base)
            phone(page, base)
            scope_locations(page, base)
            assert not errors, errors
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
    print("Workbook flow: Scope location inputs and failures, shared workload answers, regional overrides, migration/export, capability gaps, step order, Essentials, messages, folded regions, suggested answers, sticky steps, locked Next, review state, design outline, old links and phones passed.")


if __name__ == "__main__":
    main()
