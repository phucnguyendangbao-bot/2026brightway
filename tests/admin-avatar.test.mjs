import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = relativePath => readFileSync(resolve(root, relativePath), 'utf8');

test('every admin account uses the bundled PDP avatar in public and admin account surfaces', () => {
  const avatarPath = resolve(root, 'assets/images/brand/pdp-admin-avatar.png');
  assert.ok(statSync(avatarPath).size > 0, 'PDP admin avatar asset must be present');

  const nav = read('assets/js/nav-auth.js');
  assert.match(nav, /role === 'admin'[\s\S]*?ADMIN_AVATAR_URL/);
  assert.match(nav, /pdp-admin-avatar\.png/);

  const profile = read('assets/js/profile.js');
  assert.match(profile, /profile\?\.role === 'admin'/);
  assert.match(profile, /pdp-admin-avatar\.png/);

  const adminGuard = read('admin/_guard.js');
  assert.match(adminGuard, /profile\?\.role === 'admin'[\s\S]*?pdp-admin-avatar\.png/);
});

test('teacher and student avatars keep their existing personalized fallback', () => {
  const nav = read('assets/js/nav-auth.js');
  assert.match(nav, /profile\?\.avatar_url \|\| user\.user_metadata\?\.avatar_url/);

  const adminGuard = read('admin/_guard.js');
  assert.match(adminGuard, /: escapeHtml\(initials\)/);
});
