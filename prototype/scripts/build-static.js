// Builds the browser-only version of the demo into dist/. The result is a
// plain folder of files that any static host can serve (a hosted link,
// GitHub Pages and so on). It always runs in mock mode.

import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, 'dist');

await rm(DIST, { recursive: true, force: true });
await mkdir(DIST, { recursive: true });
await cp(join(ROOT, 'public'), DIST, { recursive: true });
await cp(join(ROOT, 'photos'), join(DIST, 'photos'), { recursive: true });
await mkdir(join(DIST, 'lib'));
for (const file of ['walgreens.js', 'mock-walgreens.js', 'orders.js']) {
  await cp(join(ROOT, 'lib', file), join(DIST, 'lib', file));
}
await mkdir(join(DIST, 'data'));
await cp(join(ROOT, 'data', 'photos.json'), join(DIST, 'data', 'photos.json'));

console.log(`Built the browser-only demo in ${DIST}`);
