#!/usr/bin/env python3
"""Targeted browser regression checks for the Latency tab's geographic view."""
import functools
import http.server
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


def scenario(page):
    page.evaluate("""() => {
      const C = MRP.core, s = C.blank();
      s.current = [{id:'westeurope',hub:true},{id:'northeurope',hub:false}];
      s.regions = ['swedencentral','denmarkeast','italynorth'].map(C.newRegion);
      s.sites = ['Frankfurt','Dublin'].map((peering,i) =>
        ({id:'peer'+i, kind:'peering',peering,city:null,target:'',edits:{}}));
      C.replace(s); MRP.ui.tab = 'latency'; MRP.kit.hooks.render();
    }""")
    page.wait_for_selector(".pl-map-land")


def main():
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0),
        functools.partial(QuietHandler, directory=str(ROOT / "docs")))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    url = f"http://127.0.0.1:{server.server_port}/region-planner.html#latency"
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch()
            page = browser.new_page(viewport={"width": 1440, "height": 1100})
            errors, external = [], []
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.on("request", lambda r: external.append(r.url) if r.url.startswith("http") and not r.url.startswith(f"http://127.0.0.1:{server.server_port}/") else None)
            page.goto(url)
            page.wait_for_selector('#planner[data-ready="1"]')
            scenario(page)
            assert page.locator(".pl-map-node").count() == 7
            assert page.locator(".pl-map-link").count() == 10
            assert page.locator(".pl-map-value").count() == 10
            assert page.locator("#pl-latency-map table").count() == 0
            assert page.locator(".pl-map-node.peering").count() == 2
            assert page.locator(".pl-map-node.candidate title").all_text_contents()[0].endswith("Sweden geography · approximate metro")
            expected = page.evaluate("MRP.core.regionLatency('westeurope','swedencentral').ms")
            assert any(f"West Europe → Sweden Central: {expected} ms" in t
                for t in page.locator(".pl-map-value title").all_text_contents())

            page.get_by_label("Peering to candidate regions", exact=True).check()
            assert page.locator(".pl-map-link").count() == 16
            page.get_by_label("Other region pairs", exact=True).check()
            assert page.locator(".pl-map-link").count() == 20
            page.locator('#pl-map-focus').select_option("r:swedencentral")
            assert page.locator(".pl-map-link").count() == 6
            page.get_by_role("button", name="Reset map", exact=True).click()
            marker = page.locator('[data-map-arg="r:swedencentral"]')
            marker.focus()
            page.keyboard.press("Enter")
            assert page.locator(".pl-map-link").count() == 2
            assert page.locator('#pl-map-focus').input_value() == "r:swedencentral"
            page.keyboard.press("Space")
            assert page.locator(".pl-map-link").count() == 10
            before = page.locator(".pl-map-node.current").first.inner_html()
            page.get_by_role("button", name="Zoom map in", exact=True).click()
            assert page.locator(".pl-map-node.current").first.inner_html() != before
            page.get_by_role("button", name="Fit selections", exact=True).click()
            assert page.locator(".pl-map-node.current").first.inner_html() == before

            entry = page.get_by_role("spinbutton", name="Latency from Frankfurt to West Europe in milliseconds", exact=True)
            entry.fill("99")
            assert any("Frankfurt → West Europe: 99 ms · Edited" in t
                for t in page.locator(".pl-map-value title").all_text_contents())
            assert "99 ms*" in page.locator(".pl-map-value text").all_text_contents()
            page.get_by_role("button", name="Restore the calculated value for Frankfurt to West Europe", exact=True).click()
            assert "99 ms*" not in page.locator(".pl-map-value text").all_text_contents()
            page.get_by_role("button", name="Remove Dublin", exact=True).click()
            assert page.locator(".pl-map-node").count() == 6
            assert page.locator(".pl-map-link").count() == 8
            scenario(page)

            page.evaluate("""() => {
              MRP.core.S.sites.push({id:'city',kind:'city',city:{n:'London',cc:'GB',lat:51.51,lon:-0.13},
                peering:'Frankfurt',target:'',edits:{westeurope:999}});
              MRP.kit.hooks.render();
            }""")
            page.get_by_label("Cities to peering locations", exact=True).check()
            assert page.locator(".pl-map-node").count() == 8
            assert page.locator(".pl-map-link.cities").count() == 1
            assert not any("999 ms" in t for t in page.locator(".pl-map-value.cities title").all_text_contents())
            page.get_by_role("button", name="Reset map", exact=True).click()

            for theme in ("light", "dark"):
                page.evaluate("(t) => document.documentElement.dataset.theme=t", theme)
                colors = page.locator(".pl-map-node .pl-map-name").evaluate_all("(es) => es.map(e=>getComputedStyle(e).fill)")
                assert len(set(colors)) >= 3
                for width in (375, 768, 1024, 1440):
                    page.set_viewport_size({"width": width, "height": 1000})
                    assert page.evaluate("document.documentElement.scrollWidth<=innerWidth"), (theme, width)
                    assert page.locator("#pl-latency-map").evaluate("e=>e.scrollWidth<=e.clientWidth")
            page.set_viewport_size({"width": 1440, "height": 1100})
            page.evaluate("document.documentElement.dataset.theme='light'")
            shots = ROOT / "site" / "tools" / "shots"
            shots.mkdir(exist_ok=True)
            page.locator("#pl-latency-map").screenshot(path=str(shots / "planner-latency-map.png"))

            # The actual planner seed, not a Europe-only illustration, drives world and date-line views.
            page.evaluate("""() => {
              const C=MRP.core, s=C.blank();
              s.current=[{id:'japaneast',hub:true}]; s.regions=['westus','newzealandnorth'].map(C.newRegion);
              C.replace(s); MRP.kit.hooks.render();
            }""")
            assert page.locator(".pl-map-node").count() == 3
            for marker in page.locator(".pl-map-pin").all():
                x = float(marker.get_attribute("cx"))
                assert 60 < x < 940, x
            assert "NaN" not in page.locator(".pl-map-svg").inner_html()

            # Missing coordinates and missing latency are explicit, never fabricated.
            page.evaluate("""() => {
              const C=MRP.core; C.S.current.push({id:'unknown-region',hub:false});
              C.S.sites.push({id:'unknown-site',kind:'peering',peering:'Unknown peering',city:null,target:'',edits:{}});
              C.D.lat=null; MRP.kit.hooks.render();
            }""")
            assert page.get_by_text("Not plotted:", exact=False).count() == 1
            assert page.locator(".pl-map-value text").all_text_contents() == ["No data", "No data"]
            assert page.locator(".pl-map-node").count() == 3
            assert not errors, errors
            assert not external, external

            failed = browser.new_page()
            failed.route("**/assets/planner-map.json", lambda route: route.fulfill(status=503, body="Unavailable"))
            failed.goto(url)
            failed.wait_for_selector('#planner[data-ready="1"]')
            failed.evaluate("""() => {
              const C=MRP.core, s=C.blank(); s.current=[{id:'westeurope',hub:true}];
              s.regions=['italynorth'].map(C.newRegion); C.replace(s); MRP.kit.hooks.render();
            }""")
            failed.get_by_text("Geographic boundaries could not be loaded", exact=False).wait_for()
            assert failed.locator(".pl-map-node").count() == 2
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
    print("Planner map: data parity, layers, keyboard/focus, edits, cities, themes, responsive layout, date line and failure states passed.")


if __name__ == "__main__":
    main()
