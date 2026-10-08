# Per-message tool and prompt loading: design for streamAskAi

The 60k figure is real. Almost all of it is fixed overhead, not your "hi". The model gets 127–130 tool definitions and about 78k chars of rules on every message, and most of the rules are repeated two or three times. The design below sends a small core plus only the groups a message needs. A "hi" drops to about **10.7k Claude tokens for a super_admin** (from 60,324) and about **8.0k DeepSeek tokens for a student** (from 34,225). No capability is lost.

This is read-only. I changed nothing in the repo. I checked the main code paths myself, and the line numbers below come from those checks.

## Three problems to fix first

**1. Security: tool calls are matched only against the handler table.**
- Both stream loops pick the handler by name from the full handler table: `services/llm-stream.js:250` (`toolHandlers[toolName]`) and `services/llm-stream-anthropic.js:385-392`.
- Neither loop checks that the tool was actually sent to the model. Today every tool is sent anyway, so this is hidden.
- Once tools load per message, a DeepSeek reply could name a tool it was never given and the handler would still run.
- Required fix: before running any tool, check `loadedToolNames.has(name) && roleAllows(name)`.
- Separately, students currently receive and can run `unified_db_query`, `execute_terminal_command`, `read_server_logs` and all the internal tickets, Talk, leads and organization tools. The filter at `ai-chat.controller.js:1682` only ever removes `*_connector` tools, so the role checks at c:1193-1213 do nothing.

**2. The super-admin check includes an email test.** `isSuperAdmin` (c:1193) also accepts any email ending `@classgrid.in`. Your rule is "staff = DB role super_admin or co_super_admin". Proposed check: `isStaff = ['super_admin','co_super_admin'].includes(latestUser.role)`, read from the database user record, not from the request body.

**3. Billing counts cached tokens at full price.** `prompt_tokens` adds input, cache reads and cache writes together (`llm-stream-anthropic.js:213`). That full number is deducted at c:3175 and c:3393. Weighting cache reads at 0.1× and cache writes at 1.25× is a separate fix, but it is the biggest visible saving.

## 1. Core tools (always sent, every user)

| Tool | Chars |
|---|---|
| get_my_profile (tools.js:1161) | 278 |
| recall_session_context (c:1694) | 372 |
| open_integration_panel (c:1706) | 443 |
| get_timezone_time (c:1720) | 493 |
| search_web (c:1734) | 304 |
| search_knowledge_base (tools.js:270 copy; the c:1864 duplicate is removed) | 529 |
| **load_tools** (new; its description lists the groups this user may load) | ~1,800 for staff, ~1,200 for students |

- **Total:** about 4.2k chars, which is about 1.05k DeepSeek / 1.28k Claude tokens (about 0.9k / 1.1k for students).
- **On Claude only,** `tool_search_tool_regex_20251119` is added as a backstop.

## 2. Groups

All regexes are JavaScript, case-insensitive (`/i`). Sizes are tools + prompt text in chars, then DeepSeek / Claude tokens.

**Fixed load order:** `skills_prefs, schedules, grid_chat, grid_groups, erp_stats, files_docs, image_media, code_sandbox, email_messaging, connector_shared, connector:<alphabetical>, internal_ops, internal_support, internal_crm, internal_platform`.

### Groups any user can load

**schedules** (5,775 + 2,300 → 2.0k / 2.45k)
- Tools: create_schedule, edit_schedule_time, edit_schedule_title, edit_schedule_email_subject, edit_schedule_email_body, edit_schedule_summary, edit_schedule_description, edit_schedule_action_info, delete_schedule_attachment, delete_schedule, list_schedules.
- Regex: `\b(schedul\w*|remind\w*|alarm|recurring|every\s+(day|week|month|morning|evening|night|mon|tue|wed|thu|fri|sat|sun)\w*|daily|weekly|monthly|tomorrow|tonight|kal|parso|subah|shaam|raat|baje|\d{1,2}(:\d{2})?\s*(am|pm|baje)|yaad\s*dila\w*|automat\w*|cron)\b|याद|रिमाइंडर|शेड्यूल|बजे|कल`

**grid_chat** (2,826 + ~1,580 + 900 shared grid rules → 1.33k / 1.6k)
- Tools: list_chat_threads, list_grids, read_chat_messages, send_chat_message, upload_file_to_chat, get_chat_attachment_url, search_users_for_chat.
- Regex: `\b(grids?|chats?|dm|direct\s+message|inbox|thread|send\s+(a\s+)?(message|msg)|msg|message\s+(to|bhej\w*)|bhej\s*do|bol\s*do|bata\s*do|baat\s*kar\w*)\b|मैसेज|संदेश|भेज`

**grid_groups** (4,891 + ~1,535 + the same 900 shared grid rules → 1.6k / 1.95k)
- Tools: list_group_chats, read_group_chat_details, read_group_chat_messages, send_group_chat_message, get_group_chat_attachment_url, upload_file_to_group_chat, send_group_announcement, list_group_polls, read_group_poll_details, create_group_poll, list_group_members, count_group_members.
- Regex: `\b(groups?|announce\w*|polls?|vote|voting|members?|sab\s*ko|sabko)\b|ग्रुप|घोषणा|पोल`

**erp_stats** (2,984 + ~300 → 0.8k / 1.0k). Only offered when `req.user.organization_id` is set.
- Tools: get_organization_info, get_student_count, get_teacher_count, list_recent_users, get_fee_collection_stats, list_pending_fee_defaulters, get_today_attendance_stats, list_active_classrooms, list_recent_exams, list_pending_support_tickets, list_pending_leave_requests, get_admission_stats, list_recent_leads, list_department_admins.
- Regex: `\b(students?|teachers?|staff|faculty|fees?|defaulters?|dues?|attendance|present|absent|classrooms?|classes|exams?|results?|marks|admissions?|enquir\w*|leaves?|department|hod|dashboard|stats?|statistics|kitne|kitna|bachch?(e|on)|chhatr\w*|shikshak|ha+z+ri|hajri|baaki)\b|छात्र|विद्यार्थी|शिक्षक|फीस|हाज़िरी|उपस्थिति|परीक्षा|प्रवेश`

**files_docs** (2,344 + ~4,600 → 1.75k / 2.1k). Also loads automatically whenever `body.attachments` is non-empty.
- Tools: parse_document, transcribe_audio, upload_file_to_cdn, generate_pdf, generate_pdf_from_db.
- Regex: `\b(pdf|docx?|word|pptx?|slides?|presentation|document|files?|attach\w*|upload\w*|download\w*|cdn|transcri\w*|audio|voice|recording|mp3|wav|ocr|scan\w*|certificate|letter|marksheet|report\s*card|question\s*paper|worksheet|notes)\b|पीडीएफ|फ़ाइल|फाइल|दस्तावेज़`

**image_media** (1,004 + ~300 → 0.33k / 0.4k). Also loads automatically when an image is attached.
- Tools: generate_image, analyze_image.
- Regex: `\b(images?|photos?|pictures?|pics?|poster|banner|logo|thumbnail|illustrat\w*|draw\w*|art|screenshot|tasve?e?r|tasvir)\b|फोटो|तस्वीर|चित्र`

**code_sandbox** (1,807 + ~5,900 → 1.93k / 2.34k)
- Tools: run_code, read_sandbox_file, upload_sandbox_file_to_cdn.
- Regex: `\b(run|execute|python|code|script|program|javascript|node(js)?|bash|shell|sandbox|compile|debug|pandas|numpy|matplotlib|plot|graph|chart|csv|excel|xlsx|spreadsheet|calculat\w*|compute|simulat\w*|website|landing\s*page|html|chala\w*|likh\w*)\b|` + three backticks + `|कोड|चलाओ`

**email_messaging** (1,173 + ~3,500 → 1.17k / 1.42k)
- Tools: send_email, send_whatsapp_message.
- Regex: `\b(e-?mails?|mail\s+(to|kar\w*|bhej\w*)|send\s+mail|whats\s*app|sms|notify|parents?\s+ko)\b|ईमेल|मेल|व्हाट्सएप`

**skills_prefs** (1,264 → 0.32k / 0.38k)
- Tools: create_skill, list_skills, read_skill, delete_skill.
- update_skill and update_ai_preferences are dropped because they have no handler, so calling them fails today. If you want them back, add the handlers first.
- Regex: `\b(skills?|preferences?|prefer|remember|from\s+now\s+on|always\s+(reply|respond|answer)|tone|style|about\s+me|personali[sz]e|custom\s+instruction|yaad\s*rakh\w*)\b`

### Connector groups

A connector group is offered only when its integration is connected (conditions at c:1413-1422, 1452, 1459, 1469). Loading any connector also loads **connector_shared** (~2,000 chars → 0.5k / 0.6k). It holds a single merged copy of these rules:
- c:907 timezone
- c:1049-1055 duplicate action
- c:1057-1063 integration separation
- c:1065-1069 empty results

| Connector | Tool chars + prompt chars | Regex |
|---|---|---|
| google (google_workspace_connector) | 4,154 + trimmed plugin text ~600 (today 2,190) + c:1529 Classroom rule + c:969 + c:1602 → 7.7k chars, about 2.94k Claude tokens with shared rules | `\b(g-?mail|google|g?drive|docs?|sheets?|calendar|meet|classroom)\b`, plus generic `\b(mail|inbox|unread|meeting)\b`, which loads every connected mail or meeting provider |
| microsoft | 2,209 + ~600 | `\b(outlook|microsoft|ms\s*365|office\s*365|onedrive|teams|sharepoint|hotmail)\b`, plus the same generic mail/meeting words |
| zoom | 682 + 110 | `\b(zoom|meeting|video\s*call)\b` |
| slack | 1,420 + 590 | `\b(slack|channels?)\b` |
| github | 2,402 + 405 | `\b(git\s*hub|repo\w*|commits?|pull\s*request|pr|branch|push)\b` |
| vercel | 1,614 + 155 | `\b(vercel|deploy\w*|hosting|domain|live\s*kar\w*)\b` |
| notion | 991 + 405 | `\b(notion|wiki)\b` |
| youtube | 718 + 110 | `\b(you\s*tube|yt|videos?|views|subscribers)\b` |
| supabase | 602 + 115 | `\b(supa\s*base|postgres|sql)\b` |
| sanity | 665 + 560 | `\b(sanity|cms|blog\s*posts?)\b` |
| facebook | 764 + 315 | `\b(facebook|fb|meta)\b` |
| instagram | 777 + 315 | `\b(insta(gram)?|ig|reels?|stor(y|ies))\b` |
| whatsapp_business | 429 + 120 | `\bwhats\s*app\b` |

### Staff-only groups (isStaff only)

Students never receive these definitions or their prompt text.

**internal_ops** (3,074 + ~8,400 → 2.9k / 3.5k)
- Tools: unified_db_query, execute_terminal_command, read_server_logs. read_local_file is dropped because it has no handler.
- Prompt: one merged copy of the database rules (c:365-383, c:917-944 and c:946-975 combined, about 4.5k chars), c:1005-1019 topology, c:831-874 RAG fast-path, c:1605 rate limit, c:389 Voyage line.
- Regex: `\b(db|database|mongo\w*|redis|supabase|sql|query|collections?|schema|logs?|terminal|ssh|env|ec2|aws|r2|bucket|infra|rag|embeddings?|voyage|signups?|platform\s+users)\b`

**internal_support** (10,884 + ~1,700 → 3.15k / 3.8k)
- Tools: all 14 `*_support_ticket*` tools (tools.js:775-840) and all 14 `*_classgrid_talk*` tools (tools.js:847-912).
- Prompt: c:256-267, c:395-399 and c:1617-1622, merged.
- Regex: `\b(tickets?|support|complain\w*|helpdesk|talks?|escalat\w*|shikayat)\b|शिकायत`

**internal_crm** (2,863 + 956 → 0.95k / 1.16k)
- Tools: list_leads, read_lead_details, assign_lead, update_lead_info, update_lead_meeting_notes, schedule_lead_meeting, request_lead_vetting_approval, approve_lead_and_provision, delete_lead.
- Regex: `\b(leads?|crm|prospects?|demo|vetting|provision\w*|onboard\w*|sales|pipeline)\b`

**internal_platform** (1,757 + 696 → 0.6k / 0.74k)
- Tools: list_organizations, read_organization_details, count_organization_users, list_blog_subscribers, count_blog_subscribers.
- Regex: `\b(organi[sz]ations?|orgs?|institutes?|tenants?|subdomains?|subscribers?|newsletter)\b`

A message that matches nothing gets the core set only.

## 3. Prompt blocks

**Stays in the core prompt** (about 26k chars, about 6.5k DeepSeek / 7.9k Claude tokens). This includes the protected block.

| Lines | Block | Note |
|---|---|---|
| c:60-72 | Identity, audience, `${supportedRoles}` | |
| c:195-197 | Workflow header | Shortened to about 120 chars, with the internal_thought_process wording removed (see the THINKING conflict below) |
| c:218-231 | WF4, WF5, WF6 | |
| c:362-364, c:384-386 | Academic hierarchy, syllabus search | |
| c:387-394 | User profile | Without the Voyage line |
| c:400-425 | Response style | Approval cards (c:420-423) move to code_sandbox |
| c:426-454 | Formatting tricks, greeting, secrecy, context, safety | Duplicates removed |
| c:909, 915, 977, 979 | Critical instruction, error reporting, mermaid, loop rule | |
| c:1020-1041 | Thinking, integration, anti-hallucination | |
| c:1624, 1628 | Plugin/role definition, backtick rule | Only one backtick rule kept (see conflicts) |
| c:1071-1079 | Routing | Rewritten as a one-paragraph router that points to groups |
| c:1537-1600 | **Website deployment (owner-protected)** | Stays core and unedited. It can move behind code_sandbox, github or vercel only with owner approval; that would save about 1.2k–1.5k tokens per message. |

**Moves into a group** (as listed in section 2):

| Group | Blocks |
|---|---|
| schedules | c:237-255, c:329-335, c:1608 |
| grid_chat | c:268-283 |
| grid_groups | c:307-328 (shared grid rules merged once) |
| files_docs | c:190-194, c:206-217 (WF2 rewritten to match c:466), c:232-236, c:336-343, c:913, c:1531-1535, c:1602-1604 |
| code_sandbox | c:73-189 (unique libraries from c:982-1003 merged in), c:420-423, c:1611-1615 |
| email_messaging | c:198-205, c:344-361, c:911 |
| internal_ops | c:365-383, c:917-975 (merged), c:831-874, c:1005-1019, c:1605 |
| internal_support | c:256-267, c:395-399, c:1617-1622 |
| internal_platform | c:284-289, c:302-306 |
| internal_crm | c:290-301 |

Non-staff users get one line in place of the database rules: "You have no database access."

**Becomes connector-only:**
- c:1426-1527: each integration's paragraph moves into its connector group.
- Every message keeps one summary line, about 300–450 chars, listing connected integrations with their account emails.
- c:1529 (Google Classroom rule) moves to google.
- c:907, c:1049-1069 move to connector_shared.

**Dead or duplicate, safe to remove:**

| Lines | What it is |
|---|---|
| c:455-493 | Second copy of WF1-7 (3,134 chars) |
| c:982-1003 | Second sandbox capability list (3,373 chars) |
| c:427 / c:428 | The same emoji line twice |
| c:978 | Ack rule; acknowledgement words are short-circuited before the LLM at c:808 |
| c:980 | Duplicate of c:915 |
| c:1043-1047 | Duplicate of the c:909 parentheses ban |
| c:1427-1509 | disconnectedLinks, built but never sent |
| Mojibake | About 380 chars in SYSTEM_PROMPT, about 100 per plugin prompt |
| Tool definitions with no handler | update_skill, update_ai_preferences, search_syllabus_vectors, read_local_file |

**Contradictions the owner needs to decide:**
- c:981 vs c:1628 (backtick rules).
- c:206 vs c:466 (WF2 OCR method).
- c:232 vs c:336 (which CDN upload tool to use).
- c:1020 THINKING rule vs the workflows that require internal_thought_process. That tool is filtered out at llm-stream.js:170 and in toClaudeTools anyway.

**Also needs owner approval:** trimming the creator override at c:880-891.

## 4. How groups get loaded

### load_tools (both providers)

```
load_tools({ groups: string[] })
```
- `groups` is an enum of only the groups this user may load: role-allowed, and for connectors only those connected.
- The description gives one line per group.
- The result is `{loaded, tools: [names], instructions: <group prompt text>, denied: [...]}`.
- The handler checks each group against `allowedGroups(user)`, adds it to the session's sticky set, and adds its tools to `loadedToolNames`.
- The group's rules come back in the tool result, so the system prefix does not change during the turn.

**Cloudflare / DeepSeek** (`services/llm-stream.js`):
- Today `const allTools` is built once at :170 and reused for every round (:188).
- Change it to read from a shared `toolState.list` that is rebuilt each round, so tools loaded mid-turn appear on the next round.
- Add the dispatch check at :250: refuse to run any tool not in `toolState.names`.
- Controller (c:1680-1690): `tools = core + groups for (keyword matches ∪ sticky set ∪ attachment auto-groups)`, in the fixed order. Group prompt blocks go after the static core and before `volatilePrompt` (c:1652).

**Claude** (`services/llm-stream-anthropic.js`):
- `toClaudeTools` (:182-200) sends core tools without `defer_loading`, then `tool_search_tool_regex_20251119`, then **every role-allowed tool** with `defer_loading: true`, in the fixed order.
- This keeps the tools array byte-stable per (role, connector set), so the cache keeps working.
- Move `cache_control` to the last non-deferred tool.
- Matched and sticky groups are switched on with a `{role:"system", content:[{type:"tool_addition", tool:{type:"tool_reference", name}}…, {type:"text", text: groupRules}]}` message placed right after the current user message (beta `mid-conversation-tool-changes-2026-07-01`).
- When load_tools is called mid-turn, the same addition message goes right after its tool_result.
- Supported for claude-opus-5-5, claude-sonnet-5-5 and claude-fable-5-1. **claude-haiku-5-5 is not on the supported list:** for that model, fall back to the Cloudflare approach (send the groups' tools directly, accepting a cache miss when the set changes).
- Tool search then covers anything keywords missed.
- `:242` currently joins every `role:'system'` message into the top-level system text. It must pass the addition messages through in place.
- Do not count deferred tools with `count_tokens` (it rejects server tools). Measure actual billed input with a `max_tokens:1` request instead.

## 5. Sticky groups per session

- Store the set in Redis at `ai:groups:{sessionId}`, with the same TTL as the session's history.
- Each turn loads: core ∪ regex matches on the current message ∪ sticky set ∪ groups of any tool used in the last 2 assistant turns (taken from the history steps) ∪ attachment auto-groups.
- A short follow-up reuses the previous turn's groups exactly. Short means 6 words or fewer, or matching `^(yes|no|ok(ay)?|haan|ha|nahi|theek|thik|kar\s*do|same|change|edit|again|aur)\b`.
- A group is dropped after 4 user turns in which it neither matched nor had a tool called.
- At most 4 non-core groups are sticky (oldest-used dropped first). Removal only happens between turns.
- Incognito: compute the set per message and do not store it.

## 6. History fix

Assistant history does **not** carry the `thought` or `args` JSON. `getHistory` replaces the content with `inner.content` (`ai-chat-history.service.js:84-111`). But every stored step comes back as a `role:'system'` note of up to 5,000 chars, with no limit on the number of steps (:91-108). On Claude these notes are moved into the uncached system text (`llm-stream-anthropic.js:242`).

Changes:
- Cap each step at 600 chars, but always keep any `https?://` URL found in the result.
- Keep notes only for the last 2 assistant turns.
- Set a total budget of about 1.5k tokens.
- On Claude, keep the notes in place as mid-conversation system messages instead of merging them into the system prompt.
- Add a `cache_control` breakpoint on the last history message.
- Replace the fixed depth of 25 (c:716) with a budget of about 6k tokens.
- Apply the same unwrapping in the Supabase fallback path (:216-221), which currently drops the notes entirely.
- Use the step tool names to rebuild the sticky set.

## 7. Estimated input tokens after the change (first model round)

| Message | super_admin, 10 connectors, Claude (today 60,324) | Student, DeepSeek (today 34,225) |
|---|---|---|
| "hi" | ~10.7k | ~8.0k |
| "list my grids" | ~12.3k | ~9.3k |
| "create a schedule for tomorrow 9am" | ~13.2k | ~10.0k |
| "search the web for X" | ~10.7k, plus the search result rounds | ~8.0k |
| "run python code" | ~13.1k | ~9.9k |
| "send an email to Y" | ~12.1k | ~9.1k |
| "check my gmail" | ~13.7k (~14.2k with the Google text untrimmed) | ~10.4k if Google is connected; ~8.0k if not (core only, open_integration_panel) |

- Moving the protected block behind code_sandbox, github or vercel would save about 1.5k Claude / 1.2k DeepSeek tokens on every row.
- On Claude, about 9k of each row is cacheable prefix. With cache reads counted at their real weight, a "hi" bills like about 2.5k tokens.
- On the 10th message, add history capped at about 6k plus at most about 1.5k of tool notes.

## 8. Risks and how each is covered

| Risk | Cover |
|---|---|
| Keywords miss a needed tool | load_tools on both providers, plus tool search on Claude. Core routing line: "If a capability isn't loaded, call load_tools, never say you can't." |
| Follow-up loses context | Short-follow-up rule, sticky set, groups taken from the last 2 turns' steps |
| Model calls a tool that wasn't sent, or a student loads internal tools | Dispatch check at llm-stream.js:250 and anthropic:385; role check inside load_tools; role checks in internal handlers as extra protection |
| Cache churn on Claude | Tools array fixed per role and connector set; changes go through tool_addition messages placed at the end |
| Cache churn on Cloudflare | Fixed group order; a new prefix only when the group set changes |
| Group rules arrive mid-turn after a load_tools call | Rules returned inside the tool result |
| claude-haiku-5-5 doesn't support mid-conversation tool changes | Send groups directly instead |
| Hinglish and Devanagari wording missed | Mixed regex; log every load_tools call together with the message so missing keywords can be added |
| Regex over-matching (for example "kal", "file", "chart") | Costs at most about 2.4k tokens; harmless |
| Removing the duplicate WF2 changes OCR behaviour | Owner decides which version to keep |
| Owner-protected and creator text | Untouched unless the owner approves |
| Deferred-tool token accounting not yet measured | Check with a `max_tokens:1` request and `cache_read_input_tokens` before rollout |