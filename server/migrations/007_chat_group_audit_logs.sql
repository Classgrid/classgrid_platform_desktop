-- Group audit logs (Grid / chat groups): who did what, to whom, from where.
-- Run once in the Supabase SQL editor of the CHAT project (the one with chat_groups / chat_messages).
-- Safe to run more than once.

create table if not exists chat_group_audit_logs (
  id uuid primary key default gen_random_uuid(),
  group_id uuid,
  actor_id text,
  actor_name text,
  action text not null,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

-- Logs must outlive their group: drop any foreign key from this table (e.g. group_id -> chat_groups)
do $$
declare c text;
begin
  for c in select conname from pg_constraint where conrelid = 'chat_group_audit_logs'::regclass and contype = 'f' loop
    execute format('alter table chat_group_audit_logs drop constraint %I', c);
  end loop;
end $$;
alter table chat_group_audit_logs alter column group_id drop not null;

alter table chat_group_audit_logs add column if not exists actor_role  text;
alter table chat_group_audit_logs add column if not exists target_id   text;
alter table chat_group_audit_logs add column if not exists target_type text;   -- 'user' | 'message' | 'group' | 'join_request'
alter table chat_group_audit_logs add column if not exists target_name text;
alter table chat_group_audit_logs add column if not exists ip_address  text;
alter table chat_group_audit_logs add column if not exists user_agent  text;
alter table chat_group_audit_logs add column if not exists org_id      text;
alter table chat_group_audit_logs add column if not exists group_name  text;   -- kept so logs stay readable after a group is deleted

-- Filters on the Audit Logs page: newest first, by group, by org, by action, by person
create index if not exists idx_cgal_created_at on chat_group_audit_logs (created_at desc);
create index if not exists idx_cgal_group      on chat_group_audit_logs (group_id, created_at desc);
create index if not exists idx_cgal_org        on chat_group_audit_logs (org_id, created_at desc);
create index if not exists idx_cgal_action     on chat_group_audit_logs (action);
create index if not exists idx_cgal_actor      on chat_group_audit_logs (actor_id);
