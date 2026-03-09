from __future__ import annotations

import unittest

from runninghub_client import RunningHubClient, mask_api_key


class RunningHubClientTest(unittest.TestCase):
    def test_should_build_headers(self) -> None:
        client = RunningHubClient("1234567890abcdef")
        headers = client._headers()
        self.assertEqual(headers["Host"], "www.runninghub.cn")
        self.assertTrue(headers["Authorization"].startswith("Bearer "))
        self.assertEqual(headers["Content-Type"], "application/json")

    def test_should_mask_api_key(self) -> None:
        masked = mask_api_key("1234567890abcdef")
        self.assertEqual(masked[:4], "1234")
        self.assertEqual(masked[-4:], "cdef")
        self.assertIn("*", masked)


if __name__ == "__main__":
    unittest.main()
