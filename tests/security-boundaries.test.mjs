import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { allowedBrowserOrigin, bodyTooLarge } from '../api/_request-guards.js';

test('AI endpoints accept their own browser origin and reject an unrelated site', () => {
  const req = origin => ({ headers: { host: 'pdp-brightway-careers.vercel.app', origin } });
  assert.equal(allowedBrowserOrigin(req('https://pdp-brightway-careers.vercel.app')).allowed, true);
  assert.equal(allowedBrowserOrigin(req('https://another-site.example')).allowed, false);
  assert.equal(allowedBrowserOrigin(req('https://another-site.example'), '*').allowed, false);
  assert.equal(allowedBrowserOrigin(req('https://another-site.example'), 'https://another-site.example').allowed, true);
  assert.equal(allowedBrowserOrigin(req('null')).allowed, false);
  assert.equal(allowedBrowserOrigin({ headers: { host: 'pdp-brightway-careers.vercel.app' } }).allowed, true);
  assert.equal(allowedBrowserOrigin({ headers: { host: 'localhost:3000', origin: 'http://localhost:3000' } }).allowed, true);
});

test('AI payload cap checks both declared and parsed request size', () => {
  assert.equal(bodyTooLarge({headers:{'content-length':'140000'}},128*1024),true);
  assert.equal(bodyTooLarge({headers:{},body:{content:'x'.repeat(16001)}},32*1024),false);
  assert.equal(bodyTooLarge({headers:{},body:{content:'x'.repeat(33000)}},32*1024),true);
  assert.equal(bodyTooLarge({headers:{},body:'x'.repeat(33000)},32*1024),true);
});

test('AI handlers reject foreign browser origins and oversized requests before upstream calls', async () => {
  process.env.ANTHROPIC_API_KEY = 'test-only-key';
  const [{default:chat},{default:analyze}] = await Promise.all([
    import('../api/chat.js'),import('../api/analyze.js')
  ]);
  const response = () => ({
    headers:{}, statusCode:200, body:null,
    setHeader(name,value) { this.headers[name]=value; },
    status(code) { this.statusCode=code; return this; },
    json(value) { this.body=value; return this; },
    end() { return this; },
  });
  for (const handler of [chat,analyze]) {
    const forbidden=response();
    await handler({method:'POST',headers:{host:'brightway.example',origin:'https://foreign.example'},body:{}},forbidden);
    assert.equal(forbidden.statusCode,403);
    assert.equal(forbidden.headers['Access-Control-Allow-Origin'],undefined);
    const large=response();
    await handler({method:'POST',headers:{host:'brightway.example',origin:'https://brightway.example','content-length':'200000'},body:{}},large);
    assert.equal(large.statusCode,413);
    assert.equal(large.headers['Access-Control-Allow-Origin'],'https://brightway.example');
  }
});

test('SQL bootstrap and repair keep role assignment behind an admin boundary', () => {
  const read = file => fs.readFileSync(new URL(`../supabase/${file}`, import.meta.url),'utf8');
  const repair = read('migrations/002_secure_admin_access.sql');
  const initial = read('migrations/001_init.sql');
  const adminSources = [repair,read('admin-functions.sql'),read('setup-admin.sql')];
  for (const source of adminSources) {
    for (const name of ['admin_create_user','admin_set_password']) {
      const body = source.split(`FUNCTION public.${name}`)[1]?.split('$$;')[0];
      assert.ok(body?.includes("role = 'admin'"),`${name} must verify the caller's admin role`);
    }
  }
  assert.match(repair,/CREATE TRIGGER protect_profile_role/);
  assert.match(repair,/REVOKE EXECUTE ON FUNCTION public\.signin_with_email/);
  assert.match(repair,/REVOKE EXECUTE ON FUNCTION public\.create_session_for_email/);
  assert.doesNotMatch(initial,/raw_user_meta_data->>'role'/);
  assert.doesNotMatch(read('setup-email-only.sql'),/CREATE OR REPLACE FUNCTION/i);
  assert.doesNotMatch(read('setup-admin.sql'),/admin123/i);
});
