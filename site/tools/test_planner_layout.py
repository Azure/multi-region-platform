#!/usr/bin/env python3
"""Browser regression checks for the full-width workbook and compact navigation."""
import functools
import http.server
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
TABS = ("scope", "services", "latency", "pricing", "checks", "design", "review")


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


def main():
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0),
        functools.partial(QuietHandler, directory=str(ROOT / "docs")))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{server.server_port}"
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch()
            page = browser.new_page(viewport={"width": 1440, "height": 1100})
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.goto(f"{base}/region-planner.html")
            page.wait_for_selector('#planner[data-ready="1"]')
            page.evaluate("""() => {
              MRP.core.replace(JSON.parse(JSON.stringify(MRP.EXAMPLE)));
              MRP.kit.hooks.render();
            }""")
            for theme in ("light", "dark"):
                page.evaluate("theme => document.documentElement.dataset.theme = theme", theme)
                for width in (375, 768, 1440, 1920):
                    page.set_viewport_size({"width": width, "height": 1100})
                    for tab in TABS:
                        page.locator(f"#tab-{tab}").click()
                        assert page.locator("#pl-panel").get_attribute("data-tab") == tab
                        assert not page.locator("#side-nav").is_visible(), (theme, width, tab)
                        dimensions = page.evaluate("""() => {
                          const box = document.querySelector('#planner').getBoundingClientRect();
                          return {left:box.left, right:innerWidth-box.right,
                            overflow:document.documentElement.scrollWidth > innerWidth,
                            header:document.querySelector('.top').getBoundingClientRect().height};
                        }""")
                        assert not dimensions["overflow"], (theme, width, tab, dimensions)
                        assert dimensions["left"] <= 24 and dimensions["right"] <= 24, dimensions
                        assert dimensions["header"] == 48, dimensions
                        assert page.locator(".pl-cmd").is_visible()
                        assert not page.locator(".crumbs").is_visible()
                        assert not page.locator(".meta").is_visible()
                        menu = page.get_by_role("button", name="Table of contents", exact=True)
                        menu.focus()
                        page.keyboard.press("Enter")
                        assert menu.get_attribute("aria-expanded") == "true"
                        assert page.locator("#side-nav").is_visible()
                        assert page.locator("#planner").bounding_box()["width"] == width - 2 * dimensions["left"]
                        page.keyboard.press("Escape")
                        assert menu.get_attribute("aria-expanded") == "false"
                        assert not page.locator("#side-nav").is_visible()
                        assert page.locator(".nav-backdrop").is_hidden()
            page.reload()
            page.wait_for_selector('#planner[data-ready="1"]')
            assert page.locator("#pl-panel").get_attribute("data-tab") == "review"
            assert not page.locator("#side-nav").is_visible()
            page.emulate_media(media="print")
            assert not page.locator(".top").is_visible()
            assert not page.locator("#side-nav").is_visible()
            assert page.locator("#pl-panel").is_visible()
            page.emulate_media(media="screen")
            page.goto(f"{base}/getting-started.html")
            assert page.locator("#side-nav").is_visible()
            assert page.locator(".nav-toggle").is_hidden()
            assert page.locator(".top").bounding_box()["height"] == 56
            assert not errors, errors
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
    print("Workbook layout checks passed.")


if __name__ == "__main__":
    main()
