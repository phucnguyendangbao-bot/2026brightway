import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const schools = JSON.parse(readFileSync(join(root, 'assets/data/schools.json'), 'utf8'));
const logoRegistry = readFileSync(join(root, 'assets/js/uni-logos.js'), 'utf8');

const expectedLogos = {
  vlu: 'assets/images/logos/vlu-official.svg',
  huemed: 'assets/images/logos/huemedu-official.png',
  due: 'assets/images/logos/due-official.png',
};

test('verified university logos are mapped consistently and exist', () => {
  for (const [schoolId, logoPath] of Object.entries(expectedLogos)) {
    const school = schools.find((entry) => entry.id === schoolId);
    assert.ok(school, `Missing school data for ${schoolId}`);
    assert.equal(school.logoUrl, logoPath);
    assert.ok(logoRegistry.includes(`logoLocal: '${logoPath}'`), `${schoolId} registry is out of sync`);

    const absoluteLogoPath = join(root, logoPath);
    assert.ok(existsSync(absoluteLogoPath), `Missing logo asset: ${logoPath}`);
    assert.ok(statSync(absoluteLogoPath).size > 100, `Logo asset is unexpectedly empty: ${logoPath}`);
  }
});

test('known incorrect logo assets are no longer referenced', () => {
  const serializedSchools = JSON.stringify(schools);
  for (const stalePath of [
    'assets/images/logos/vlu.png',
    'assets/images/logos/huemedu.jpg',
    'assets/images/logos/due.png',
  ]) {
    assert.equal(serializedSchools.includes(stalePath), false, `${stalePath} is still referenced in school data`);
    assert.equal(logoRegistry.includes(`logoLocal: '${stalePath}'`), false, `${stalePath} is still in the logo registry`);
  }
});
