from __future__ import annotations

import unittest

from quick_create_client import apply_node_overrides


class ApplyNodeOverridesTest(unittest.TestCase):
    def test_should_override_existing_nodes(self) -> None:
        source = [
            {"nodeId": "1", "fieldName": "image", "fieldValue": "a.jpg"},
            {"nodeId": "2", "fieldName": "text", "fieldValue": "hello"},
        ]

        result = apply_node_overrides(
            source,
            {
                "1:image": "b.jpg",
                "2:text": "world",
            },
        )

        self.assertEqual(result[0]["fieldValue"], "b.jpg")
        self.assertEqual(result[1]["fieldValue"], "world")
        self.assertEqual(source[0]["fieldValue"], "a.jpg")

    def test_should_raise_when_node_missing(self) -> None:
        source = [{"nodeId": "1", "fieldName": "image", "fieldValue": "a.jpg"}]

        with self.assertRaises(KeyError):
            apply_node_overrides(source, {"9:image": "b.jpg"})


if __name__ == "__main__":
    unittest.main()
