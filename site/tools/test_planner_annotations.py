#!/usr/bin/env python3
"""Browser checks for optional engagement fields, templates, persistence, and export boundaries."""
import functools
import http.server
import json
import tempfile
import threading
import zipfile
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
INCLUDE = "Include annotations in saved files and exports"


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


def upload_template(page, fields, **overrides):
    template = {"kind": "planner-annotation-template", "version": 1, "fields": fields, **overrides}
    page.locator("#pl-annotation-file").set_input_files({
        "name": "fields.json", "mimeType": "application/json",
        "buffer": json.dumps(template).encode(),
    })


def saved_json(page, directory):
    with page.expect_download() as downloaded:
        page.locator('[data-act="save"]').click()
    path = Path(directory) / "plan.json"
    downloaded.value.save_as(path)
    return json.loads(path.read_text()), path


def check_annotations(page, base, directory):
    page.route("https://**", lambda route: route.abort())
    page.goto(f"{base}/region-planner.html#check4-annotations")
    page.wait_for_selector('#planner[data-ready="1"]')
    assert page.get_by_role("button", name="4 Annotations", exact=True).get_attribute("aria-pressed") == "true"
    assert page.get_by_text("No custom fields yet", exact=True).is_visible()
    assert page.evaluate("MRP.core.S.annotations") == {"fields": [], "rows": []}
    page.evaluate("""() => {
      const C = MRP.core, s = C.blank();
      s.current = [{id:'westeurope', profile:''}];
      s.regions = ['swedencentral', 'polandcentral'].map(C.newRegion);
      s.regions[1].checks['1.1'] = 'No';
      C.replace(s); MRP.kit.hooks.render();
    }""")
    before = page.evaluate("MRP.core.S.regions.map(r => [r.checks, MRP.core.outcome(r)])")

    page.get_by_role("button", name="Add field", exact=True).click()
    page.get_by_role("button", name="Save field", exact=True).click()
    assert "needs a name" in page.locator("#pl-msg").inner_text()
    page.get_by_label("Field name", exact=True).fill("Reference")
    page.get_by_role("button", name="Save field", exact=True).click()
    assert page.locator('[aria-label="Region and zone annotations"] tbody tr').count() == 3
    upload_template(page, [
        {"id": "discussion", "label": "Discussion", "type": "select", "options": ["Planned", "Discussed"]},
        {"id": "review_by", "label": "Review by", "type": "date"},
        {"id": "remarks", "label": "Remarks <example>", "type": "notes"},
    ])
    page.wait_for_function("MRP.core.S.annotations.fields.length === 4")
    reference = page.get_by_label("Reference for Sweden Central / Region", exact=True)
    reference.fill("Example reference only")
    page.get_by_label("Discussion for Sweden Central / Region", exact=True).select_option("Discussed")
    date = page.get_by_label("Review by for Sweden Central / Region", exact=True)
    date.fill("2027-01-15")
    date.fill("")
    date.press("Tab")
    assert date.input_value() == ""
    date.fill("2027-01-15")
    page.get_by_label("Remarks <example> for Sweden Central / Region", exact=True).fill("<b>Illustrative note</b>\nSecond line")
    assert page.locator(".pl-annotations script").count() == 0
    assert page.locator(".pl-annotations").get_attribute("data-clarity-mask") == "true"

    assert page.get_by_label("Region for zone annotation", exact=True).count() == 0
    assert page.get_by_label("Zone label", exact=True).count() == 0
    assert page.get_by_role("button", name="Add zone row", exact=True).count() == 0
    # Previously saved zone rows remain editable without restoring the zone-entry form.
    page.evaluate("""() => {
      const C = MRP.core, saved = JSON.parse(JSON.stringify(C.S));
      saved.annotations.rows.push({id:'legacyzone', region:'swedencentral', zone:'Logical zone A', values:{}});
      C.replace(saved); MRP.kit.hooks.render();
    }""")
    page.get_by_label("Reference for Sweden Central / Logical zone A", exact=True).fill("Zone-specific example")
    assert page.evaluate("MRP.core.S.annotations.rows.length") == 4
    assert page.evaluate("MRP.core.S.regions.map(r => [r.checks, MRP.core.outcome(r)])") == before

    # Invalid and colliding templates are atomic: neither definitions nor existing values change.
    original = page.evaluate("JSON.stringify(MRP.core.S.annotations)")
    upload_template(page, [{"id": "unused", "label": "Valid", "type": "text"}, {"id": "bad", "label": "Bad", "type": "select", "options": []}])
    page.wait_for_function("document.querySelector('#pl-msg').textContent.includes('Template not imported')")
    assert page.evaluate("JSON.stringify(MRP.core.S.annotations)") == original
    upload_template(page, [{"id": "discussion", "label": "Collision", "type": "text"}])
    page.wait_for_function("document.querySelector('#pl-msg').textContent.includes('unique ID')")
    assert page.evaluate("JSON.stringify(MRP.core.S.annotations)") == original
    assert page.evaluate("""() => {
      const C = MRP.core, rejects = fields => { try { C.annotationFields(fields); return false; } catch { return true; } };
      return rejects([{id:'__proto__', label:'Bad', type:'text'}]) &&
        rejects([{id:'x', label:'X', type:'select', options:['Same','Same']}]) &&
        rejects(Array.from({length:21}, (_,i) => ({id:'f'+i,label:'Field',type:'text'})));
    }""")

    # Templates contain no regional assessments.
    with page.expect_download() as downloaded:
        page.get_by_role("button", name="Download field template", exact=True).click()
    template_path = Path(directory) / "template.json"
    downloaded.value.save_as(template_path)
    template = json.loads(template_path.read_text())
    assert set(template) == {"kind", "version", "fields"}
    assert "Example reference only" not in template_path.read_text()

    # Annotations are included by default, with an explicit opt-out for every output.
    assert page.get_by_role("switch", name=INCLUDE, exact=True).get_attribute("aria-checked") == "true"
    default_plan, _ = saved_json(page, directory)
    assert "annotations" in default_plan
    page.get_by_role("switch", name=INCLUDE, exact=True).click()
    clean, _ = saved_json(page, directory)
    assert "annotations" not in clean
    assert "Example reference only" not in page.evaluate("MRP.core.recordText()")
    assert "Engagement annotations" not in page.evaluate("MRP.workbook().sheets.map(s => s.name)")
    page.reload()
    page.wait_for_selector('#planner[data-ready="1"]')
    assert reference.input_value() == "Example reference only"
    assert page.get_by_label("Reference for Sweden Central / Logical zone A", exact=True).input_value() == "Zone-specific example"
    assert page.get_by_role("button", name="Add zone row", exact=True).count() == 0
    assert page.get_by_label("Review by for Sweden Central / Region", exact=True).input_value() == "2027-01-15"
    page.emulate_media(media="print")
    assert page.locator(".pl-annotations").is_hidden()
    page.emulate_media(media="screen")

    page.locator("#tab-review").click()
    assert page.get_by_role("switch", name=INCLUDE, exact=True).get_attribute("aria-checked") == "true"
    assert "Annotations do not change qualification results." not in page.locator("#pl-panel").inner_text()
    assert page.evaluate("""() => {
      const all = document.querySelector('[aria-label="All regions"]').closest('section');
      const control = document.querySelector('.pl-annotation-export');
      const report = document.querySelector('[aria-label="Engagement annotation report"]').closest('section');
      const map = document.querySelector('.pl-review-map');
      return !!(all.compareDocumentPosition(report) & Node.DOCUMENT_POSITION_FOLLOWING) &&
        report.contains(control) && report.querySelector('h3').textContent === 'Annotations' &&
        !!(report.compareDocumentPosition(map) & Node.DOCUMENT_POSITION_FOLLOWING);
    }""")
    assert "Example reference only" in page.locator('[aria-label="Engagement annotation report"]').inner_text()
    assert page.locator('[aria-label="Engagement annotation report"] b').count() == 0
    assert "Example reference only" in page.evaluate("MRP.core.recordText(MRP.ui.includeAnnotations)")
    full, full_path = saved_json(page, directory)
    assert full["annotations"]["fields"] == template["fields"]
    assert full["annotations"]["rows"][1]["values"]["review_by"] == "2027-01-15"
    with page.expect_download() as downloaded:
        page.locator('.pl-cmd [data-act="export"]').click()
    excel_path = Path(directory) / "annotations.xlsx"
    downloaded.value.save_as(excel_path)
    with zipfile.ZipFile(excel_path) as workbook:
        assert b"Engagement annotations" in workbook.read("xl/workbook.xml")
        assert any(b"Example reference only" in workbook.read(name) for name in workbook.namelist() if name.endswith(".xml"))
    page.emulate_media(media="print")
    assert page.locator('[aria-label="Engagement annotation report"]').is_visible()
    page.emulate_media(media="screen")
    page.get_by_role("switch", name=INCLUDE, exact=True).click()
    with page.expect_download() as downloaded:
        page.locator('.pl-cmd [data-act="export"]').click()
    downloaded.value.save_as(excel_path)
    with zipfile.ZipFile(excel_path) as workbook:
        assert not any(b"Example reference only" in workbook.read(name) for name in workbook.namelist() if name.endswith(".xml"))
    page.emulate_media(media="print")
    assert page.get_by_text("Annotations", exact=True).is_hidden()
    page.emulate_media(media="screen")

    page.locator("#pl-file").set_input_files(str(full_path))
    page.wait_for_function("MRP.ui.includeAnnotations")
    assert page.evaluate("MRP.core.S.annotations.rows.length") == 4
    page.reload()
    page.wait_for_selector('#planner[data-ready="1"]')
    assert page.get_by_role("switch", name=INCLUDE, exact=True).get_attribute("aria-checked") == "true"
    page.goto(f"{base}/region-planner.html#check4-questions")
    page.wait_for_selector('#planner[data-ready="1"]')
    page.get_by_role("button", name="Next: Annotations", exact=True).click()
    assert page.locator(".pl-annotations").is_visible()
    page.get_by_role("button", name="Next: Outcome", exact=True).click()
    page.get_by_role("button", name="Previous: Annotations", exact=True).click()
    assert page.locator(".pl-annotations").is_visible()

    saved_annotations = page.evaluate("JSON.stringify(MRP.core.S.annotations)")
    for substep in ("pricing", "questions", "annotations"):
        page.locator(f'[data-act="evidence"][data-arg="{substep}"]').click()
        page.locator("#tab-capability").click()
        assert page.locator('[data-act="evidence"][data-arg="latency"]').get_attribute("aria-pressed") == "true"
        assert page.url.endswith("#check4-latency")
    page.locator('[data-act="evidence"][data-arg="annotations"]').click()
    page.locator("#tab-scope").click()
    page.locator("#tab-capability").click()
    assert page.evaluate("MRP.ui.capability") == "latency"
    page.set_viewport_size({"width": 390, "height": 900})
    page.locator('[data-act="evidence"][data-arg="pricing"]').click()
    page.locator("#pl-stepsel").select_option("scope")
    page.locator("#pl-stepsel").select_option("capability")
    assert page.evaluate("MRP.ui.capability") == "latency"
    page.goto(f"{base}/region-planner.html#check4-annotations")
    page.wait_for_selector('#planner[data-ready="1"]')
    assert page.locator(".pl-annotations").is_visible()
    assert page.evaluate("JSON.stringify(MRP.core.S.annotations)") == saved_annotations

    for theme in ("light", "dark"):
        page.evaluate("theme => document.documentElement.dataset.theme = theme", theme)
        for width in (390, 1440, 2560):
            page.set_viewport_size({"width": width, "height": 900})
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), (theme, width)
            assert page.get_by_role("button", name="Add field", exact=True).is_visible()
    page.set_viewport_size({"width": 1440, "height": 900})
    page.get_by_role("button", name="Remove Sweden Central / Logical zone A", exact=True).click()
    assert page.evaluate("MRP.core.S.annotations.rows.length") == 4
    page.get_by_role("button", name="Remove Sweden Central / Logical zone A", exact=True).click()
    assert page.evaluate("MRP.core.S.annotations.rows.length") == 3
    page.get_by_role("button", name="Remove field Discussion", exact=True).click()
    page.get_by_role("button", name="Remove field Discussion", exact=True).click()
    assert not page.evaluate("MRP.core.S.annotations.rows.some(r => Object.hasOwn(r.values, 'discussion'))")
    page.evaluate("() => { MRP.core.S.regions = []; MRP.kit.hooks.commit(); }")
    assert page.evaluate("MRP.core.S.annotations.rows.map(r => r.region)") == ["westeurope"]
    page.locator("#pl-file").set_input_files({
        "name": "old-plan.json", "mimeType": "application/json", "buffer": json.dumps(clean).encode(),
    })
    page.wait_for_function("MRP.core.S.annotations.fields.length === 0")
    assert page.get_by_text("No custom fields yet", exact=True).is_visible()


def main():
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0),
        functools.partial(QuietHandler, directory=str(ROOT / "docs")))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        with tempfile.TemporaryDirectory() as directory, sync_playwright() as playwright:
            browser = playwright.chromium.launch()
            page = browser.new_page(viewport={"width": 1440, "height": 900})
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            check_annotations(page, f"http://127.0.0.1:{server.server_port}", directory)
            assert not errors, errors
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
    print("Engagement annotations: fields, templates, zones, persistence, export boundaries, navigation and responsive layout passed.")


if __name__ == "__main__":
    main()
