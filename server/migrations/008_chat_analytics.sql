-- Chat Analytics (super admin): fast, read-only counting helpers for the Analytics page.
-- Run once in the Supabase SQL editor of the CHAT project (the one with chat_messages / chat_groups).
-- Safe to run more than once. The server caches results for 60 s, so these run at most once a minute.

-- Counting by time needs an index on message time (otherwise every count scans the whole table)
create index if not exists idx_chat_messages_created_at on chat_messages (created_at);
create index if not exists idx_chat_groups_created_at   on chat_groups (created_at);

-- Messages per day for the last N days (India time)
create or replace function chat_analytics_daily_messages(days int default 7)
returns table (day date, messages bigint)
language sql stable as $$
  select (created_at at time zone 'Asia/Kolkata')::date as day, count(*)::bigint
  from chat_messages
  where created_at >= now() - make_interval(days => days)
  group by 1
  order by 1;
$$;

-- Most active groups since a time (by number of messages)
create or replace function chat_analytics_top_groups(since timestamptz, lim int default 8)
returns table (group_id text, group_name text, messages bigint)
language sql stable as $$
  select t.group_id::text, coalesce(g.name, 'Deleted group'), count(*)::bigint
  from chat_messages m
  join chat_threads t on t.id = m.thread_id
  left join chat_groups g on g.id = t.group_id
  where m.created_at >= since and t.group_id is not null
  group by t.group_id, g.name
  order by 3 desc
  limit lim;
$$;

-- People who sent at least one message since a time
create or replace function chat_analytics_active_senders(since timestamptz)
returns bigint
language sql stable as $$
  select count(distinct sender_id)::bigint from chat_messages where created_at >= since;
$$;
