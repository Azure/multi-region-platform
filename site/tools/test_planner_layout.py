#!/usr/bin/env python3
"""Browser regression checks for the full-width workbook and compact navigation."""
import functools
import http.server
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
TABS = ("scope", "checks", "check4-latency", "check4-pricing", "check4-questions", "outcome", "design", "review")


def scope_colors(page):
    return page.locator('[data-tab="scope"] .pl-sec-h').evaluate_all("""headers => {
      const ctx = document.createElement('canvas').getContext('2d');
      const rgb = color => {
        ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1);
        return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
      };
      return headers.map(header => ({
        foreground: rgb(getComputedStyle(header.querySelector('h3')).color),
        background: rgb(getComputedStyle(header.closest('.pl-sec')).backgroundColor),
      }));
    }""")


def luminance(rgb):
    channels = [v / 255 for v in rgb]
    linear = [v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in channels]
    return sum(v * weight for v, weight in zip(linear, (0.2126, 0.7152, 0.0722)))


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
            palettes = {}
            for theme in ("light", "dark"):
                page.evaluate("theme => document.documentElement.dataset.theme = theme", theme)
                for width in (375, 768, 1440, 1920):
                    page.set_viewport_size({"width": width, "height": 1100})
                    for tab in TABS:
                        main_tab = "capability" if tab.startswith("check4-") else tab
                        # Phones choose the step from one menu; wider screens use the tab strip.
                        if width <= 720:
                            page.locator("#pl-stepsel").select_option(main_tab)
                        else:
                            page.locator(f"#tab-{main_tab}").click()
                        if tab.startswith("check4-"):
                            page.locator(f'[data-act="evidence"][data-arg="{tab[7:]}"]').click()
                        assert page.locator("#pl-panel").get_attribute("data-tab") == main_tab
                        if tab == "scope" and width == 375:
                            palettes[theme] = colors = scope_colors(page)
                            assert len(colors) == 5
                            assert len({tuple(c["background"]) for c in colors}) == 1
                            assert len({tuple(c["foreground"]) for c in colors}) == 1
                            for color in colors:
                                a, b = sorted([luminance(color["foreground"]), luminance(color["background"])])
                                assert (b + 0.05) / (a + 0.05) >= 4.5, (theme, color)
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
            assert all(light != dark for light, dark in zip(palettes["light"], palettes["dark"]))
            page.reload()
            page.wait_for_selector('#planner[data-ready="1"]')
            assert page.locator("#pl-panel").get_attribute("data-tab") == "review"
            assert not page.locator("#side-nav").is_visible()
            page.emulate_media(media="print")
            assert not page.locator(".top").is_visible()
            assert not page.locator("#side-nav").is_visible()
            assert page.locator("#pl-panel").is_visible()
            page.emulate_media(media="screen")
            page.locator("#tab-scope").click()
            page.emulate_media(color_scheme="dark")
            page.evaluate("document.documentElement.removeAttribute('data-theme')")
            assert scope_colors(page) == palettes["dark"]
            page.emulate_media(color_scheme="light")
            assert scope_colors(page) == palettes["light"]
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
