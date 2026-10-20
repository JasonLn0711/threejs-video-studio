import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { root, compile } from './build.mjs';
const project = path.resolve(process.env.STUDIO_PROJECT || path.join(root, 'examples/ddos-capacity'));
const runId = new Date().toISOString().replaceAll(/[:.]/g, '-') + '-browser';
const out = path.join(root, 'qa/runs', runId);
await fs.mkdir(out, { recursive: true });
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.ttf': 'font/ttf', '.wav': 'audio/wav' };
const runtime = await fs.readFile(path.join(root, 'node_modules/hyperframes/dist/hyperframe-runtime.js'));
const hash = b => createHash('sha256').update(b).digest('hex');
await compile();
const server = http.createServer(async (req, res) => {
  try {
    const url = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (url === '/__runtime.js') { res.setHeader('content-type', 'text/javascript'); return res.end(runtime); }
    const file = path.resolve(project, '.' + (url === '/' ? '/index.html' : url));
    if (!file.startsWith(project + path.sep)) { res.statusCode = 403; return res.end(); }
    let data = await fs.readFile(file);
    if (file.endsWith('index.html')) data = Buffer.from(data.toString().replace('</body>', '<script src="/__runtime.js"></script></body>'));
    res.setHeader('content-type', mime[path.extname(file)] || 'application/octet-stream');
    res.end(data);
  } catch { res.statusCode = 404; res.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=gl-egl', '--ignore-gpu-blocklist', '--font-render-hinting=none', '--force-color-profile=srgb', '--force-device-scale-factor=1'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
const failures = [], consoleErrors = [];
page.on('pageerror', e => consoleErrors.push(e.message));
let report = { runId, status: 'failed', runtimeHash: hash(runtime), captures: [], failures, consoleErrors };
try {
  await page.goto(`http://127.0.0.1:${port}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.studio && window.__player?.renderSeek, { timeout: 45000 });
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all(Object.values(window.__hf?.buildReady || {})); });
  await page.evaluate(() => window.__player.pause());
  const seek = async frame => {
    await page.evaluate(async f => {
      await window.__player.renderSeek(f / 30, { exact: true });
      await window.__hfWaitForSeekCompletion?.();
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }, frame);
  };
  const film = JSON.parse(await fs.readFile(path.join(project, 'film.json'), 'utf8'));
  const boundaries = film.beats.slice(1).map(b => Math.round(b.start * film.fps));
  const incidents = await page.evaluate(() => window.studio.inspect().incidentCues);
  const eventFrames = incidents.events.flatMap(e => [e.start - 1, e.start, e.start + 6, e.start + 12, e.end - 1, e.end]);
  const repeats = [1020, 60, 1799, 0, 810, ...incidents.events.map(e => e.start + 6)];
  const frames = [...new Set([0, 60, 120, 300, 420, 600, 810, 1020, 1320, 1500, 1650, 1799,
    incidents.warningFrame, ...eventFrames, ...boundaries.flatMap(f => [f - 1, f, f + 1])])].sort((a, b) => a - b);
  for (const frame of frames) {
    await seek(frame);
    const state = await page.evaluate(() => window.studio.inspect());
    if (state.frame !== frame) failures.push({ kind: 'native-seek', frame, actual: state.frame });
    const file = `frame-${String(frame).padStart(4, '0')}.png`;
    const bytes = await page.screenshot({ path: path.join(out, file) });
    report.captures.push({ frame, file, sha256: hash(bytes), ...state });
  }
  for (const frame of repeats) {
    await seek(frame);
    const bytes = await page.screenshot();
    const expected = report.captures.find(c => c.frame === frame).sha256;
    if (hash(bytes) !== expected) {
      await fs.writeFile(path.join(out, `repeat-${frame}.png`), bytes);
      failures.push({ kind: 'repeat-seek-pixels', frame });
    }
  }
  // All-frame geometry checks read pure scene state. Native seeking is checked
  // above independently; this loop does not substitute for that integration.
  const allFrames = await page.evaluate(() => {
    const issues = [], results = [];
    for (let f = 0; f < 1800; f++) {
      window.studio.renderAt(f);
      const state = window.studio.inspect();
      for (const b of state.objects) if (!b.visibleDepth || b.minX < 40 || b.maxX > 1040 || b.minY < 565 || b.maxY > 1305)
        issues.push({ kind: '3d-object-bounds', frame: f, object: b });
      for (const id of ['eyebrow', 'headline', 'detail', 'caption', ...(state.incident ? ['incident', 'incident-title', 'incident-detail'] : [])]) {
        const el = document.getElementById(id), box = el.getBoundingClientRect();
        if (box.x < 90 || box.right > 900 || box.y < 240 || box.bottom > 1480 ||
            el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1) issues.push({ kind: 'text-bounds', frame: f, id,
              height: el.clientHeight, scrollHeight: el.scrollHeight, bottom: box.bottom });
      }
      if (f % 30 === 0) results.push({ frame: f, calls: state.drawCalls, triangles: state.triangles });
    }
    return { issues, results };
  });
  failures.push(...allFrames.issues);
  if (consoleErrors.length) failures.push({ kind: 'console-errors', count: consoleErrors.length });
  report = { ...report, status: failures.length ? 'failed' : 'passed',
    captureProfile: 'HyperFrames-compatible gl-egl, font-render-hinting=none, sRGB, deviceScaleFactor=1',
    browser: browser.version(), gpu: report.captures[0].gpu, checkedFrames: 1800,
    nativeSeekSamples: frames.length, repeatSeekSamples: repeats.length, frameMetrics: allFrames.results };
} catch (e) { failures.push({ kind: 'runtime', message: e.message }); }
finally {
  await browser.close(); server.close();
  await fs.writeFile(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ status: report.status, run: path.relative(root, out), gpu: report.gpu,
    failures: failures.slice(0, 8), totalFailures: failures.length }));
}
if (report.status !== 'passed') process.exitCode = 1;
