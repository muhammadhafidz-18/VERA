-- =====================================================================
-- V.E.R.A — Temporary DEV RLS policies
-- =====================================================================
-- RLS is already enabled on these tables (either from the dashboard or a
-- prior run), but with zero policies — which means Postgres denies ALL
-- access by default, including to the app itself via the anon key +
-- logged-in user session. That's what was blocking login just now.
--
-- This grants any authenticated (logged-in) user full read/write access to
-- every table, just to unblock development.
--
-- !! MUST be replaced with real per-role policies before production !!
-- (this is Fase 5 in the migration roadmap — e.g. only Superadmin can
-- write to `roles`/`divisions`/`branches`, employees can only see their
-- own `vera_conversations`, etc.)
-- =====================================================================

do $$
declare t text;
begin
  for t in
    select unnest(array[
      'divisions', 'branches', 'roles', 'employees',
      'meetings', 'meeting_attendees',
      'tasks', 'task_chats', 'task_audit_log', 'task_notifications',
      'integration_settings', 'vera_conversations'
    ])
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "dev: authenticated full access" on %I', t);
    execute format(
      'create policy "dev: authenticated full access" on %I for all to authenticated using (true) with check (true)',
      t
    );
  end loop;
end $$;
