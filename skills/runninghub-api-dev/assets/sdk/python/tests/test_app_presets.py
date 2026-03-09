from __future__ import annotations

import unittest

from app_presets import APP_PRESETS, build_app_overrides, list_supported_app_ids


class AppPresetsTest(unittest.TestCase):
    def test_should_list_four_apps(self) -> None:
        self.assertEqual(len(list_supported_app_ids()), 4)

    def test_should_build_overrides_for_floor_plan_app(self) -> None:
        overrides = build_app_overrides(
            "1994388299756212225",
            uploaded_assets=["openapi/demo-floorplan.png"],
            prompt="test prompt",
        )

        self.assertEqual(overrides["257:image"], "openapi/demo-floorplan.png")
        self.assertEqual(overrides["253:text"], "test prompt")
        self.assertEqual(overrides["260:width"], "1600")

    def test_should_require_enough_assets(self) -> None:
        preset = APP_PRESETS["1986819253754130433"]
        self.assertEqual(len(preset.input_keys), 2)
        with self.assertRaises(ValueError):
            build_app_overrides(
                "1986819253754130433",
                uploaded_assets=["openapi/only-one.png"],
            )


if __name__ == "__main__":
    unittest.main()
