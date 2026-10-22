"""Regression tests for content-complete, bounded endings."""
from array import array
from pathlib import Path
import shutil
import sys
import tempfile
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from verify_audio import final_hold, trailing_silence, verify


class EndingTests(unittest.TestCase):
    def test_original_long_hold_rejected_independently_of_stream_duration(self):
        with self.assertRaisesRegex(ValueError, 'exceeds limit'):
            final_hold(60 * 48000, 2034332, 2)

    def test_exact_limit_one_sample_over_and_truncated_speech(self):
        self.assertEqual(final_hold(3 * 48000, 48000, 2), 2)
        for total in (3 * 48000 + 1, 47999):
            with self.assertRaises(ValueError): final_hold(total, 48000, 2)

    def test_decoded_silence_is_measured_without_captions(self):
        audio = array('h', [1000, -1000] * 48000 + [0, 0] * 72000)
        self.assertEqual(trailing_silence(audio), 1.5)
        self.assertEqual(trailing_silence(array('h', [0, 0] * 48000)), 1)

    def test_current_film_preserves_all_speech(self):
        r = verify(Path('examples/ddos-capacity'))
        self.assertEqual(r['audioFrames'], 2112000)
        self.assertEqual(r['sentences'], 15)
        self.assertEqual(r['gaps'], [16800] * 14)
        self.assertAlmostEqual(r['finalHoldSeconds'], 1.6180833333333333)

    def test_html_mismatch_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d)
            for name in ('film.json', 'captions.json', 'index.html'):
                shutil.copyfile(Path('examples/ddos-capacity') / name, p / name)
            html = p / 'index.html'
            html.write_text(html.read_text().replace('data-duration="44"', 'data-duration="60"'))
            with self.assertRaisesRegex(ValueError, 'HTML duration'):
                verify(p)


if __name__ == '__main__': unittest.main()
