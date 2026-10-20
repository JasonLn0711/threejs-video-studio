import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { PNG } from 'pngjs';
const [nativeFile, encodedFile, output] = process.argv.slice(2);
if (!output) throw new Error('Usage: node scripts/compare-encoded.mjs NATIVE_REPORT ENCODED_REPORT OUTPUT_JSON');
const native = JSON.parse(await fs.readFile(nativeFile)), encoded = JSON.parse(await fs.readFile(encodedFile));
const hash = b => createHash('sha256').update(b).digest('hex');
const tolerance = { meanAbsoluteChannelError: 8, fractionPixelsWithChannelErrorOver40: .02 };
const frames = [];
for (const frame of [0, 60, 120, 300, 420, 600, 810, 1020, 1320, 1500, 1650, 1799]) {
  const ref = native.captures.find(x => x.frame === frame), sample = encoded.samples.find(x => x.frame === frame);
  const aBytes = await fs.readFile(path.join(path.dirname(nativeFile), ref.file));
  const bBytes = await fs.readFile(path.join(path.dirname(encodedFile), sample.file));
  if (hash(aBytes) !== ref.sha256 || hash(bBytes) !== sample.sha256) throw new Error('Capture hash mismatch');
  const a = PNG.sync.read(aBytes), b = PNG.sync.read(bBytes);
  if (a.width !== b.width || a.height !== b.height) throw new Error('Dimension mismatch');
  let total = 0, changed = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    let max = 0;
    for (let j = 0; j < 3; j++) { const d = Math.abs(a.data[i+j] - b.data[i+j]); total += d; max = Math.max(max, d); }
    if (max > 40) changed++;
  }
  const mae = total / (a.width*a.height*3), fraction = changed / (a.width*a.height);
  frames.push({ frame, nativeSha256: ref.sha256, encodedSha256: sample.sha256, meanAbsoluteChannelError: mae,
    fractionPixelsWithChannelErrorOver40: fraction, passed: mae <= tolerance.meanAbsoluteChannelError && fraction <= tolerance.fractionPixelsWithChannelErrorOver40 });
}
const report = { status: frames.every(f => f.passed) ? 'passed' : 'failed', videoSha256: encoded.videoSha256,
  method: 'Decoded RGB channels 0..255, no registration or masking, 12 preselected native/encoded frames. Tolerances declared before measurement.', tolerance, frames };
await fs.writeFile(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
if (report.status !== 'passed') process.exitCode = 1;
