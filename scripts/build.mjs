import { build } from 'esbuild';
import { mkdir, access, readFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export async function compile(project = path.join(root, 'examples/ddos-capacity')) {
  project = path.resolve(project);
  const film = JSON.parse(await readFile(path.join(project, 'film.json'), 'utf8'));
  await access(path.join(project, 'captions.json'));
  await mkdir(path.join(project, 'dist'), { recursive: true });
  await build({ entryPoints: [path.join(root, film.entry || 'src/scene.ts')], bundle: true, format: 'esm',
    target: 'es2022', outfile: path.join(project, 'dist/scene.js'), minify: false,
    sourcemap: false, legalComments: 'linked' });
  console.error('build | local Three.js bundle ready');
  if (film.profile === 'cinematic-short-v1' && film.review?.mode !== 'final_only' && film.approval?.fullRender !== 'approved') {
    await mkdir(path.join(project, 'proof/dist'), { recursive: true });
    await copyFile(path.join(project, 'dist/scene.js'), path.join(project, 'proof/dist/scene.js'));
    await copyFile(path.join(project, 'dist/scene.js.LEGAL.txt'), path.join(project, 'proof/dist/scene.js.LEGAL.txt')).catch(e => { if (e.code !== 'ENOENT') throw e; });
  }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const at = process.argv.indexOf('--project');
  if (at >= 0 && (!process.argv[at + 1] || process.argv[at + 1].startsWith('--'))) throw new Error('--project requires a path');
  await compile(at < 0 ? undefined : process.argv[at + 1]);
}
