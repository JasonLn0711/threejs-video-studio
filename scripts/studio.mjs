import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { stripVTControlCharacters } from 'node:util';
import { root, compile } from './build.mjs';
import { renderIdentity, qaIdentity, fileHash } from './identity.mjs';
import { encode } from './render-exec.mjs';
const command = process.argv[2];
if (!['preview', 'check', 'render', 'package'].includes(command)) throw new Error('Use preview, check, render or package');
const project = path.join(root, 'examples/ddos-capacity');
const output = path.resolve(process.env.STUDIO_OUTPUT || path.join(root, 'output'));
const runId = new Date().toISOString().replaceAll(/[:.]/g, '-') + '-' + command;
const run = path.join(root, 'qa/runs', runId), start = performance.now();
await fs.mkdir(run, { recursive: true }); await fs.mkdir(output, { recursive: true });
const hf = path.join(root, 'node_modules/.bin/hyperframes');
const eventFile = path.join(run, 'events.jsonl');
let active = null, cancelled = false;
const event = async (stage, status, more = {}) => {
  const row = { runId, at: new Date().toISOString(), elapsedSeconds: (performance.now() - start) / 1000, stage, status, ...more };
  await fs.appendFile(eventFile, JSON.stringify(row) + '\n');
  process.stderr.write(`${stage} | ${status}${more.exitCode !== undefined ? ' | exit=' + more.exitCode : ''}\n`);
};
function cancel() {
  cancelled = true;
  if (active) {
    try { process.platform === 'win32' ? active.kill('SIGTERM') : process.kill(-active.pid, 'SIGTERM'); } catch {}
  }
}
process.on('SIGINT', cancel); process.on('SIGTERM', cancel);
const echoChunk = x => process.stderr.write(process.stderr.isTTY ? x : stripVTControlCharacters(x.toString()));
async function child(stage, executable, args, cwd = root, echo = true) {
  if (cancelled) throw new Error('cancelled');
  await event(stage, 'started');
  let stdout = '', stderr = '';
  const exitCode = await new Promise((resolve, reject) => {
    active = spawn(executable, args, { cwd, env: { ...process.env,
      HYPERFRAMES_BROWSER_PATH: process.env.HYPERFRAMES_BROWSER_PATH || chromium.executablePath()
    }, detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'] });
    active.stdout.on('data', x => { stdout += x; if (echo) echoChunk(x); });
    active.stderr.on('data', x => { stderr += x; if (echo) echoChunk(x); });
    active.on('error', reject); active.on('close', resolve);
  });
  active = null;
  await fs.writeFile(path.join(run, stage + '.stdout.log'), stdout);
  await fs.writeFile(path.join(run, stage + '.stderr.log'), stderr);
  await event(stage, exitCode === 0 ? 'finished' : 'failed', { exitCode });
  if (exitCode !== 0 || cancelled) throw new Error(`${stage}: ${cancelled ? 'cancelled' : 'exit ' + exitCode}; diagnostics in qa/runs/${runId}`);
  return stdout;
}
let summary = { runId, command, status: 'failed' };
try {
  if (command !== 'package') await compile();
  if (command === 'preview') {
    await child('preview', hf, ['preview', '--background', '--port', '3047'], project);
  } else if (command === 'check') {
    const identity = await qaIdentity();
    await child('audio-timing', 'python3', ['scripts/verify_audio.py']);
    await child('types', path.join(root, 'node_modules/.bin/tsc'), ['--noEmit']);
    await child('tests', process.execPath, ['--test', 'tests/traffic.test.mjs', 'tests/events.test.mjs']);
    const raw = await child('hyperframes-check', hf, ['check', '--json', '--samples', '13'], project, false);
    const native = JSON.parse(raw);
    if (!native.ok || native.browserSkipped) throw new Error('Native HyperFrames gate did not pass');
    const browserOut = await child('browser', process.execPath, ['scripts/browser-qa.mjs']);
    const result = JSON.parse(browserOut.trim().split('\n').at(-1));
    if (result.status !== 'passed') throw new Error('Browser QA failed');
    if (identity !== await qaIdentity()) throw new Error('Source changed during QA');
    const gate = { status: 'passed', identity, run: path.relative(root, run), browserRun: result.run,
      nativeCheck: 'passed', createdAt: new Date().toISOString() };
    await fs.writeFile(path.join(root, 'qa/latest-check.json'), JSON.stringify(gate, null, 2) + '\n');
    summary.gate = gate;
  } else if (command === 'render') {
    const gate = JSON.parse(await fs.readFile(path.join(root, 'qa/latest-check.json'), 'utf8'));
    if (gate.status !== 'passed' || gate.identity !== await qaIdentity()) throw new Error('Missing or stale check; run npm run check');
    const identity = await renderIdentity(), target = path.join(output, 'ddos-capacity.mp4');
    const receiptFile = path.join(output, 'render-receipt.json');
    let cached;
    try { cached = JSON.parse(await fs.readFile(receiptFile, 'utf8')); } catch {}
    if (cached?.identity === identity.key && cached.sha256 === await fileHash(target).catch(() => null)) {
      await event('render', 'verified-cache-hit'); summary.reused = true;
    } else {
      await child('usage', hf, ['usage', '--json'], project);
      await encode({ child, hf, project, output });
      if ((await renderIdentity()).key !== identity.key) throw new Error('Source changed during render');
      await fs.writeFile(receiptFile, JSON.stringify({ identity: identity.key, sha256: await fileHash(target),
        runId, source: identity.hashes, settings: { fps: 30, workers: 1, quality: 'delivery', browserGpu: true } }, null, 2) + '\n');
    }
    summary.artifact = target;
  } else {
    await child('package', 'python3', ['scripts/package.py', '--output', output]);
  }
  summary.status = 'passed';
} catch (e) {
  summary.status = cancelled ? 'cancelled' : 'failed'; summary.error = e.message;
  process.exitCode = 1;
} finally {
  summary.elapsedSeconds = (performance.now() - start) / 1000;
  await fs.writeFile(path.join(run, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
  await event(command, summary.status);
  console.log(JSON.stringify(summary));
}
