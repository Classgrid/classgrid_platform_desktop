# Why every "hi" costs 34k–70k tokens, and how to get it under 10k

Written 8 Oct 2026. Every number comes from measuring the code (scratch scripts, read-only) and is checked against real production logs from today. Paths are under `server/src`. `c:` = `controllers/ai-chat.controller.js`, `t:` = `mcp/tools.js`.
Token counts are approximate. DeepSeek ≈ characters ÷ 4. Claude ≈ characters ÷ 3.3, because Claude's tokenizer counts about 20–30% more tokens for the same text.

---

## 1. Measured in production today

| Message | Who | Model | Input tokens | Output | Total charged |
|---|---|---|---|---|---|
| "hi" | student, chat.classgrid.in | DeepSeek V4 Flash | **34,225** | 55 | 34,280 |
| "hi" | super_admin, 10 integrations | Claude Haiku 5.5 | **60,324** | 81 | 60,405 |
| Chat title for "SCHEDULE A ZOOM…" (hidden extra call) | super_admin | DeepSeek V4 Pro | **38,932** | 18 | 38,950 |
| "Schedule a Zoom and Google Meet at 5 PM" (4 model rounds, 3 tools) | super_admin | Claude Haiku 5.5 | **186,980** | 1,322 | **188,302** |

The answer itself is under 100 tokens. **Over 99% of every request is the same text sent again and again.**

---

## 2. Where the 60k of a single "hi" goes

| Part | Size | Claude tokens | DeepSeek tokens | Sent when |
|---|---|---|---|---|
| **A. Fixed rule text** (`SYSTEM_PROMPT` c:60-493 + always-on additions c:831-1629) | ~78,500 chars | **~23,800** | ~19,600 | every message, every user |
| **B. Tool definitions**: 118 from `getMcpTools()` + 12 inline (c:1694-1864) | ~48,200 chars | **~14,600** | ~12,000 | every message, every user |
| **C. Connector tools** (10 connected: Google 4.2k, Vercel 1.6k, Microsoft 2.2k, Notion, Zoom, YouTube, Sanity, Facebook, Instagram, Supabase) | ~13,200 chars | **~4,000** | ~3,300 | every message, if connected |
| **D. Connector instruction text** (c:1426-1527) | ~8,200 chars | ~2,500 | ~2,100 | every message, if connected |
| **E. Per-user text** (user context, owner override, time + 14-day calendar, prefs, skills) | ~4,000 chars | ~1,200 | ~1,000 | every message |
| **F. Chat history** (up to 25 messages + one system note per tool used, each up to 5,000 chars) | grows | 0 → **30,000+** | 0 → 25,000+ | grows every turn |
| **Total, fresh "hi"** | | **≈ 46k + history → 60k** (matches the log) | **≈ 34k** (matches the log) | |

A, B and C alone are about **42k Claude tokens** before the user has typed anything.

---

## 3. Root causes

### RC-1. One giant fixed rule text for every message (A: ~24k tokens)
The whole rulebook goes with every message: sandbox capabilities, website deployment, database schema, CRM, support tickets, group chat, email, PDF, Mermaid and so on. **Most of it only matters when that feature is used.** Biggest blocks:

| Block | Lines | Chars | Only needed for |
|---|---|---|---|
| Response style + formatting tools | c:400-425 | 5,874 | core (could be shortened) |
| Website deployment (**owner-protected text**) | c:1537-1600 | 4,884 | website building |
| Sandbox capabilities | c:73-189 | 4,148 | code / files, **duplicated** at c:982-1003 |
| Database access rules + RBAC | c:917-944 | 3,474 | database questions, **duplicated** at c:365-383 |
| Sandbox terminal + package list | c:982-1003 | 3,373 | code (duplicate of c:73-189) |
| Workflow sequences, **second copy** | c:455-493 | 3,134 | duplicate of c:195-236, and **contradicts it** (OCR rule) |
| Database schema cheat sheet | c:946-975 | 2,935 | database questions |
| Email rules | c:344-361 | 2,538 | sending email |
| Grid chat rules | c:268-283 | 2,478 | grid chat, **duplicated** at c:317-322 |
| Grid group rules | c:307-328 | 2,435 | group chat |
| Database architecture | c:365-383 | 2,403 | duplicate of c:917-975 |
| Integration + anti-hallucination rules | c:1032-1041 | 1,995 | connectors |
| Google Classroom rule | c:1529 | 1,909 | **sent even when Google isn't connected** |
| Infrastructure topology ("GOD-MODE" env vars) | c:1005-1019 | 1,741 | internal only, **also a security problem** |
| RAG fast-path (schema + embedding code) | c:831-874 | 1,628 | knowledge base |
| Support tickets / Classgrid Talk / Lead CRM workflows | c:256-301, c:1617-1622 | ~2,700 | **Classgrid staff only** |

There are about **12 duplicated or contradicting blocks** (see the `DUP` notes in the research). About **5k tokens are exact repeats.**

### RC-2. All 130 tools on every message (B+C: ~15k–19k tokens)
- The only tool filter (c:1682) removes `*_connector` tools the user hasn't connected. **Nothing else is ever removed.**
- A student saying "hi" receives:
  - 11 schedule tools
  - 14 support-ticket tools and 14 Classgrid Talk tools (staff-only)
  - 9 lead/CRM tools (staff-only)
  - 5 organization/blog tools (staff-only)
  - terminal, server logs and local file tools (staff-only)
  - 14 ERP statistics tools, 12 group-chat tools, 7 grid-chat tools, and so on
- The role checks at c:1181-1213 **have no effect**, because those names don't end in `_connector`.
- Group sizes (characters): schedules 5.8k, Classgrid Talk 5.5k, tickets 5.4k, group chat 4.9k, Google connector 4.2k, internal ops 3.4k, ERP stats 3.0k, skills 2.9k, leads 2.9k, grid chat 2.8k, GitHub 2.4k, files 2.3k, Microsoft 2.2k, sandbox 1.8k, platform 1.8k, RAG 1.7k, Vercel 1.6k…
- `search_knowledge_base` is defined twice (t:270 and inline).

### RC-3. Every tool round re-sends everything (the 188k message)
- The model reads the whole request again after every tool call. "Schedule Zoom + Google Meet" took 4 rounds (time → Zoom → Google → answer), so it was 4 × ~47k = 188k.
- Claude's cache made most of it cheap for us (110,588 cached reads + 55,294 cache writes). But **our counter still charges the user all 188k** (RC-6).

### RC-4. Two hidden title requests per new chat
1. **Frontend** `client/src/components/ai/components/AskAiPanel.tsx:3123` sends "Create a 3 to 5 word summary title…" through the **full** `/api/ai/ask` pipeline, with all rules and all tools: **~39k tokens** (log above).
2. **Backend** `generateSessionTitle` (c:495-542) asks **V4 Pro with full thinking** for a title 5 seconds later.

So every new chat makes **2 extra AI calls**, one of them ~39k tokens, just to name the chat.

### RC-5. Chat history grows without a token limit (F)
- Up to **25** previous messages (c:716).
- For every tool used, `getHistory` adds a `system` note: "Tool Used: X | Result Excerpt: …", up to **5,000 characters each**, with **no limit on how many** (`services/ai-chat-history.service.js:91-108`).
- By the 10th message of a chat that used tools, history adds **5k–30k+ tokens per round**.
- On the Claude path these notes are merged into the system text after the cache point, so they're never cached.

### RC-6. Cached tokens are charged as full tokens
- `prompt_tokens = input + cache_read + cache_write` (`services/llm-stream-anthropic.js` addUsage), and that full number is deducted (c:~3365).
- In the 60k "hi", 55,294 tokens were cache reads, which bill at 5–10% of the normal price. The user is charged as if all 60k were full price.
- This doesn't change the API bill, but it makes the usage panel and the weekly pool look 5–10× worse than reality.

### RC-7. Smaller contributors
- The time block includes a 14-day calendar (~340 tokens) on every message (c:893-906).
- The owner override text is ~580 tokens (c:880-891), only for your account.
- Connector instructions repeat the same email / mark-as-read / 72-hour rules for Google and Microsoft (c:1432, c:1439), ~1.3k tokens.
- The "THINKING RULE" (c:1020-1031) tells every model to write `<think>` tags. That's wasted text for Claude, which has native thinking.
- Our own setup before the model call takes **~1 s** (database lookups + checking 10 integrations on every message), separate from tokens.

---

## 4. Target: "hi" under 10k, ideally ~3–5k

There are two levels, depending on what Nikhil approves:

| Level | What changes | "hi" super_admin, Claude | "hi" student, DeepSeek |
|---|---|---|---|
| **Level 1:** move and de-duplicate only (no protected text touched, no rule rewritten) | tool groups + tool search, duplicates deleted, feature rules move into their groups, history budget, short connector lines | **~10.7k** (from 60,324) | **~8.0k** (from 34,225) |
| **Level 2:** Level 1 plus owner-approved changes | the website-deploy block loads only for website/deploy messages (~1.5k), the core style and formatting rules are shortened (~3–4k), the owner override is shortened (~0.4k) | **~4–5.5k** | **~3.5–4.5k** |

With cache reads charged at their real weight (RC-6), a Level 1 Claude "hi" bills like **~2.5k tokens**.

The table below shows the Level 2 budget:

| Part | Today (Claude) | Target | How |
|---|---|---|---|
| Fixed rule text | ~23,800 | **~2,500–3,500** | Keep only identity, safety, formatting, secrecy and how to ask for more tools. Every feature's rules move into its tool group and load with it. Delete duplicates. |
| Tool definitions | ~18,600 | **~800–1,500** | Load ~5 core tools always. Everything else loads only when needed: Claude uses Anthropic's built-in tool search (`defer_loading`), and Cloudflare uses keyword-matched groups plus a `load_tools` fallback tool. |
| Connector instruction text | ~2,500 | **~300** | One short line per connected service. The full rules load with that connector's tool. |
| Per-user text | ~1,200 | **~400** | One date/time line instead of the 14-day calendar. Owner override shortened. |
| History | 0 → 30k | **≤ ~3,000** | Token budget for history (~10 recent messages). Tool notes only for the last 1–2 turns, capped at ~500 characters each. |
| **Fresh "hi"** | **~60,000** | **~3,500–5,500** | |
| "list my grids" | ~60,000 | ~5,000–6,500 | core + grid chat group |
| "create a schedule tomorrow 9am" | ~60,000 | ~6,000–7,500 | core + schedules group |
| "schedule Zoom + Google Meet" (4 rounds) | ~188,000 | ~25,000–30,000 | core + Zoom + Google + schedules, × 4 rounds |
| Chat title | ~39,000 (+ a V4 Pro call) | **~150** | One small direct call: no rules, no tools, cheapest model |

On top of this, charging cached tokens at their real weight (RC-6) makes the numbers users see another ~5–10× smaller on Claude.

---

## 5. Fix plan, in order (each step tested and shown before pushing)

| Step | Fix | Saves on "hi" | Risk |
|---|---|---|---|
| **1** | **Title fix:** the frontend title request becomes a tiny direct call. Remove the duplicate backend V4 Pro title, or move it to Flash/Haiku (needs your OK, since the model comment forbids changes). | removes the extra ~39k call per new chat | very low |
| **2** | **Claude tool search:** 5 core tools loaded, ~125 deferred (already written locally, not pushed) | ~15–18k per Claude round | low: official Anthropic feature, tested |
| **3** | **Tool groups for Cloudflare:** core set + keyword groups + sticky groups per chat + `load_tools` fallback. Internal groups only for Classgrid staff (database role). | ~12–15k per Cloudflare round | medium: keywords must match well, and the fallback covers misses |
| **4** | **Split the rulebook:** delete exact duplicates, fix the contradicting OCR workflow (**needs your choice**), move feature rules into their tool groups. The website-deploy block moves as-is (owner-protected text is not edited). | ~18–20k | medium: each block is moved, not rewritten |
| **5** | **History budget:** ~10 messages, tool notes for the last 2 turns only, 500 characters each | 5–30k on long chats | low |
| **6** | **Short connector lines + one date line + shorter owner override** | ~2.5k | low |
| **7** | **Charge cache reads/writes at their real weight** in the deduction and the log | display only: ~5–10× smaller Claude numbers | low (part of Phase 1 of the master plan) |
| **8** | Faster setup: cache the integration check per user for 5 minutes | ~0.5–0.8 s faster first word | low |

After steps 1–6: **a "hi" ≈ 3.5k–5.5k input tokens on every model**, and Claude's first word ≈ 1–1.5 s.

## 6. How we'll prove it
- A measuring script prints the exact tokens of the request for: "hi" (student), "hi" (super_admin + 10 connectors), "list my grids", "create a schedule", "send an email", "check my gmail", "run python code". It runs before and after every step.
- Live checks on Claude (Haiku) and DeepSeek (Flash/Pro). Each tool-type message must still call the right tool.
- After each push, the production log lines `[AI-TOKEN] … input=` show the real numbers.

## 6b. Safety rules that come with loading tools per message
- **Only run a tool the model was given.** Today both loops (`services/llm-stream.js:250`, `services/llm-stream-anthropic.js` tool loop) pick the handler from the full handler table, so a model could call a tool it was never sent. Before running a tool, check that it is in the loaded set and that the user's role allows it.
- **Staff-only groups** (internal_ops, internal_support, internal_crm, internal_platform) are offered only when the **database** role is `super_admin` or `co_super_admin`. The current check (c:1193) also accepts any `@classgrid.in` email and uses fields the browser can send.
- **No capability is lost.** A `load_tools(groups)` tool is always available (Cloudflare), and Claude also has Anthropic's tool search. The core prompt says: *"If a capability isn't loaded, call load_tools; never say you can't."*
- **Follow-ups keep context.** Groups used in the last 2 turns stay loaded ("sticky"), and short follow-ups ("yes", "haan", "kar do", "change it") reuse the previous turn's groups.
- **Hinglish and Hindi keywords** are in every group's pattern (for example kal, subah, baje, yaad dila, bhej do, fees, haazri, छात्र, फीस, शेड्यूल).

## Appendix: detailed design
The full group list with exact tool names, keyword patterns, prompt-block moves and per-message estimates is in [AI_TOKEN_CUT_DESIGN.md](AI_TOKEN_CUT_DESIGN.md). Groups: schedules, grid_chat, grid_groups, erp_stats, files_docs, image_media, code_sandbox, email_messaging, skills_prefs, one group per connector + connector_shared, and the staff-only internal_ops, internal_support, internal_crm and internal_platform.
Core tools (always): get_my_profile, recall_session_context, open_integration_panel, get_timezone_time, search_web, search_knowledge_base, load_tools. That's about 1.1k tokens.

Tools defined with no code behind them (always fail today), to be removed: `update_skill`, `update_ai_preferences`, `search_syllabus_vectors`, `read_local_file`.

## 7. Decisions needed from Nikhil
1. **OCR workflow:** which rule is right? "OCR in the terminal" (c:206-212) or "use vision, never terminal OCR" (c:466-470)? With Claude's native vision, the second fits better.
2. **Backend title generator:** delete it (the frontend one becomes cheap) or move it to Flash/Haiku?
3. **The website-deploy block** (owner-protected): OK to load it only when the user asks to build or deploy a website? The text stays exactly as it is.
4. **Internal (staff-only) tools:** confirm "staff" = database role `super_admin` / `co_super_admin`.
5. **Level 1 or Level 2?** Level 2 means shortening the core style and formatting rules (written as a shorter version for you to approve) and the owner override text.
6. **Two other contradictions in the rules:** which CDN upload tool is correct (c:232 vs c:336), and which backtick rule is correct (c:981 vs c:1628).
