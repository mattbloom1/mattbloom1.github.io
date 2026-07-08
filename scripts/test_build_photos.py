#!/usr/bin/env python3
import tempfile
import unittest
from pathlib import Path

from PIL import Image

import build_photos


class TestNormalize(unittest.TestCase):
    def test_strips_edit_suffix(self):
        self.assertEqual(build_photos.normalize("Kitchen 2-Edit.jpg"), build_photos.normalize("Kitchen 2.jpg"))

    def test_strips_upscale_suffix(self):
        # Regression: AI-upscaled edits must match their raw counterpart.
        self.assertEqual(
            build_photos.normalize("living room 1 upscale.png"),
            build_photos.normalize("Living Room 1.jpg"),
        )

    def test_ignores_trailing_space_or_underscore(self):
        self.assertEqual(build_photos.normalize("Bathroom 3_.jpg"), build_photos.normalize("Bathroom 3 .jpg"))


class TestSlugify(unittest.TestCase):
    def test_basic_slug(self):
        self.assertEqual(build_photos.slugify("120 East 75th"), "120-east-75th")

    def test_mixed_case_and_digits(self):
        self.assertEqual(build_photos.slugify("565 WEA 10E"), "565-wea-10e")


class TestNiceLabel(unittest.TestCase):
    def test_title_cases_plain_name(self):
        self.assertEqual(build_photos.nice_label("bath"), "Bath")

    def test_strips_edit_suffix(self):
        self.assertEqual(build_photos.nice_label("Bathroom-Edit"), "Bathroom")

    def test_strips_upscale_suffix(self):
        # Regression: label should read "Living Room 1", not "Living Room 1 Upscale".
        self.assertEqual(build_photos.nice_label("living room 1 upscale"), "Living Room 1")


class TestBuildPairs(unittest.TestCase):
    def test_pairs_matching_raw_and_edited(self):
        photos, warnings = build_photos.build_pairs(["Living Room.jpg"], ["Living Room-Edit.jpg"])
        self.assertEqual(warnings, [])
        self.assertEqual(len(photos), 1)
        self.assertEqual(photos[0]["label"], "Living Room")
        self.assertEqual(photos[0]["raw_name"], "Living Room.jpg")
        self.assertEqual(photos[0]["edited_name"], "Living Room-Edit.jpg")

    def test_pairs_upscaled_edit_with_raw(self):
        photos, warnings = build_photos.build_pairs(["Living Room 1.jpg"], ["living room 1 upscale.png"])
        self.assertEqual(warnings, [])
        self.assertEqual(len(photos), 1)
        self.assertEqual(photos[0]["label"], "Living Room 1")
        self.assertEqual(photos[0]["raw_name"], "Living Room 1.jpg")
        self.assertEqual(photos[0]["edited_name"], "living room 1 upscale.png")

    def test_raw_only_and_edited_only_entries(self):
        photos, warnings = build_photos.build_pairs(["Kitchen 3 .jpg"], ["Bathroom-Edit.jpg"])
        self.assertEqual(warnings, [])
        self.assertEqual(len(photos), 2)
        by_label = {p["label"]: p for p in photos}
        self.assertIsNone(by_label["Kitchen 3"]["edited_name"])
        self.assertIsNone(by_label["Bathroom"]["raw_name"])

    def test_collision_keeps_alphabetically_first_and_warns(self):
        # Regression: 106 CPS had "Living Room 2 .jpg" and "Living room 2.jpg",
        # which both normalize to "living room 2".
        photos, warnings = build_photos.build_pairs(["Living Room 2 .jpg", "Living room 2.jpg"], [])
        self.assertEqual(len(photos), 1)
        self.assertEqual(photos[0]["raw_name"], "Living Room 2 .jpg")
        self.assertEqual(len(warnings), 1)
        self.assertIn("Living Room 2 .jpg", warnings[0])
        self.assertIn("Living room 2.jpg", warnings[0])
