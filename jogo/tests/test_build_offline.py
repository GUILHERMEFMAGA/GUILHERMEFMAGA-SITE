import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from jogo import build_offline


class OfflineBundleWriterTests(unittest.TestCase):
    def test_replaces_existing_bundle_after_complete_write(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "game.html"
            output.write_text("previous bundle", encoding="utf-8")
            original_mode = output.stat().st_mode & 0o777

            build_offline.write_atomically(output, "complete bundle")

            self.assertEqual(output.read_text(encoding="utf-8"), "complete bundle")
            self.assertEqual(output.stat().st_mode & 0o777, original_mode)
            self.assertEqual(list(Path(directory).iterdir()), [output])

    def test_failed_write_preserves_existing_bundle_and_cleans_temporary_file(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "game.html"
            output.write_text("previous bundle", encoding="utf-8")

            with patch.object(build_offline.os, "fsync", side_effect=OSError("simulated disk failure")):
                with self.assertRaisesRegex(RuntimeError, "Cannot safely write offline game bundle"):
                    build_offline.write_atomically(output, "incomplete bundle")

            self.assertEqual(output.read_text(encoding="utf-8"), "previous bundle")
            self.assertEqual(list(Path(directory).iterdir()), [output])


if __name__ == "__main__":
    unittest.main()
