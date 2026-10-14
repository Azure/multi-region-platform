import json
import sys
from pathlib import Path
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from scrape_product_availability import parse_page


class ProductAvailabilityTests(unittest.TestCase):
    def test_parses_embedded_records_and_statuses(self):
        records = []
        for index in range(20):
            region = f"Region {index}"
            state = ["GA", "Preview", "Closing Down"][index] if index < 3 else "GA"
            records.append(
                {
                    "RegionName": region,
                    "GeographyName": "Test Geography",
                    "OfferingName": "Compute",
                    "ProductSkuName": "",
                    "CurrentState": state,
                }
            )
            records.append(
                {
                    "RegionName": region,
                    "GeographyName": "Test Geography",
                    "OfferingName": "Compute",
                    "ProductSkuName": "Virtual Machines",
                    "CurrentState": state,
                }
            )
        records.extend(
            {
                "RegionName": f"Region {index % 20}",
                "GeographyName": "Test Geography",
                "OfferingName": f"Service {index}",
                "ProductSkuName": "",
                "CurrentState": "GA",
            }
            for index in range(100)
        )
        records.extend([records[0]] * (1000 - len(records)))
        html = f"<script>const data = {json.dumps(records)};</script>"

        regions, rows = parse_page(html)

        self.assertEqual(len(regions), 20)
        self.assertEqual(len(rows), 102)
        product = next(row for row in rows if row["product"] == "Compute" and row["type"] == "product")
        sku = next(row for row in rows if row["sku"] == "Virtual Machines")
        self.assertEqual(product["regions"]["Region 0"], "generally_available")
        self.assertEqual(product["regions"]["Region 1"], "public_preview")
        self.assertEqual(product["regions"]["Region 2"], "retiring")
        self.assertEqual(sku["regions"]["Region 0"], "generally_available")

    def test_rejects_unrecognized_table_shape(self):
        with self.assertRaisesRegex(ValueError, "embedded availability dataset"):
            parse_page("<table><tr><td>Other content</td></tr></table>")


if __name__ == "__main__":
    unittest.main()
