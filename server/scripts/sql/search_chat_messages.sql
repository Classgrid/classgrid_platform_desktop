-- Fast chat message search for /api/ai/sessions/search (run once in the Supabase SQL editor).
-- Uses the ai_chat_messages_content_trgm index; returns one short snippet per chat, not whole messages.
-- Safe to run again (create or replace).

create or replace function public.search_chat_messages(p_email text, p_query text, p_limit int default 20)
returns table (session_id text, role text, snippet text, created_at timestamptz, match_count bigint)
language sql
stable
as $$
  with params as (
    select lower(p_query) as needle,
           '%' || replace(replace(replace(p_query, '\', '\\'), '%', '\%'), '_', '\_') || '%' as pattern
  ),
  hits as (
    select m.session_id::text as session_id,
           m.role::text as role,
           m.content,
           m.created_at::timestamptz as created_at,
           row_number() over (partition by m.session_id order by m.created_at desc) as rn,
           count(*) over (partition by m.session_id) as match_count
    from ai_chat_messages m
    join ai_chat_sessions s on s.id = m.session_id
    cross join params
    where s.user_email = p_email
      and coalesce(s.is_incognito, false) = false
      and m.role in ('user', 'assistant')
      and m.content ilike params.pattern
  )
  select h.session_id,
         h.role,
         substring(h.content from greatest(1, strpos(lower(h.content), params.needle) - 160) for 480) as snippet,
         h.created_at,
         h.match_count
  from hits h
  cross join params
  where h.rn = 1
  order by h.created_at desc
  limit least(greatest(p_limit, 1), 50);
$$;

-- Lets the chat sessions be found by owner quickly (also speeds up the sidebar list).
create index if not exists ai_chat_sessions_user_email on ai_chat_sessions (user_email);
