-- Authorization & integrity tests for the database layer (RLS + admin functions).
-- Run with: npm run test:db   (needs a PostgreSQL; see docs/testing.md)
-- Everything runs in a transaction that is rolled back at the end.
\set ON_ERROR_STOP 1
begin;

insert into auth.users (id, email, raw_user_meta_data) values
  ('10000000-0000-4000-8000-000000000001', 'admin@test.local', '{"display_name":"Admin"}'),
  ('10000000-0000-4000-8000-000000000002', 'ana@test.local', '{"display_name":"Ana"}'),
  ('10000000-0000-4000-8000-000000000003', 'beto@test.local', '{}');
insert into public.user_roles (user_id, role) values ('10000000-0000-4000-8000-000000000001', 'admin');

create function pg_temp.act_as(uid text) returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claim.sub', coalesce(uid, ''), true);
  if uid is null then execute 'set local role anon'; else execute 'set local role authenticated'; end if;
end $$;

create function pg_temp.check(ok boolean, label text) returns void language plpgsql as $$
begin
  if not coalesce(ok, false) then raise exception 'FAILED: %', label; end if;
  raise notice 'ok - %', label;
end $$;

create function pg_temp.fails(stmt text, label text) returns void language plpgsql as $$
begin
  begin
    execute stmt;
  exception when others then
    raise notice 'ok - % (%)', label, sqlerrm;
    return;
  end;
  raise exception 'FAILED (expected an error): %', label;
end $$;

-- Profiles are created on sign-up
select pg_temp.check((select display_name from public.profiles where id = '10000000-0000-4000-8000-000000000003') = 'beto',
  'profile created from email when no display name');

-- TC-001: anonymous visitors see the feed
select pg_temp.act_as(null);
select pg_temp.check((select count(*) from public.public_feed) = 5, 'anon sees 5 published apps');
select pg_temp.check((select count(*) from public.app_stats(array['00000000-0000-4000-a000-000000000001'::uuid])) = 1, 'anon can read aggregated stats');
select pg_temp.fails($$insert into public.likes (user_id, app_id) values ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-a000-000000000001')$$,
  'anon cannot like');

-- RF-040: anonymous events are write-only
insert into public.app_events (event_type, app_id, version_id, session_id, occurred_at)
values ('impression', '00000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000001', 'sess-12345678', now());
select pg_temp.check((select count(*) from public.app_events) = 0, 'anon cannot read events');
select pg_temp.fails($$insert into public.app_events (event_type, app_id, session_id, occurred_at)
  values ('impression', '00000000-0000-4000-a000-000000000001', 'sess-12345678', now() - interval '3 days')$$,
  'events with stale timestamps are rejected');

-- TC-007: likes are idempotent and private
select pg_temp.act_as('10000000-0000-4000-8000-000000000002');
insert into public.likes (user_id, app_id) values ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-a000-000000000001')
  on conflict do nothing;
insert into public.likes (user_id, app_id) values ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-a000-000000000001')
  on conflict do nothing;
select pg_temp.check((select likes from public.app_stats(array['00000000-0000-4000-a000-000000000001'::uuid])) = 1, 'double like counts once');
select pg_temp.fails($$insert into public.likes (user_id, app_id) values ('10000000-0000-4000-8000-000000000003', '00000000-0000-4000-a000-000000000002')$$,
  'cannot like on behalf of another user');
insert into public.saves (user_id, app_id) values ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-a000-000000000003');

select pg_temp.act_as('10000000-0000-4000-8000-000000000003');
select pg_temp.check((select count(*) from public.likes) = 0 and (select count(*) from public.saves) = 0,
  'users cannot see other users likes or saves');

-- TC-008: comment validation and rate limit
select pg_temp.fails($$insert into public.comments (app_id, user_id, body) values ('00000000-0000-4000-a000-000000000001', '10000000-0000-4000-8000-000000000003', '   ')$$,
  'empty comment rejected');
select pg_temp.fails(format($$insert into public.comments (app_id, user_id, body) values ('00000000-0000-4000-a000-000000000001', '10000000-0000-4000-8000-000000000003', %L)$$, repeat('a', 501)),
  'comment over 500 chars rejected');
select pg_temp.fails($$insert into public.comments (app_id, user_id, body) values ('00000000-0000-4000-a000-000000000001', '10000000-0000-4000-8000-000000000002', 'impersonation')$$,
  'cannot comment as another user');
insert into public.comments (app_id, user_id, body)
  select '00000000-0000-4000-a000-000000000001', '10000000-0000-4000-8000-000000000003', 'comentario ' || g from generate_series(1, 5) g;
select pg_temp.fails($$insert into public.comments (app_id, user_id, body) values ('00000000-0000-4000-a000-000000000001', '10000000-0000-4000-8000-000000000003', 'sexto')$$,
  'sixth comment within a minute is rate limited');
select pg_temp.check((select count(*) from public.comment_feed where display_name = 'beto') = 5, 'comments visible with author display name');

-- RF-025: reports are private to staff
insert into public.reports (reporter_id, target_type, target_id, reason)
  select '10000000-0000-4000-8000-000000000003', 'comment', id, 'spam' from public.comments limit 1;
select pg_temp.check((select count(*) from public.reports) = 0, 'reporter cannot read reports back');
select pg_temp.act_as('10000000-0000-4000-8000-000000000002');
select pg_temp.check((select count(*) from public.reports) = 0, 'other users cannot read reports');

-- TC-015: non-admins cannot run admin operations or touch the audit log
select pg_temp.fails($$select public.admin_set_app_status('00000000-0000-4000-a000-000000000003', 'suspended', 'x')$$,
  'user cannot suspend apps');
select pg_temp.fails($$select public.admin_set_feed_item('00000000-0000-4000-a000-000000000003', 1, true)$$,
  'user cannot reorder feed');
update public.apps set status = 'suspended' where slug = 'paletas';
select pg_temp.check((select status from public.apps where slug = 'paletas') = 'published', 'user cannot update apps directly');
select pg_temp.fails($$insert into public.audit_log (action, target_type, target_id) values ('x', 'x', 'x')$$,
  'user cannot write audit log');
select pg_temp.check((select count(*) from public.app_events) = 0, 'user cannot read events');

-- TC-011: admin suspends a version-holding app; it leaves the feed and is audited
select pg_temp.act_as('10000000-0000-4000-8000-000000000001');
select pg_temp.fails($$select public.admin_set_app_status('00000000-0000-4000-a000-000000000003', 'suspended', '  ')$$,
  'suspension requires a reason');
select public.admin_set_app_status('00000000-0000-4000-a000-000000000003', 'suspended', 'Prueba de suspensión');
select pg_temp.check((select count(*) from public.audit_log where action = 'app.status') = 1, 'suspension is audited');
select pg_temp.check((select count(*) from public.reports) = 1, 'admin sees reports');
select public.admin_resolve_report((select id from public.reports limit 1), 'resolved', true, 'spam claro');
select pg_temp.check((select count(*) from public.comments where status = 'hidden') = 1, 'resolving can hide the comment');
update public.audit_log set reason = 'tampered';
select pg_temp.check((select count(*) from public.audit_log where reason = 'tampered') = 0, 'even admins cannot edit the audit log through the API');
reset role;
select pg_temp.fails($$update public.audit_log set reason = 'tampered'$$, 'audit log is append-only for the database owner (update)');
select pg_temp.fails($$delete from public.audit_log$$, 'audit log is append-only for the database owner (delete)');

select pg_temp.act_as(null);
select pg_temp.check((select count(*) from public.public_feed) = 4, 'suspended app leaves the public feed');
select pg_temp.check((select count(*) from public.apps where slug = 'paletas') = 0, 'suspended app is not readable publicly');
select pg_temp.check((select count(*) from public.comment_feed where display_name = 'beto') = 4, 'hidden comment is not public');

-- TC-010: an unapproved version never reaches the feed
select pg_temp.act_as('10000000-0000-4000-8000-000000000001');
select public.admin_set_version_status('00000000-0000-4000-b000-000000000004', 'suspended', 'Vulnerabilidad');
select pg_temp.act_as(null);
select pg_temp.check((select count(*) from public.public_feed where slug = 'conversor') = 0, 'suspended version is not served');

-- Versions are immutable
reset role;
select pg_temp.fails($$update public.app_versions set entry_path = '/miniapps/evil/1.0.0/index.html' where id = '00000000-0000-4000-b000-000000000001'$$,
  'version entry point cannot change');

-- Publishing again is possible and restores visibility
select pg_temp.act_as('10000000-0000-4000-8000-000000000001');
select public.admin_set_app_status('00000000-0000-4000-a000-000000000003', 'published', null);
select pg_temp.act_as(null);
select pg_temp.check((select count(*) from public.public_feed where slug = 'paletas') = 1, 'republished app is back');

rollback;
