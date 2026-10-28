-- Loopapp — initial schema (MVP).
-- Authorization lives here (RLS + SECURITY DEFINER functions), never only in the UI.
-- See docs/architecture.md and docs/security.md.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Users & roles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('admin', 'moderator', 'creator', 'developer')),
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

-- Creates the public profile when someone signs up.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1), 'user'), 40)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.has_role(roles text[]) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = any (roles)
  );
$$;

create function public.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select public.has_role(array['admin', 'moderator']);
$$;

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------

create table public.apps (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  owner_id uuid references auth.users (id) on delete set null,
  provenance text not null check (provenance in ('demo', 'authorized_integration', 'independent')),
  status text not null default 'draft' check (status in ('draft', 'published', 'suspended', 'retired')),
  category text not null check (category in ('productivity', 'finance', 'design', 'tools', 'wellbeing')),
  name jsonb not null check (name ? 'es' and name ? 'en'),
  tagline jsonb not null check (tagline ? 'es' and tagline ? 'en'),
  description jsonb not null check (description ? 'es' and description ? 'en'),
  creator_name text not null,
  accent text not null default '#FF5A47' check (accent ~ '^#[0-9A-Fa-f]{6}$'),
  external_url text check (external_url is null or external_url ~ '^https://'),
  current_version_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.app_versions (
  id uuid primary key default gen_random_uuid(),
  app_id uuid not null references public.apps (id) on delete cascade,
  version text not null,
  entry_path text not null check (entry_path ~ '^/miniapps/[a-z0-9-]+/[0-9A-Za-z.\-]+/index\.html$'),
  sha256 text check (sha256 is null or sha256 ~ '^[0-9a-f]{64}$'),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'suspended')),
  -- Declared permissions; everything not listed is denied (RF-013).
  permissions text[] not null default '{}' check (permissions <@ array['clipboard-write', 'network']),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  unique (app_id, version)
);

alter table public.apps
  add constraint apps_current_version_fk
  foreign key (current_version_id) references public.app_versions (id) on delete set null;

-- Versions are immutable once created: only their review status may change.
create function public.app_versions_immutable() returns trigger
language plpgsql as $$
begin
  if new.app_id <> old.app_id or new.version <> old.version or new.entry_path <> old.entry_path
     or new.sha256 is distinct from old.sha256 or new.permissions <> old.permissions then
    raise exception 'app versions are immutable';
  end if;
  return new;
end;
$$;

create trigger app_versions_immutable
  before update on public.app_versions
  for each row execute function public.app_versions_immutable();

create table public.feed_items (
  app_id uuid primary key references public.apps (id) on delete cascade,
  position integer not null default 100,
  featured boolean not null default false,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Social
-- ---------------------------------------------------------------------------

create table public.likes (
  user_id uuid not null references auth.users (id) on delete cascade,
  app_id uuid not null references public.apps (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, app_id)
);

-- Basic personal collection (RF-023). A single implicit "saved" collection per user for the MVP.
create table public.saves (
  user_id uuid not null references auth.users (id) on delete cascade,
  app_id uuid not null references public.apps (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, app_id)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  app_id uuid not null references public.apps (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 500),
  status text not null default 'visible' check (status in ('visible', 'hidden')),
  created_at timestamptz not null default now()
);
create index comments_app_created_idx on public.comments (app_id, created_at desc);
create index comments_user_created_idx on public.comments (user_id, created_at desc);

-- Rate limit: at most 5 comments per user per minute (RF-024).
create function public.comments_rate_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.comments
      where user_id = new.user_id and created_at > now() - interval '1 minute') >= 5 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger comments_rate_limit
  before insert on public.comments
  for each row execute function public.comments_rate_limit();

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  target_type text not null check (target_type in ('app', 'comment')),
  target_id uuid not null,
  reason text not null check (reason in ('spam', 'abuse', 'malicious', 'ip', 'other')),
  details text check (details is null or char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  resolved_by uuid references auth.users (id),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create index reports_status_idx on public.reports (status, created_at desc);

-- ---------------------------------------------------------------------------
-- Analytics & audit
-- ---------------------------------------------------------------------------

create table public.app_events (
  id bigint generated always as identity primary key,
  event_type text not null check (event_type in
    ('impression', 'trial_start', 'interaction', 'exit', 'error', 'external_link_open', 'share')),
  app_id uuid not null references public.apps (id) on delete cascade,
  version_id uuid references public.app_versions (id) on delete set null,
  -- Pseudonymous, client-generated session id. Never linked to auth.users.
  session_id text not null check (char_length(session_id) between 8 and 64),
  props jsonb not null default '{}' check (jsonb_typeof(props) = 'object'),
  occurred_at timestamptz not null,
  received_at timestamptz not null default now()
);
create index app_events_app_time_idx on public.app_events (app_id, received_at desc);

-- Administrative audit log (RF-036, review_records). Append-only: no policies allow writes;
-- rows are only inserted by the SECURITY DEFINER admin functions below.
create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id),
  action text not null,
  target_type text not null,
  target_id text not null,
  reason text,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create function public.audit_log_append_only() returns trigger
language plpgsql as $$
begin
  raise exception 'audit_log is append-only';
end;
$$;

create trigger audit_log_append_only
  before update or delete on public.audit_log
  for each row execute function public.audit_log_append_only();

-- ---------------------------------------------------------------------------
-- Public read models
-- ---------------------------------------------------------------------------

-- Runnable feed: published apps whose current version is approved (TC-010).
create view public.public_feed with (security_invoker = true) as
select
  a.id, a.slug, a.provenance, a.category, a.name, a.tagline, a.description,
  a.creator_name, a.accent, a.external_url, a.status,
  v.id as version_id, v.version, v.entry_path, v.sha256, v.status as version_status, v.permissions,
  f.position, f.featured
from public.apps a
join public.app_versions v on v.id = a.current_version_id
left join public.feed_items f on f.app_id = a.id
where a.status = 'published' and v.status = 'approved';

-- Aggregated counters; exposes no identities.
create function public.app_stats(app_ids uuid[])
returns table (app_id uuid, likes bigint, comments bigint)
language sql stable security definer set search_path = '' as $$
  select a.id,
    (select count(*) from public.likes l where l.app_id = a.id),
    (select count(*) from public.comments c where c.app_id = a.id and c.status = 'visible')
  from unnest(app_ids) as a(id);
$$;

create view public.comment_feed with (security_invoker = true) as
select c.id, c.app_id, c.user_id, c.body, c.created_at, p.display_name
from public.comments c
join public.profiles p on p.id = c.user_id
where c.status = 'visible';

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.apps enable row level security;
alter table public.app_versions enable row level security;
alter table public.feed_items enable row level security;
alter table public.likes enable row level security;
alter table public.saves enable row level security;
alter table public.comments enable row level security;
alter table public.reports enable row level security;
alter table public.app_events enable row level security;
alter table public.audit_log enable row level security;

-- profiles: display names are public; each user edits their own.
create policy profiles_read on public.profiles for select using (true);
create policy profiles_update_own on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid() and status = 'active');

-- user_roles: users see their own roles, staff sees all. No client writes.
create policy user_roles_read on public.user_roles for select
  using (user_id = auth.uid() or public.is_staff());

-- catalog: the public sees only what is published and approved; staff sees everything.
create policy apps_read on public.apps for select
  using (status = 'published' or public.is_staff() or owner_id = auth.uid());
create policy app_versions_read on public.app_versions for select
  using (
    public.is_staff()
    or exists (select 1 from public.apps a where a.id = app_id and a.owner_id = auth.uid())
    or (status = 'approved' and exists (select 1 from public.apps a where a.id = app_id and a.status = 'published'))
  );
create policy feed_items_read on public.feed_items for select using (true);

-- likes / saves: private to their owner; idempotent through the composite PK.
create policy likes_read_own on public.likes for select using (user_id = auth.uid());
create policy likes_insert_own on public.likes for insert
  with check (user_id = auth.uid() and exists (select 1 from public.apps a where a.id = app_id and a.status = 'published'));
create policy likes_delete_own on public.likes for delete using (user_id = auth.uid());

create policy saves_read_own on public.saves for select using (user_id = auth.uid());
create policy saves_insert_own on public.saves for insert
  with check (user_id = auth.uid() and exists (select 1 from public.apps a where a.id = app_id and a.status = 'published'));
create policy saves_delete_own on public.saves for delete using (user_id = auth.uid());

-- comments: visible ones are public; authors insert/delete their own; staff can see hidden ones.
create policy comments_read on public.comments for select
  using (status = 'visible' or user_id = auth.uid() or public.is_staff());
create policy comments_insert_own on public.comments for insert
  with check (
    user_id = auth.uid() and status = 'visible'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'active')
    and exists (select 1 from public.apps a where a.id = app_id and a.status = 'published')
  );
create policy comments_delete_own on public.comments for delete using (user_id = auth.uid());

-- reports: anyone signed in can file one; only staff can read them (reporter stays private).
create policy reports_insert_own on public.reports for insert
  with check (reporter_id = auth.uid() and status = 'open' and resolved_by is null);
create policy reports_read_staff on public.reports for select using (public.is_staff());

-- events: write-only for clients (anonymous included), readable by staff.
create policy app_events_insert on public.app_events for insert
  with check (occurred_at > now() - interval '1 day' and occurred_at < now() + interval '5 minutes');
create policy app_events_read_staff on public.app_events for select using (public.is_staff());

create policy audit_log_read_staff on public.audit_log for select using (public.is_staff());

-- ---------------------------------------------------------------------------
-- Admin operations (each one checks the role and writes the audit log)
-- ---------------------------------------------------------------------------

create function public.admin_set_app_status(p_app_id uuid, p_status text, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  previous text;
begin
  if not public.has_role(array['admin']) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_status not in ('published', 'suspended', 'retired') then
    raise exception 'invalid status';
  end if;
  if p_status <> 'published' and coalesce(btrim(p_reason), '') = '' then
    raise exception 'reason required';
  end if;

  select status into previous from public.apps where id = p_app_id for update;
  if previous is null then
    raise exception 'app not found';
  end if;

  update public.apps set status = p_status, updated_at = now() where id = p_app_id;

  -- Publishing requires an approved current version.
  if p_status = 'published' and not exists (
    select 1 from public.apps a join public.app_versions v on v.id = a.current_version_id
    where a.id = p_app_id and v.status = 'approved'
  ) then
    raise exception 'current version is not approved';
  end if;

  insert into public.audit_log (actor_id, action, target_type, target_id, reason, payload)
  values (auth.uid(), 'app.status', 'app', p_app_id::text, p_reason,
          jsonb_build_object('from', previous, 'to', p_status));
end;
$$;

create function public.admin_set_version_status(p_version_id uuid, p_status text, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  previous text;
begin
  if not public.has_role(array['admin']) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_status not in ('approved', 'rejected', 'suspended') then
    raise exception 'invalid status';
  end if;
  select status into previous from public.app_versions where id = p_version_id for update;
  if previous is null then
    raise exception 'version not found';
  end if;
  update public.app_versions
    set status = p_status, approved_at = case when p_status = 'approved' then now() else approved_at end
    where id = p_version_id;
  insert into public.audit_log (actor_id, action, target_type, target_id, reason, payload)
  values (auth.uid(), 'version.status', 'app_version', p_version_id::text, p_reason,
          jsonb_build_object('from', previous, 'to', p_status));
end;
$$;

create function public.admin_set_feed_item(p_app_id uuid, p_position integer, p_featured boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare
  previous jsonb;
begin
  if not public.has_role(array['admin']) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select to_jsonb(f) into previous from public.feed_items f where app_id = p_app_id;
  insert into public.feed_items (app_id, position, featured, updated_at)
  values (p_app_id, p_position, p_featured, now())
  on conflict (app_id) do update
    set position = excluded.position, featured = excluded.featured, updated_at = now();
  insert into public.audit_log (actor_id, action, target_type, target_id, payload)
  values (auth.uid(), 'feed.update', 'app', p_app_id::text,
          jsonb_build_object('from', previous, 'to', jsonb_build_object('position', p_position, 'featured', p_featured)));
end;
$$;

create function public.admin_resolve_report(p_report_id uuid, p_status text, p_hide_comment boolean, p_note text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  r public.reports;
begin
  if not public.is_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_status not in ('resolved', 'dismissed') then
    raise exception 'invalid status';
  end if;
  select * into r from public.reports where id = p_report_id for update;
  if r.id is null then
    raise exception 'report not found';
  end if;
  update public.reports set status = p_status, resolved_by = auth.uid(), resolved_at = now()
    where id = p_report_id;
  if p_hide_comment and r.target_type = 'comment' then
    update public.comments set status = 'hidden' where id = r.target_id;
  end if;
  insert into public.audit_log (actor_id, action, target_type, target_id, reason, payload)
  values (auth.uid(), 'report.' || p_status, 'report', p_report_id::text, p_note,
          jsonb_build_object('target_type', r.target_type, 'target_id', r.target_id, 'hide_comment', p_hide_comment));
end;
$$;

create function public.admin_event_summary(p_since timestamptz)
returns table (app_id uuid, event_type text, total bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select e.app_id, e.event_type, count(*)
    from public.app_events e
    where e.received_at >= p_since
    group by e.app_id, e.event_type;
end;
$$;

-- Lock down function execution: anon/authenticated may call only what they need.
revoke execute on all functions in schema public from public, anon;
grant execute on function public.app_stats(uuid[]) to anon, authenticated;
grant execute on function public.has_role(text[]) to authenticated;
grant execute on function public.is_staff() to anon, authenticated;
grant execute on function public.admin_set_app_status(uuid, text, text) to authenticated;
grant execute on function public.admin_set_version_status(uuid, text, text) to authenticated;
grant execute on function public.admin_set_feed_item(uuid, integer, boolean) to authenticated;
grant execute on function public.admin_resolve_report(uuid, text, boolean, text) to authenticated;
grant execute on function public.admin_event_summary(timestamptz) to authenticated;
