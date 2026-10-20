import { build } from 'esbuild';
import { mkdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export async function compile() {
  const project = path.join(root, 'examples/ddos-capacity');
  await access(path.join(project, 'captions.json'));
  await mkdir(path.join(project, 'dist'), { recursive: true });
  await build({ entryPoints: [path.join(root, 'src/scene.ts')], bundle: true, format: 'esm',
    target: 'es2022', outfile: path.join(project, 'dist/scene.js'), minify: false,
    sourcemap: false, legalComments: 'linked' });
  console.error('build | local Three.js bundle ready');
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await compile();
