# Supabase migrations

`001_init.sql` is a historical bootstrap for an **empty** database. It contains
`DROP TABLE` statements and must never be rerun against a project with data.
The file now refuses to run when any of its application tables already exists.

For an existing BrightWay database, the security repair is
[`002_secure_admin_access.sql`](002_secure_admin_access.sql). It replaces the
admin RPC bodies, limits their EXECUTE grants, prevents client role escalation,
and revokes the legacy email-only RPC grants. It does not delete user rows.

Before applying 002 to production:

1. Export a restorable database backup and the current definitions/grants for
   the affected functions and trigger.
2. Inspect the live `public.profiles` schema and test the migration on a copy.
3. Run the complete migration in the trusted Supabase SQL Editor. It is wrapped
   in a transaction and fails on an unexpected profile schema.
4. Verify ordinary users cannot change `profiles.role` or call admin RPCs,
   while a real admin can create/list users and reset a password.
5. Check whether the legacy email-only functions or sample account passwords
   were ever used; rotate affected passwords and review accounts as needed.

Deploying the static site through Vercel does **not** apply SQL migrations.
Never copy the old `001_init.sql` phases into a live database as an upgrade.
