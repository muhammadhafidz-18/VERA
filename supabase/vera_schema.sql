-- =====================================================================
-- V.E.R.A — Supabase Database Schema
-- =====================================================================
-- Notes:
-- - Uses uuid primary keys (Supabase default/convention) with a separate
--   human-readable "code" column where the app displays IDs like
--   "EMP-0001", "MTG-01", "TSK-000123" (kept for UI familiarity).
-- - auth.users is Supabase Auth's built-in table — employees.auth_user_id
--   links an employee record to their login account.
-- - Row Level Security (RLS) is NOT enabled here — that's a follow-up
--   step once the role/permission model is finalized. Every table below
--   should get RLS policies before going to production.
-- - Attachments store a Supabase Storage URL/path, never base64 — keeps
--   the database small and lets Storage handle access control.
-- =====================================================================


-- =====================================================================
-- 1. MASTER DATA — Divisions & Branches
-- =====================================================================
create table divisions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table branches (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);


-- =====================================================================
-- 2. ROLE MANAGEMENT
-- =====================================================================
create table roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,              -- e.g. "Superadmin", "User"
  description text,
  permissions jsonb not null default '{}',-- flexible flags, e.g. {"can_manage_users": true}
  created_at timestamptz not null default now()
);


-- =====================================================================
-- 3. EMPLOYEE DIRECTORY (also doubles as "app users")
-- =====================================================================
create table employees (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  employee_code text not null unique,     -- display id, e.g. "EMP-0001"
  name text not null,
  email text not null unique,
  phone text,
  identity_number text,
  address text,
  birth_date date,
  join_date date,
  role_id uuid references roles(id),
  division_id uuid references divisions(id),
  branch_id uuid references branches(id),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_employees_division on employees(division_id);
create index idx_employees_branch on employees(branch_id);
create index idx_employees_status on employees(status);


-- =====================================================================
-- 4. MEETING SCHEDULE
-- =====================================================================
create table meetings (
  id uuid primary key default gen_random_uuid(),
  meeting_code text not null unique,      -- display id, e.g. "MTG-01"
  title text not null,
  date date not null,
  time time not null,
  location text,
  description text,
  created_by uuid references employees(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table meeting_attendees (
  meeting_id uuid not null references meetings(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  invited_at timestamptz not null default now(),
  primary key (meeting_id, employee_id)
);

create index idx_meetings_date on meetings(date);


-- =====================================================================
-- 5. TASKS
-- =====================================================================
create table tasks (
  id uuid primary key default gen_random_uuid(),
  task_code text not null unique,         -- display id, e.g. "TSK-000123"
  title text not null,
  description text,
  created_by uuid references employees(id),
  assigned_to uuid references employees(id),
  status text not null default 'open' check (status in ('open', 'in_progress', 'done', 'cancelled')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date timestamptz,

  ai_summary text,
  ai_summary_generated_at timestamptz,
  ai_summary_generate_count int not null default 0,   -- enforce the 2x limit server-side

  ai_issue_analysis text,
  ai_issue_analysis_generated_at timestamptz,
  ai_issue_analysis_generate_count int not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table task_chats (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  sender_id uuid references employees(id),   -- null = system-generated message
  message text,
  attachment_path text,                      -- Supabase Storage path, not base64
  attachment_name text,
  is_system boolean not null default false,
  action text,                               -- e.g. "status_changed", for system messages
  created_at timestamptz not null default now()
);

create table task_audit_log (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  action text not null,                      -- "created" | "edited" | "status_changed"
  by_user_id uuid references employees(id),
  detail text,
  created_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  meeting_id uuid references meetings(id) on delete set null,
  recipient_id uuid not null references employees(id) on delete cascade,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),

  constraint notifications_target_check check (task_id is not null or meeting_id is not null)
);

create index idx_tasks_status on tasks(status);
create index idx_tasks_assigned_to on tasks(assigned_to);
create index idx_task_chats_task on task_chats(task_id);
create index idx_task_audit_task on task_audit_log(task_id);
create index idx_task_notif_recipient on task_notifications(recipient_id, is_read);


-- =====================================================================
-- 6. INTEGRATION SETTINGS — Voice AI (ElevenLabs) & Product Knowledge (Chatbase)
-- =====================================================================
-- IMPORTANT: api_key here should be encrypted at rest (Supabase Vault) or,
-- better, moved entirely to a secret manager / Vercel env var if the app
-- doesn't need per-workspace keys. This table is here for the case where
-- each company/workspace configures their own key.
create table integration_settings (
  id uuid primary key default gen_random_uuid(),
  provider text not null unique check (provider in ('elevenlabs', 'chatbase')),
  enabled boolean not null default false,
  api_key text,                          -- store via Supabase Vault in production
  config jsonb not null default '{}',    -- e.g. {"voice_id": "..."} or {"chatbot_id": "..."}
  updated_at timestamptz not null default now()
);


-- =====================================================================
-- 7. ASK V.E.R.A — CHAT HISTORY (optional but recommended)
-- =====================================================================
create table vera_conversations (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  message text not null,
  op_type text check (op_type in ('INSERT', 'UPDATE', null)),  -- for the badge shown in chat
  created_at timestamptz not null default now()
);

create index idx_vera_conv_employee on vera_conversations(employee_id, created_at);


-- =====================================================================
-- 8. UPDATED_AT AUTO-TOUCH TRIGGER (applies to tables with updated_at)
-- =====================================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_employees_updated_at before update on employees
  for each row execute function set_updated_at();
create trigger trg_meetings_updated_at before update on meetings
  for each row execute function set_updated_at();
create trigger trg_tasks_updated_at before update on tasks
  for each row execute function set_updated_at();
