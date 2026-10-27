import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

test('every raster school logo has a bundled thumbnail and originals remain available', () => {
  const root = fileURLToPath(new URL('../assets/images/logos/', import.meta.url));
  const raster = fs.readdirSync(root).filter(name => /\.(?:png|jpe?g)$/i.test(name));
  let originals = 0, thumbnails = 0;
  for (const name of raster) {
    const small = name.replace(/\.(png|jpe?g)$/i,'-$1.webp');
    const originalPath = path.join(root,name);
    const smallPath = path.join(root,'thumbs',small);
    assert.ok(fs.existsSync(smallPath),`Missing thumbnail for ${name}`);
    originals += fs.statSync(originalPath).size;
    thumbnails += fs.statSync(smallPath).size;
  }
  assert.equal(raster.length,48);
  assert.ok(thumbnails < originals * 0.1,`${thumbnails} bytes should be much smaller than ${originals}`);
});
