// Rebuild an extracted archive and compare actual native seek captures.
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';
const [restoredArg, goldenArg, receiptArg] = process.argv.slice(2);
if (!receiptArg) throw new Error('Usage: node scripts/restore-check.mjs EXTRACTED_ROOT GOLDEN_REPORT RECEIPT');
const restored = path.resolve(restoredArg), golden = JSON.parse(await fs.readFile(goldenArg, 'utf8'));
const hash = x => createHash('sha256').update(x).digest('hex');
for (const args of [['ci', '--ignore-scripts', '--no-audit', '--no-fund'], ['run', 'build']]) {
  process.stderr.write(`restore | npm ${args.join(' ')}\n`);
  const p = spawnSync('npm', args, { cwd: restored, encoding: 'utf8' });
  process.stderr.write(p.stdout || ''); process.stderr.write(p.stderr || '');
  if (p.status !== 0) throw new Error(`Restore command failed: ${args.join(' ')}`);
}
const project = path.join(restored, 'examples/ddos-capacity');
const runtime = await fs.readFile(path.join(restored, 'node_modules/hyperframes/dist/hyperframe-runtime.js'));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.ttf': 'font/ttf', '.wav': 'audio/wav' };
const server = http.createServer(async (req, res) => {
  try {
    const url = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (url === '/__runtime.js') { res.setHeader('Content-Type', 'text/javascript'); return res.end(runtime); }
    const file = path.resolve(project, '.' + (url === '/' ? '/index.html' : url));
    if (!file.startsWith(project + path.sep)) { res.statusCode = 403; return res.end(); }
    let data = await fs.readFile(file);
    if (file.endsWith('index.html')) data = Buffer.from(data.toString().replace('</body>', '<script src="/__runtime.js"></script></body>'));
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream'); res.end(data);
  } catch { res.statusCode = 404; res.end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
let browser;
const receipt = { status: 'failed', scope: 'Clean npm install, rebuild and three native-seek pixel comparisons on the original machine; not a second full MP4 render or cross-platform certification.', runtimeHash: hash(runtime), frames: [] };
try {
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=gl-egl', '--ignore-gpu-blocklist', '--font-render-hinting=none', '--force-color-profile=srgb', '--force-device-scale-factor=1'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:${server.address().port}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.studio && window.__player?.renderSeek);
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all(Object.values(window.__hf?.buildReady || {})); window.__player.pause(); });
  for (const frame of [0, 600, 1020]) {
    await page.evaluate(async f => { await window.__player.renderSeek(f / 30, { exact: true }); await window.__hfWaitForSeekCompletion?.(); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); }, frame);
    const actual = hash(await page.screenshot()), expected = golden.captures.find(x => x.frame === frame).sha256;
    receipt.frames.push({ frame, actual, expected, passed: actual === expected });
  }
  receipt.status = receipt.frames.every(f => f.passed) && hash(runtime) === golden.runtimeHash ? 'passed' : 'failed';
} catch (e) { receipt.error = e.message; }
finally { await browser?.close(); server.close(); await fs.writeFile(receiptArg, JSON.stringify(receipt, null, 2) + '\n'); }
console.log(JSON.stringify(receipt));
if (receipt.status !== 'passed') process.exitCode = 1;
