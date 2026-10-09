# Chat message search: what broke, and how to rebuild it safely

Last updated: 9 Oct 2026

## 1. What happened (8–9 Oct 2026)

We added a search that looks inside every message of all of a user's chats, not only chat titles
(commits `236591b2` and `50aa3bca`).

Soon after, the chat list, the user profile and opening chats stopped loading for everyone. The sidebar
stayed grey, or showed "No chats".

It came back after the stuck database queries were stopped (`pg_terminate_backend`), and after the
feature was reverted in commit `beffe3f2`. Chat search is back to **titles only**, done in the browser.
The login fix `1b2e50ec` and the memory fixes were kept.

## 2. Why it broke

| # | Mistake | Effect |
|---|---------|--------|
| 1 | Each search downloaded the **full text** of up to 100 messages per group of 50 chats | AI messages also store tool results, so one search pulled megabytes of data |
| 2 | **Every letter typed** started a new search, and none were cancelled | Typing "palindrome" ran about 9 heavy searches at the same time |
| 3 | `ilike '%word%'` scanned the huge `content` column | A lot of CPU on every search |
| 4 | Supabase is on the **free plan**: few connections, little CPU, 500 MB storage | The searches used up the database, so every other query (chat list, profile) waited and timed out |
| 5 | Search and title results were one step | When message search failed, title matches were lost too, and the page showed a false "No chats found" |
| 6 | Nothing was measured on real data before the push, and there was no off switch | It went straight to production with no quick way to stop it |

## 3. Clean-up still to do (if not done yet)

1. Drop the big search index from 8 Oct. It is no longer used and takes space.
   ```sql
   drop index if exists ai_chat_messages_content_trgm;
   ```
2. Keep these indexes. They make chats load faster:
   ```sql
   create index if not exists ai_chat_messages_session_created on ai_chat_messages (session_id, created_at);
   create index if not exists ai_chat_sessions_user_email on ai_chat_sessions (user_email);
   ```
3. Restart the backend on EC2 (`pm2 restart all`) and hard-refresh open tabs (Ctrl + Shift + R).

## 4. Safe plan

### Step 1: small search column, not the huge messages

- Add a column `search_text` to `ai_chat_messages`:
  - the **readable text only** (the user's message, or the AI's answer text)
  - no tool data, no JSON
  - cut to about **2,000 characters**
- New messages fill it when they are saved (`saveMessage` in `server/src/services/ai-chat.service.js`).
- Old messages are filled by a script in **small batches**: 500 rows at a time, a pause between batches,
  and a stop if the database gets slow.
- Index **only this small column**:
  - a full-text index (`to_tsvector('simple', search_text)`), or
  - a trigram index on `search_text`.

```sql
alter table ai_chat_messages add column if not exists search_text text;
-- after the backfill:
create index if not exists ai_chat_messages_search_text_trgm
  on ai_chat_messages using gin (search_text gin_trgm_ops);
```

### Step 2: one small database query

- One SQL function (Supabase RPC) that:
  - first narrows to the **user's own chats**, not incognito ones (uses the `user_email` index)
  - searches `search_text`, never `content`
  - returns at most **20 rows**, one per chat: chat id, role, a **short snippet** (about 200 characters),
    date, number of matches
- Title matches are found separately and **always shown first**, even if message search fails.
- Messages are only searched from **3 letters**. 2 letters search titles only.

### Step 3: brakes

**Frontend** (`client/src/components/ai/components/AiChatSearchPalette.tsx`):
- Wait **400 ms** after the user stops typing.
- **Cancel** the previous search when a new one starts (`AbortController`).
- At most **1 search running** at a time.
- On error, show "Search failed. Please try again.", never a false "No chats found".

**Backend:**
- At most **1 message search per second per user** (Redis rate limit).
- A **time limit** of about 2 seconds. A slow search is stopped and the user gets title results only.
- Log how long each search takes.

**On/off switch:**
- Environment variable `CHAT_MESSAGE_SEARCH=on|off`, read at request time.
- Set to `off` and restart, and message search stops at once. Title search keeps working.

### Step 4: test before pushing

Run these in Supabase. **Push only if every number is good.**

1. **Speed**, on the account with the most chats:
   ```sql
   explain analyze select * from search_chat_messages('nikhil.shinde@classgrid.in', 'palindrome', 20);
   ```
   Must be **under 300 ms**.
2. **Size** of the new index:
   ```sql
   select pg_size_pretty(pg_relation_size('ai_chat_messages_search_text_trgm'));
   select pg_size_pretty(pg_database_size(current_database()));
   ```
   The total must stay well under the **500 MB** free limit.
3. **Quiet database** while searching a few times in a row:
   ```sql
   select pid, now() - query_start as running_for, left(query, 80)
   from pg_stat_activity
   where state = 'active' and pid <> pg_backend_pid()
   order by running_for desc;
   ```
   No query should run longer than 1 second.

### Step 5: release

1. Push with `CHAT_MESSAGE_SEARCH=off`.
2. Check that chats, the chat list and title search work normally.
3. Set `CHAT_MESSAGE_SEARCH=on` and restart the backend.
4. Watch for 10 minutes: pm2 logs (search times) and the "quiet database" check above.
5. If anything is slow, set it back to `off`, restart, and investigate.

## 5. If the chat list freezes again

1. Stop stuck searches:
   ```sql
   select pg_terminate_backend(pid)
   from pg_stat_activity
   where state = 'active'
     and query ilike '%ai_chat_messages%'
     and now() - query_start > interval '5 seconds';
   ```
2. Set `CHAT_MESSAGE_SEARCH=off` and restart the backend.
3. Check the Supabase dashboard **Usage** page for limits on data transfer (egress) or database size.
