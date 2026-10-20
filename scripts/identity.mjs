import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { root } from './build.mjs';
export const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export async function fileHash(file) { return sha(await fs.readFile(file)); }
async function list(dir) {
  const files = [];
  for (const ent of await fs.readdir(path.join(root, dir), { withFileTypes: true })) {
    const rel = path.join(dir, ent.name);
    if (ent.isSymbolicLink()) throw new Error(`Symlink in render sources: ${rel}`);
    if (ent.isDirectory()) files.push(...await list(rel));
    else files.push(rel);
  }
  return files;
}
export async function visualIdentity() {
  const files = ['package-lock.json', 'scripts/build.mjs', 'examples/ddos-capacity/index.html',
    'examples/ddos-capacity/film.json', 'examples/ddos-capacity/captions.json',
    'examples/ddos-capacity/assets/audio/narration.wav',
    ...await list('src'), ...await list('examples/ddos-capacity/assets/fonts')].sort();
  const hashes = Object.fromEntries(await Promise.all(files.map(async f => [f, await fileHash(path.join(root, f))])));
  return { key: sha(JSON.stringify(hashes)), hashes };
}
export async function renderIdentity() {
  const visual = await visualIdentity();
  const hashes = { ...visual.hashes, 'scripts/render-exec.mjs': await fileHash(path.join(root, 'scripts/render-exec.mjs')) };
  return { key: sha(JSON.stringify(hashes)), hashes };
}
export async function qaIdentity() {
  return sha(JSON.stringify({ render: (await visualIdentity()).key,
    qa: await fileHash(path.join(root, 'scripts/browser-qa.mjs')) }));
}
