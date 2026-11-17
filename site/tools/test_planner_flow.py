#!/usr/bin/env python3
"""Browser checks for the workbook flow: step order, folded Essentials, the sticky step strip, regions ruled out by
checks 1 to 3, check 4 answers suggested from the evidence, step states, messages, the regional design outline, and phones."""
import functools
import http.server
import json
import tempfile
import threading
import zipfile
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
ORDER = ["scope", "checks", "capability", "outcome", "design", "review"]


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
    assert page.locator(".pl-lt").count() == 1
    page.get_by_role("button", name="2 Pricing", exact=True).click()
    assert "List prices only" in page.locator("#pl-panel").inner_text()
    page.get_by_role("button", name="3 Check 4 questions", exact=True).click()
    assert page.locator(".pl-cg thead th").filter(has_text="Switzerland North").count() == 0
    assert page.evaluate("MRP.core.suggestions(MRP.core.active()).length") == 3
    assert page.evaluate("MRP.core.reg('polandcentral').checks['4.1'] || ''") == ""
    assert page.locator(".pl-seg-b.suggested").count() == 3
    page.locator('[data-k="reg/polandcentral/check/4.1"][data-v="Yes"]').click()
    assert page.evaluate("MRP.core.reg('polandcentral').checks['4.1']") == "Yes"
    page.get_by_role("button", name="Accept 2 suggestions").click()
    assert page.evaluate("[MRP.core.reg('polandcentral').checks['4.2'], MRP.core.reg('polandcentral').checks['4.4']]") == ["Yes", "To validate"]
    assert page.locator("[data-act=accept]").count() == 0
    assert page.locator(".pl-outcomes").count() == 0
    assert page.locator(".pl-cg tbody td .pl-ev").count() == 14
    page.locator("#tab-outcome").click()
    assert page.locator(".pl-outcomes tbody tr").count() == 3
    assert "No deeper assessment" not in page.locator("#pl-panel").inner_text()
    assert page.locator('.pl-outcomes tbody tr').last.locator("td .pl-st.neutral").count() == 3

    # The step strip stays under the site header while the page scrolls.
    page.locator("#tab-checks").click()
    page.mouse.wheel(0, 1500)
    page.wait_for_timeout(200)
    top = page.evaluate("document.querySelector('#pl-tabs').getBoundingClientRect().top")
    assert abs(top - 48) <= 1, top
    page.locator("#tab-outcome").click()

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

    # Regional design: all placements remain editable, including defaults; the map waits behind a button.
    page.locator("#tab-design").click()
    assert page.locator(".pl-dz-nav .pl-ol").count() >= 5
    assert page.locator(".pl-ssr").count() == 7
    assert page.locator(".pl-ssr .pl-tag").filter(has_text="Profile default").count() == 3
    assert page.get_by_role("radiogroup", name="Placement of Key Vault", exact=True).count() == 0
    assert page.get_by_role("radiogroup", name="Placement of Management groups, access control, policy", exact=True).count() == 0
    assert page.locator(".pl-dz-nav .pl-pill:disabled").count() == 2
    assert "Candidate: requires Qualified or Conditional" in page.locator(".pl-dz-nav").inner_text()
    assert page.locator("#pl-latency-map").count() == 0
    page.locator(".pl-ol").filter(has_text="Hybrid connectivity").click()
    page.wait_for_timeout(1200)   # the site scrolls smoothly
    sec = page.evaluate("document.querySelector('#pl-d-hybrid').getBoundingClientRect().top")
    strip = page.evaluate("document.querySelector('#pl-tabs').getBoundingClientRect().bottom")
    assert strip <= sec <= strip + 24, (strip, sec)
    page.get_by_role("button", name="Show the map", exact=True).click()
    page.wait_for_selector(".pl-map-land")

    # Outcome is a separate step; old evidence hashes still reach their substeps.
    page.goto(f"{base}/region-planner.html#outcome")
    page.wait_for_selector('#planner[data-ready="1"]')
    assert page.locator("#pl-panel").get_attribute("data-tab") == "outcome"
    page.goto(f"{base}/region-planner.html#capability")
    page.wait_for_selector('#planner[data-ready="1"]')
    assert page.locator('[data-act="evidence"][data-arg="questions"]').get_attribute("aria-pressed") == "true"


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
    assert page.locator(".pl-cards.archetypes [role=radio]").count() == 4
    assert page.locator(".pl-services-scroll tbody tr").count() == 10
    # The step menu moves between steps, and the footer is one row.
    page.locator("#pl-stepsel").select_option("capability")
    page.locator('[data-act="evidence"][data-arg="pricing"]').click()
    assert page.locator("#pl-panel").get_attribute("data-tab") == "capability"
    assert page.locator(".pl-pt").count() == 1
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
    shared = lambda value: page.locator(f'button[data-k="workload/3.1"][data-v="{value}"]')
    assert page.get_by_text("Applies to all regions", exact=True).count() == 1
    assert page.locator(".pl-workload-regions").count() == 0
    shared("Known").click()
    assert page.evaluate("MRP.core.S.regions.map(r => r.checks['3.1'])") == ["Known", "Known"]
    page.locator('[data-act="workload-overrides"]').click()
    regional = page.locator('select[data-k="workload/3.1/polandcentral"]')
    regional.select_option("Not known")
    shared("Partly known (guardrails set)").click()
    assert page.evaluate("MRP.core.S.regions.map(r => r.checks['3.1'])") == [
        "Partly known (guardrails set)", "Not known"]
    regional.select_option("__shared__")
    assert page.evaluate("MRP.core.reg('polandcentral').checks['3.1']") == "Partly known (guardrails set)"
    # An explicitly unanswered regional requirement is different from inheritance.
    regional.select_option("")
    page.locator('[data-act="workload-overrides"]').click()
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
    assert shared("Known").is_visible()
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
    assert headings == ["Plan", "On-premises datacenters", "ExpressRoute peering locations",
                        "Current platform", "Regions to qualify"]
    a = page.locator("#pl-scope-datacenters").bounding_box()
    b = page.locator("#pl-scope-peering").bounding_box()
    assert abs(a["y"] - b["y"]) <= 1 and a["x"] + a["width"] < b["x"]
    groups = page.evaluate("""() => MRP.workbook().sheets.find(s => s.name === 'Scope')
      .rows.filter(r => r[0] && r[0].s === 'group').map(r => r[0].v)""")
    assert groups == ["Plan details", "On-premises datacenters", "ExpressRoute peering locations",
                      "Current regions", "Current platform", "Regions to qualify"]
    # Locations can be defined before Azure regions; cloud-only plans can omit them.
    city = page.get_by_role("combobox", name="Add a datacenter city", exact=True)
    city.fill("London")
    page.get_by_role("listbox").get_by_role("option").filter(has_text="London").first.click()
    sid = page.evaluate("MRP.core.S.sites[0].id")
    assert page.evaluate("MRP.core.progress().scope") == "half"
    assert page.get_by_role("combobox", name="Peering location for London", exact=True).count() == 0
    assert page.get_by_role("spinbutton", name="Target in milliseconds for London", exact=True).count() == 0
    peer = page.get_by_role("combobox", name="Add a peering location", exact=True)
    peer.fill("Dublin")
    page.get_by_role("listbox").get_by_text("Dublin", exact=True).click()
    assert page.get_by_role("spinbutton", name="Target in milliseconds for Dublin", exact=True).count() == 0
    assert page.locator(".pl-sites thead tr").evaluate_all("rows => rows.map(row => row.children.length)") == [2, 2]
    assert page.locator(".pl-sites").get_by_role("columnheader", name="Peering path", exact=True).count() == 0
    assert page.locator(".pl-sites").get_by_role("columnheader", name="Target (ms)", exact=True).count() == 0
    # Saved paths and targets still survive and inform latency without Scope editing controls.
    page.evaluate("""() => {
      const C = MRP.core;
      C.S.sites[0].peering = 'Frankfurt'; C.S.sites[0].target = 50;
      C.S.sites[1].target = 30;
      C.S.current = [{id:'westeurope', hub:true}];
      C.S.regions = [C.newRegion('swedencentral')]; MRP.kit.hooks.commit();
    }""")
    primary = page.get_by_role("combobox", name="Primary ExpressRoute circuit of West Europe", exact=True)
    assert primary.locator("option").all_text_contents() == ["None", "Dublin"]
    assert primary.input_value() == ""
    primary.select_option("Dublin")
    assert page.evaluate("MRP.core.S.current[0].circuit") == "Dublin"
    saved = page.evaluate("JSON.parse(JSON.stringify(MRP.core.S.sites))")
    profile = page.get_by_role("combobox", name="Platform Services profile of West Europe")
    assert profile.locator("option").all_text_contents()[1:] == ["Governance-Only", "Remote platform", "Minimal platform", "Full platform"]
    profile.select_option("Minimal platform")
    page.reload()
    page.wait_for_selector('#planner[data-ready="1"]')
    assert page.evaluate("MRP.core.S.sites") == saved
    assert page.evaluate("MRP.core.S.current[0].profile") == "Minimal platform"
    assert page.evaluate("MRP.core.S.current[0].circuit") == "Dublin"
    scope = page.evaluate("MRP.workbook().sheets.find(s => s.name === 'Scope').rows.map(r => r.map(c => c.v))")
    assert ["London", "Frankfurt", 50] in scope
    assert ["Dublin", "Dublin", 30] in scope
    assert ["West Europe", "Minimal platform", "Dublin", "Yes"] in scope
    page.locator("#tab-capability").click()
    page.locator('[data-act="evidence"][data-arg="latency"]').click()
    assert page.get_by_role("combobox", name="Add a datacenter city", exact=True).count() == 0
    assert page.get_by_role("combobox", name="Add a peering location", exact=True).count() == 0
    assert page.locator('[data-act="rm-site"], [data-k$="/target"], [data-cb^="pl-"]').count() == 0
    table = page.locator(".pl-lt")
    assert table.locator("tbody tr").count() == 1
    assert table.get_by_role("rowheader").get_by_text("London", exact=True).count() == 1
    assert table.get_by_role("columnheader").all_inner_texts() == [
        "On-Premises Locations", "ExpressRoute Peering location",
        "West Europe\nCurrent region", "Sweden Central"]
    assert table.get_by_role("columnheader", name="Target (ms)", exact=True).count() == 0
    assert table.locator(".pl-pl-v").inner_text() == "Frankfurt"
    assert page.locator(".pl-lat-target").count() == 2
    assert page.locator(".pl-latlg-t").all_inner_texts() == ["0", "30", "60", "120", "200", "250+"]
    latency = page.get_by_role("spinbutton", name="Latency from London to West Europe in milliseconds", exact=True)
    for value, expected in [(30, 0.2), (60, 0.4), (120, 0.6), (200, 0.8), (250, 1.0)]:
        latency.fill(str(value))
        proportion = latency.locator("xpath=ancestor::td").locator(".pl-hbar").evaluate(
            "bar => bar.querySelector('i').getBoundingClientRect().width / bar.clientWidth")
        assert abs(proportion - expected) < 0.002, (value, proportion)
    latency.fill("99")
    assert page.evaluate("MRP.core.S.sites[0].edits.westeurope") == 99
    page.get_by_role("button", name="Edit locations in Scope", exact=True).click()
    assert page.evaluate("MRP.core.S.sites[0].target") == 50
    assert page.evaluate("MRP.core.S.sites[0].peering") == "Frankfurt"
    page.evaluate("MRP.core.S.sites[0].peering=''; MRP.kit.hooks.commit()")
    assert page.evaluate("MRP.core.S.sites[0].peering") == ""
    page.locator("#tab-capability").click()
    page.locator('[data-act="evidence"][data-arg="latency"]').click()
    assert latency.input_value() == "99"
    page.get_by_role("button", name="Restore the calculated value for London to West Europe", exact=True).click()
    assert page.evaluate("Object.keys(MRP.core.S.sites[0].edits)") == []
    assert page.get_by_text("Nearest (estimated)", exact=True).count() == 1
    page.get_by_role("button", name="Edit locations in Scope", exact=True).click()
    page.get_by_role("button", name="Remove Dublin", exact=True).click()
    assert page.evaluate("MRP.core.S.current[0].circuit") == ""
    assert page.evaluate("MRP.core.S.sites.map(s => s.id)") == [sid]
    # Peering-only plans do not introduce standalone rows in the on-premises table.
    page.get_by_role("combobox", name="Add a peering location", exact=True).fill("Dublin")
    page.get_by_role("listbox").get_by_text("Dublin", exact=True).click()
    page.get_by_role("button", name="Remove London", exact=True).click()
    page.locator("#tab-capability").click()
    page.locator('[data-act="evidence"][data-arg="latency"]').click()
    assert page.locator(".pl-lt").count() == 0
    assert page.get_by_text("No on-premises locations yet. Add datacenters in Scope.", exact=True).is_visible()
    assert page.evaluate("MRP.core.S.sites[0].peering") == "Dublin"
    page.get_by_role("button", name="Edit locations in Scope", exact=True).click()
    page.get_by_role("button", name="Remove Dublin", exact=True).click()
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


def review_exports(page, base):
    page.goto(f"{base}/region-planner.html#design")
    page.wait_for_selector('#planner[data-ready="1"]')
    load_example(page)
    page.get_by_role("checkbox", name="New requirements", exact=True).uncheck()
    page.get_by_role("checkbox", name="Platform gaps", exact=True).uncheck()
    page.get_by_role("textbox", name="Additional review trigger", exact=True).fill("Review after the second circuit is commissioned")
    page.get_by_role("textbox", name="Owner", exact=True).fill("Regional architecture team")
    page.get_by_role("tab", name="Review + export", exact=False).click()
    assert page.locator(".pl-review-triggers li").all_inner_texts() == [
        "Review date: " + page.evaluate("MRP.core.reg('swedencentral').review"),
        "New constraints", "Review after the second circuit is commissioned"]
    assert "Regional architecture team" in page.locator(".pl-rec").inner_text()
    assert page.locator('[aria-label="All regions"] tbody tr').count() == 3
    with tempfile.TemporaryDirectory() as directory:
        with page.expect_download() as downloaded:
            page.locator('[data-act="save"]').click()
        saved = Path(directory) / "region-plan.json"
        downloaded.value.save_as(saved)
        plan = json.loads(saved.read_text(encoding="utf-8"))
        assert len(plan["regions"]) == 3
        assert plan["regions"][0]["design"]["reviewTriggers"] == ["New constraints"]
        assert plan["current"][0]["profile"] == "Full platform"
        assert plan["current"][0]["circuit"] == "Frankfurt"
        page.evaluate("MRP.core.replace(MRP.core.blank()); MRP.kit.hooks.render()")
        page.locator("#pl-file").set_input_files(saved)
        page.get_by_text("Opened region-plan.json.", exact=True).wait_for()
        assert page.locator('[aria-label="All regions"] tbody tr').count() == 3
        assert page.locator(".pl-review-triggers li").count() == 3
        with page.expect_download() as downloaded:
            page.locator('[data-act="export"]').first.click()
        exported = Path(directory) / "region-plan.xlsx"
        downloaded.value.save_as(exported)
        with zipfile.ZipFile(exported) as workbook:
            review = workbook.read("xl/worksheets/sheet7.xml").decode("utf-8")
            for value in ["Sweden Central", "Poland Central", "Switzerland North",
                          "Hybrid-Dependent Workloads", "New constraints",
                          "Review after the second circuit is commissioned"]:
                assert value in review, value
            assert "No deeper assessment" not in review
    page.evaluate("MRP.core.S.regions.forEach(r => r.selected = false); MRP.kit.hooks.commit()")
    assert page.locator(".pl-rec").count() == 0
    assert page.locator('[aria-label="All regions"] tbody tr').count() == 3
    assert "No region is selected for regional design" in page.locator("#pl-panel").inner_text()
    assert "Switzerland North" in page.evaluate("MRP.core.recordText()")


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
            review_exports(page, base)
            assert not errors, errors
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
    print("Workbook flow: Scope location inputs and failures, shared workload answers, regional overrides, migration/export, capability gaps, step order, Essentials, messages, folded regions, suggested answers, sticky steps, locked Next, review state, design outline, old links and phones passed.")


if __name__ == "__main__":
    main()
