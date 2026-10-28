-- Seed data: the five first-party demo miniapps.
-- Mirrors src/lib/catalog/seed.ts (checked by tests/unit/seed-sql.test.ts).

insert into public.apps (id, slug, provenance, status, category, name, tagline, description, creator_name, accent, external_url)
values ('00000000-0000-4000-a000-000000000001', 'foco', 'demo', 'published', 'productivity',
  '{"es":"Foco","en":"Focus"}'::jsonb,
  '{"es":"Temporizador Pomodoro: 25 minutos de foco, 5 de pausa.","en":"Pomodoro timer: 25 minutes of focus, 5 of rest."}'::jsonb,
  '{"es":"Alterná bloques de trabajo y descanso, saltá fases y llevá la cuenta de tus ciclos. Todo queda en tu pantalla: no se guarda nada.","en":"Alternate work and rest blocks, skip phases and keep count of your cycles. Everything stays on your screen: nothing is stored."}'::jsonb,
  'Equipo Loopapp', '#FF5A47', null);
insert into public.app_versions (id, app_id, version, entry_path, sha256, status, permissions, approved_at)
values ('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-a000-000000000001', '1.0.0', '/miniapps/foco/1.0.0/index.html', 'a2b3c448206c0cf16e5d4c7274e624b368b375b539060abe9c9249e9b9fc9a39', 'approved', '{}', now());
update public.apps set current_version_id = '00000000-0000-4000-b000-000000000001' where id = '00000000-0000-4000-a000-000000000001';
insert into public.feed_items (app_id, position, featured) values ('00000000-0000-4000-a000-000000000001', 1, true);

insert into public.apps (id, slug, provenance, status, category, name, tagline, description, creator_name, accent, external_url)
values ('00000000-0000-4000-a000-000000000002', 'dividi-la-cuenta', 'demo', 'published', 'finance',
  '{"es":"Dividí la cuenta","en":"Split the bill"}'::jsonb,
  '{"es":"Total, propina y personas: cuánto pone cada uno.","en":"Total, tip and people: how much each one pays."}'::jsonb,
  '{"es":"Ingresá el total, elegí la propina y cuántas personas son. Redondeá hacia arriba si no quieren andar con monedas.","en":"Enter the total, pick a tip and how many people are paying. Round up if nobody wants to deal with coins."}'::jsonb,
  'Equipo Loopapp', '#FFB830', null);
insert into public.app_versions (id, app_id, version, entry_path, sha256, status, permissions, approved_at)
values ('00000000-0000-4000-b000-000000000002', '00000000-0000-4000-a000-000000000002', '1.0.0', '/miniapps/dividi-la-cuenta/1.0.0/index.html', '3d2c81e62019305370a790781a793afc46eb65f6261cb89c7b6b4629af344bb3', 'approved', '{}', now());
update public.apps set current_version_id = '00000000-0000-4000-b000-000000000002' where id = '00000000-0000-4000-a000-000000000002';
insert into public.feed_items (app_id, position, featured) values ('00000000-0000-4000-a000-000000000002', 2, false);

insert into public.apps (id, slug, provenance, status, category, name, tagline, description, creator_name, accent, external_url)
values ('00000000-0000-4000-a000-000000000003', 'paletas', 'demo', 'published', 'design',
  '{"es":"Paletas","en":"Palettes"}'::jsonb,
  '{"es":"Generá paletas de color armónicas y bloqueá las que te gustan.","en":"Generate harmonious color palettes and lock the ones you like."}'::jsonb,
  '{"es":"Cinco colores por paleta con distintas armonías. Bloqueá un color para conservarlo mientras generás el resto.","en":"Five colors per palette with different harmonies. Lock a color to keep it while you regenerate the rest."}'::jsonb,
  'Equipo Loopapp', '#7B6CF6', null);
insert into public.app_versions (id, app_id, version, entry_path, sha256, status, permissions, approved_at)
values ('00000000-0000-4000-b000-000000000003', '00000000-0000-4000-a000-000000000003', '1.0.0', '/miniapps/paletas/1.0.0/index.html', 'b49476d4473fea9b123d05524934acff668fd89e61a9aaf215b0e2c91e67e42c', 'approved', '{}', now());
update public.apps set current_version_id = '00000000-0000-4000-b000-000000000003' where id = '00000000-0000-4000-a000-000000000003';
insert into public.feed_items (app_id, position, featured) values ('00000000-0000-4000-a000-000000000003', 3, false);

insert into public.apps (id, slug, provenance, status, category, name, tagline, description, creator_name, accent, external_url)
values ('00000000-0000-4000-a000-000000000004', 'conversor', 'demo', 'published', 'tools',
  '{"es":"Conversor","en":"Converter"}'::jsonb,
  '{"es":"Longitud, peso y temperatura al instante.","en":"Length, weight and temperature in an instant."}'::jsonb,
  '{"es":"Convertí entre unidades métricas e imperiales mientras escribís, e intercambiá origen y destino con un toque.","en":"Convert between metric and imperial units as you type, and swap source and target with one tap."}'::jsonb,
  'Equipo Loopapp', '#22C59A', null);
insert into public.app_versions (id, app_id, version, entry_path, sha256, status, permissions, approved_at)
values ('00000000-0000-4000-b000-000000000004', '00000000-0000-4000-a000-000000000004', '1.0.0', '/miniapps/conversor/1.0.0/index.html', 'a1e35825ee1e253d86bdc5f856d8dc794aaf4feae9bcb0247cf8ee31d2e4d77f', 'approved', '{}', now());
update public.apps set current_version_id = '00000000-0000-4000-b000-000000000004' where id = '00000000-0000-4000-a000-000000000004';
insert into public.feed_items (app_id, position, featured) values ('00000000-0000-4000-a000-000000000004', 4, false);

insert into public.apps (id, slug, provenance, status, category, name, tagline, description, creator_name, accent, external_url)
values ('00000000-0000-4000-a000-000000000005', 'respira', 'demo', 'published', 'wellbeing',
  '{"es":"Respirá","en":"Breathe"}'::jsonb,
  '{"es":"Respiración en caja 4-4-4-4 para bajar un cambio.","en":"4-4-4-4 box breathing to slow down."}'::jsonb,
  '{"es":"Seguí la animación: inhalá, sostené, exhalá y sostené, cuatro segundos cada fase. Ideal para un minuto de pausa.","en":"Follow the animation: inhale, hold, exhale and hold, four seconds each. Perfect for a one-minute break."}'::jsonb,
  'Equipo Loopapp', '#4FB3FF', null);
insert into public.app_versions (id, app_id, version, entry_path, sha256, status, permissions, approved_at)
values ('00000000-0000-4000-b000-000000000005', '00000000-0000-4000-a000-000000000005', '1.0.0', '/miniapps/respira/1.0.0/index.html', '8120c359eab5e390c075bceee9e31f77e1015d473f8c265c8367df61c09ced52', 'approved', '{}', now());
update public.apps set current_version_id = '00000000-0000-4000-b000-000000000005' where id = '00000000-0000-4000-a000-000000000005';
insert into public.feed_items (app_id, position, featured) values ('00000000-0000-4000-a000-000000000005', 5, false);

