# AI Chat — Master Fix Plan

Written 8 Oct 2026, from a read-only investigation of the code. Each finding was checked a second time by an independent reviewer.
File paths are under `server/src` unless they start with `client/`.

**Rules for doing this plan**
- Fix one step at a time. Each step is explained first, then waits for Nikhil's OK.
- Push only when Nikhil says "push". A push to `main` deploys to production (EC2 + Vercel).
- No localhost testing. `.env` points to production databases.

---

## Recommended order (short version)

| Phase | What | Why this order |
|---|---|---|
| **1** | Fix token counting and deduction | Claude costs real money from the $1,000 grant. Counting must be right before we add it. |
| **2** | Add Claude (Anthropic) backend + token logging | The main goal. It uses the Phase 1 counting from day one. |
| **3** | Connect the model dropdown to the backend, then push the dropdown | The dropdown is already built locally. It should only go live once picking a model works. |
| **4** | Cut tokens per message (34k → ~5.5k for "hi") | Makes every model cheaper and faster, Claude included. |
| **5** | Fix "student" role → "user" for chat.classgrid.in | Wrong label today. Needed for correct limits and features. |
| **6** | Security fixes | **Must be done before public launch.** Item 6.2 can be abused on the live server today, so consider doing it earlier. |
| **7** | Small bugs and cleanup | Low risk. Do any time. |

---

## Phase 1 — Token counting and deduction

### 1.1 Two different weekly limits (main bug)
- **Problem:**
  - The check before a request uses the effective limit. For Nikhil's account that is **100,000,000** (`services/ai-credits.service.js:51-95`).
  - The deduction after the request uses only the user's own field, `free_weekly_limit || 100000` (`ai-credits.service.js:275`).
  - Once 100,000 is used, the deduction takes **0** and still reports success (`:276-281`).
  - The result: after the first 100k tokens each week, every message is free, and the 100M promo grant shows "Used: 0".
- **Fix:**
  - Write one shared function `getEffectiveWeeklyLimit(user, org, config)`.
  - Use it in `hasEnoughTokens`, `deductTokens`, `getMyUsage` (`controllers/ai-chat.controller.js:4411-4430`) and the FREE pool of `getMyCredits` (`controllers/ai-credits.controller.js:36-38`).
- **Needs from Nikhil:** what should the free weekly limit really be? 100k? A 100M free limit would mean the grant is never used.

### 1.2 Spill-over between pools
- **Problem:**
  - When a pool doesn't have enough left, the rest of the cost is silently dropped (`ai-credits.service.js:243-245, 260-262, 278-281, 299-301`).
  - Nothing moves on to the promo grant or paid credits.
- **Fix:**
  - `deductTokens` charges the free room first, then the promo or paid credits (oldest first), then the org pool.
  - It returns what was charged and what wasn't.
  - Keep the admin rewrite in `controllers/super-admin/ai-usage-users.controller.js:105-126` consistent with this.

### 1.3 The check before a request is too weak
- **Problem:**
  - It assumes every request costs only 3,000 tokens (`ai-chat.controller.js:645`). A real one costs about 34k.
  - If the check itself errors, the request is still allowed (`:660-662`).
  - It falls back to `body.userId` from the browser (`:633`).
- **Fix:**
  - Estimate from the real prompt size.
  - Block when all pools together are below the estimate.
  - Block when the check errors.
  - Use only `req.user.id`.

### 1.4 Background AI calls are never charged
- **Problem:** none of these are charged or logged:
  - chat title generation (`ai-chat.controller.js:495-542`, which uses V4 Pro)
  - image prompt enhancement (`:4201-4214`)
  - the build worker (`workers/buildWorker.js:20-35`)
- **Fix:**
  - Count their usage, deduct it, and write it to `AiUsageLog`.
  - Move titles to Flash or Haiku 5.5. **This needs Nikhil's OK**, because the comment at `ai-chat.controller.js:497-499` forbids changing that model.

### 1.5 The Flash → Pro retry overwrites usage
- **Problem:** if Flash fails partway and Pro then answers, Flash's tokens are lost (`ai-chat.controller.js:3162, 3167`).
- **Fix:** add the usage from both attempts together.

### 1.6 The usage panel shows the wrong info
- **Problem:**
  - "Monthly" is hardcoded (`client/.../AiUsageBar.tsx:82`).
  - "Resets in 7 days" is fixed text (`:85`).
  - 0.1% is shown as 0% (`:92`).
  - The promo/paid part of `getMyUsage` is switched off with `if (false)` (`ai-chat.controller.js:4471`).
- **Fix:**
  - Label it "Weekly".
  - Calculate the countdown from `resetDate`.
  - Show "<1%" for small values.
  - Show the grant balance.

---

## Phase 2 — Claude (Anthropic) backend support

**Already confirmed:** the Anthropic key works. All 14 Claude models are available. Haiku 5.5, Sonnet 5.5, Opus 5.5 and Fable 5.1 each answered a live test.

### 2.1 New Claude streaming provider
- **What:**
  - A new file, `services/llm-stream-anthropic.js`, using the official `@anthropic-ai/sdk`.
  - Same features as today: streaming text and thinking, tool calls, parallel tools, the duplicate-call guard and a max depth.
  - `llm-stream.js` (the Cloudflare/OpenAI-style path) is **not touched**.
- **Claude details:**
  - **Thinking:** adaptive thinking with `display: "summarized"`, so the thinking still shows live in the UI.
  - **Effort:** low for chat, medium/high for hard tasks.
  - **Unsupported settings:** no `temperature` (Claude 5.x rejects it).
  - **Refusals:** handle the `refusal` stop reason, with server-side fallback turned on.
- **Key:** `ANTHROPIC_API_KEY` in the EC2 `.env`. Nikhil adds it himself. It is never written into code or chat.

### 2.2 Prompt caching
- **What:**
  - Put the fixed prompt and tools first, with a cache breakpoint after them.
  - Put the per-user context last. This was already moved there in commit `37cf38b1`.
  - Cache reads cost 5–10% of the normal input price.

### 2.3 Token usage logging (same table)
- **What:**
  - Map Claude's usage (`input_tokens`, `output_tokens`, `cache_read_input_tokens`, `cache_creation_input_tokens`) into the same `AiUsageLog` fields.
  - Print the same `[AI-TOKEN]` and `[AI-TOKEN-DEDUCTION]` log lines.
  - Set `model` to the Claude model id.
  - Deduct through the fixed Phase 1 logic.
- **Needs from Nikhil:** should a cached token count as a full token against the user's weekly limit, or at a discount?

### 2.4 Router hook
- **What:**
  - Next to `pickChatModel` (`ai-chat.controller.js:610-617`), send the request to the Claude provider when a Claude model is chosen.
  - If Claude fails before any tool has run, fall back to DeepSeek V4 Pro.

---

## Phase 3 — Model dropdown goes live

### 3.1 Backend reads `selectedModel`
- **What:**
  - The frontend already sends `selectedModel` with each message.
  - The backend checks it against a server-side allowlist (the same list as `docs/AI_MODEL_PICKER_LIST.md`). It never trusts any string the browser sends.
  - **Auto:**
    - Haiku 5.5 or Flash for simple messages
    - Sonnet 5.5 or V4 Pro for normal tasks
    - Opus 5.5 for hard ones
    - DeepSeek on Cloudflare as backup
- **Needs from Nikhil:**
  - Can everyone pick Opus 5.5 and Fable 5.1, or only some users?
  - What should Auto use?

### 3.2 Push the dropdown
- **Status:** built locally, not committed.
  - New file `client/src/components/ai/components/ModelPicker.tsx`.
  - 7 lines changed in `AskAiPanel.tsx`.
- **Contents:**
  - 19 models plus Auto.
  - Logos from `cdn.classgrid.in`.
  - Remembers the choice.
  - Reviewed. The one problem the review found (text overlap) is fixed.
- **When:** push together with 3.1.

---

## Phase 4 — Cut tokens per message

**Today:** about 34k input tokens even for "hi". That is about 130 tools (~48k characters) plus the prompt (~81k characters).

### 4.1 Tool groups
- **What:**
  - A small core set is always sent.
  - Topic groups load by keyword and stay loaded for the rest of the chat (stored in Redis as `ai:groups:{sessionId}`): schedules, grid chat, grid groups, files, code sandbox, image, email, skills and preferences, knowledge, ERP stats, each connector.
  - A `load_tools(group)` fallback lets the AI fetch any group it needs.
- **Where:** apply it to `llmConfig.tools` (before `ai-chat.controller.js:1636`), so both the streaming path and the SDK fallback get it. `streamChat` must re-read the tool list each round (`llm-stream.js:170`).

### 4.2 Prompt follows the tools
- **What:**
  - Prompt rule blocks are only sent when their tool group is loaded.
  - The Google Classroom rule (`:1505`) and the integration rules (`:1008-1041`) only go to users who connected those services.
- **Protected block:** the website-deploy block (`:1514`) is marked "do not modify". It can be moved behind a group with Nikhil's OK, but its text stays as it is.

### 4.3 Fix the duplicate workflows in the prompt
- **Problem:** `ai-chat.controller.js:454-492` repeats the workflows and contradicts `:205-210`. One says to do OCR in the terminal, the other says never to.
- **Needs from Nikhil:** pick which version is correct, then delete the other.

### 4.4 Expected result

| Message | Today | After |
|---|---|---|
| "hi" | ~34k | ~5.5k |
| "list my grids" | ~34k | ~6.8k |
| "create a schedule" | ~34k | ~7.6k |
| "run python code" | ~34k | ~8.3k |

---

## Phase 5 — Role: "student" → "user" on chat.classgrid.in

### 5.1 New sign-ups
- **Problem:**
  - Google and GitHub chat sign-up send `loginTab=user`.
  - The backend doesn't recognize "user" and turns it into **"student"** (`services/oauth-state.service.js:50, 117`).
  - That value then becomes the role (`services/passport.service.js:211, 218, 287, 294`).
- **Fix:**
  - Set `role: "user"` directly in the `google-chat` and `github-chat` strategies.
  - Cover both `/api/auth/google` and `/api/auth/chat/google`.

### 5.2 Existing accounts
- **Problem:**
  - Accounts made before 7 Oct 2026 are "student", and nothing upgrades them.
  - `chatFinalizeOnboarding` only sets a role when it's empty (`controllers/auth.controller.js:3271`).
  - The database default is "student" (`models/User.js:106`).
- **Fix:**
  - When the org is `6ac4…` and the role is "student", upgrade it to "user".
  - Run a one-time migration, after Nikhil approves:
    1. Count the accounts first (dry run).
    2. Then `updateMany` for org `6ac4`, role "student", excluding `@classgrid.in` emails.
  - No re-login is needed, because the login check reloads the user from the database.
- **Needs from Nikhil:**
  - Are there real students or admins in org `6ac4`?
  - Should "user" be added to `pro_enabled_roles` (`models/Organization.js:626-630`)?

---

## Phase 6 — Security (must be done before public launch)

### 6.1 Every production key goes into the code sandbox — CRITICAL
- **Problem:**
  - `run_code` and `execute_terminal_command` copy every `.env` variable into Docker (`mcp/tools.js:3546-3553, 3647-3654`).
  - The prompt tells the AI it has "GOD-MODE access to ALL 200+ environment variables" (`ai-chat.controller.js:981`).
  - Any user could ask the AI to print the JWT secret, the MongoDB URL, the Razorpay secret and so on.
- **What actually needs keys:**
  - website deploy: the 3 R2 keys
  - embeddings: `VOYAGE_API_KEY`
- **Fix:**
  - **Option A (quick):** send only those 4 keys, and use a new R2 key that can only write to `websites/`. Remove the GOD-MODE prompt line.
  - **Option B (before launch):** send no keys at all. The server does the upload with a new `deploy_website` tool, and does the embeddings through a tool.
- **Keys:** not public yet, so rotating isn't needed now, unless the AI was ever asked to print them.

### 6.2 Account takeover through `chatFinalizeOnboarding` — CRITICAL, works on the live server today
- **Problem:**
  - The route (`routes/auth.routes.js:103`) needs **no login**.
  - It only checks a WhatsApp OTP sent to a phone number the caller chooses.
  - It then finds **any** account by the email in the request.
  - It **overwrites that account's password** and returns a 30-day token (`controllers/auth.controller.js:3237-3282`).
  - It also returns the whole user document.
  - This works on any account without a saved WhatsApp number, including ERP admins.
  - The uncommitted local edit (moving the WhatsApp check into send-OTP) does **not** close this hole.
- **Fix:**
  - Require proof the email was verified (the login token from `chatVerifyEmailOtp`, or a signed ticket).
  - Never overwrite an existing password.
  - Check OTP expiry and delete the OTP after use.
  - Return only safe fields.

### 6.3 Internal tools go to every user
- **Problem:**
  - The role filter does nothing, because it only touches `*_connector` tools (`ai-chat.controller.js:1658`).
  - So every user gets:
    - 28 support-ticket and Classgrid Talk tools (with no identity check)
    - delete-lead and provision-lead (with no auth, `mcp/tools.js:3073-3098`)
    - `read_server_logs`, which runs pm2/tail on the API host (`mcp/tools.js:4081-4097`)
    - `list_organizations`, which returns full documents
    - the 14 org tools, including `list_recent_users`, which returns other users' names and emails
  - The infrastructure block in the prompt (`ai-chat.controller.js:981-994`) also goes to everyone.
- **Fix:**
  - One helper, `isInternalStaff(req.user)`, based on the **database** role (`super_admin` / `co_super_admin`).
  - Internal groups only for staff, and checked again inside each handler.
  - No org tools for the public chat org `6ac4`.

### 6.4 The backend trusts values the browser sends
- **Problem:**
  - Any user can unlock AI email sending by sending `userRole: "super_admin"` (`ai-chat.controller.js:2390`).
  - Another user's classes and reminders can be read by sending their email (`:1061`, `:544-600`).
  - The prompt label "SUPER ADMIN / PLATFORM OWNER" and the creator override come from `body.userEmail` (`:856, 1070-1079`).
  - `unified_db_query` falls back to `body.userRole` (`:1938`).
  - `body.userEmail` is used 53 times in the controller.
- **Fix:** use only `req.user.role` and `req.user.email` for decisions, prompts and lookups.

### 6.5 Other
- `userEmail` defaults to `unknown@classgrid.in` (`ai-chat.controller.js:699`, `mcp/tools.js:1343`), which can make an unknown user look like Classgrid staff.
- The staff checks disagree. Some include `co_super_admin`, some don't (`ai-chat.controller.js:1170` vs `mcp/tools.js:1598, 1713`).
- Delete the unused `chatSendOtp`, `chatVerifyOtp` and `chatOnboard`, which contain a hard-coded OTP `123456`.

---

## Phase 7 — Small bugs and cleanup

| # | Bug | Where |
|---|---|---|
| 7.1 | `search_knowledge_base` is sent twice | `mcp/tools.js:270` and `ai-chat.controller.js:1840` |
| 7.2 | 4 tools have no handler, so the model gets "Unknown tool": `read_local_file`, `update_ai_preferences`, `update_skill`, `search_syllabus_vectors` | tool list vs handlers |
| 7.3 | 3 handlers have no tool: `edit_image`, `get_my_ai_user_id`, `internal_thought_process` | `ai-chat.controller.js:2265, 2976, 1856` |
| 7.4 | `send_email` requires `body` but defines `htmlBody` | `ai-chat.controller.js:1819-1832` |
| 7.5 | `aws_ses_connector` is never offered; `cloudflare_r2_connector` is offered but its definition is commented out | `ai-chat.controller.js:1399`, `mcp/tools.js:409-412` |
| 7.6 | The prompt tells the AI to use `read_local_file`, which has no handler (and would be an arbitrary file read) | `ai-chat.controller.js:375`, `mcp/tools.js:3106-3112` |
| 7.7 | If streaming fails partway after answer text was already shown, a retry can add a second answer below it | `ai-chat.controller.js:3165-3176` |
| 7.8 | A misleading "base allowlist" that does nothing | `ai-chat.controller.js:1157-1167` |

---

## Already done (live on production, commit `86c5b3b`)
- Answers stream live, and the typing no longer slows down (`475cd1e2`).
- Flash/Pro routing, the faster Cloudflare endpoint, and the cache-friendly prompt order (`37cf38b1`).
- Tool boxes stay closed until clicked (`9f750f3b`).
- Parallel tool calls are no longer blocked as "ALREADY called" (`86c5b3b`).

## Open questions for Nikhil
1. What is the real free weekly limit (Phase 1.1)?
2. Do cached tokens count as full tokens against the weekly limit (Phase 2.3)?
3. Who can pick Opus 5.5 and Fable 5.1, and what should Auto use (Phase 3.1)?
4. Can chat titles move from V4 Pro to Flash or Haiku 5.5 (Phase 1.4)?
5. Which OCR workflow is correct, terminal or vision (Phase 4.3)?
6. Are there real students or admins in org `6ac4` (Phase 5.2)?
7. For keys in the sandbox, Option A now and B before launch (Phase 6.1)?
8. Should 6.2 (account takeover) be fixed now, since it works on the live server?

---

## Status update — 8 Oct 2026, evening

| Phase | What | Status |
|---|---|---|
| 2 | Claude backend + token logging | ✅ Done, pushed in `0faf5dc5` |
| 3 | Model dropdown working end to end (4 Claude + 15 Cloudflare + Mistral Small) | ✅ Done, pushed in `0faf5dc5` and `7c9edb93` |
| 4 | Cut tokens per message: "hi" 34k → ~3.8k (DeepSeek), 60k → ~6.9k mostly cached (Claude) | ✅ Done, pushed in `dc03082a` |
| 4.3 | OCR rules kept for Cloudflare models only; Claude reads images and PDFs natively | ✅ Done, pushed in `dc03082a` |
| 6.3 | Internal tools only for staff (database role `super_admin` / `co_super_admin`); `run_code` for everyone | ✅ Done, pushed in `dc03082a` |
| 7.1, 7.2 | Duplicate `search_knowledge_base` removed; tools with no handler no longer sent | ✅ Done, pushed in `dc03082a` |
| — | Uploaded files remembered across turns; Claude caches the conversation | ✅ Done, pushed in `81f214ad` |
| 1.4 | Chat titles moved to Flash, re-titled every 5 messages | ✅ Done, pushed |
| 1.1, 1.2 | Deduction uses the dashboard limit (was stuck at 100k); spill-over free → promo/paid (oldest first) → org pool | ✅ Done, pushed in `47605484` |
| 1 (pricing) | Pool tokens by real model price (DeepSeek V4 Pro = 1×); cached tokens at their real weight | ✅ Done, pushed in `47605484` |
| — | WhatsApp + image limits: one shared rule (`services/ai-feature-limits.js`), the dashboard shows the real limit, counted per week, direct WhatsApp sends counted too, counted on the signed-in user | ✅ Pushed (evening batch) |
| — | Website build tokens: new `push_sandbox_files` (all listed files in one GitHub commit, server-side; hidden/key files never pushed), several files per `run_code` call. ~38 rounds → ~5 for a React site | ✅ Pushed (evening batch) |
| 6.2 | Account takeover: finalize needs a signed email-verified ticket, never overwrites an existing password, OTP expiry checked, one WhatsApp number per email, safe fields only | ✅ Pushed (evening batch) |
| 6.5 | Dead `chatSendOtp` / `chatVerifyOtp` / `chatOnboard` (hard-coded `123456`) | 🟡 Unreachable (no routes), but the code is still in `auth.controller.js` — delete by hand |
| 1.3 | Pre-check estimates the real prompt size, fails closed, uses `req.user` only | ✅ Pushed (evening batch) |
| 1.5 | Flash → Pro retry adds both usages | ✅ Pushed (evening batch) |
| 1.6 | Usage panel: "Weekly", real reset countdown, "<1%" | ✅ Pushed (evening batch) |
| 5 | New chat sign-ups get role "user"; finalize upgrades "student" → "user". Migration `server/scripts/migrate-chat-students-to-user.js` written, **not run** (dry run by default; `--apply` after approval) | 🟡 Code pushed, migration waiting |
| 6.1 | Sandbox gets only R2 + Voyage keys (+ `MONGO_URI` for staff only); "GOD-MODE 200+ env vars" prompt line removed | ✅ Pushed (evening batch) |
| 6.4 | Decisions, prompt labels and lookups use `req.user`, not body `userEmail` / `userRole` | ✅ Pushed (evening batch) |
| 7.3–7.8 | Small bugs (send_email schema, double answer after retry, fake allowlist, read_local_file rule, cloudflare_r2_connector without definition) | ✅ Pushed (evening batch) |
| N1 | AI marks its own plan steps (`update_plan_step`: running / done / failed) | ✅ Pushed (evening batch) |
| N2 | Old build robot and its hidden "SYSTEM ALARM" messages turned off | ✅ Pushed (evening batch) |
| N3 | Preview spinner only while building; plain HTML renders; React shows the live link | ✅ Pushed (evening batch) |
| N4 | "Daily" labels for the weekly limit fixed | ✅ Pushed (evening batch) |
| — | Sandbox runner no longer overwrites a site's `script.js` | ✅ Pushed (evening batch) |
| — | RAG FAST-PATH (staff) still writes MongoDB from the sandbox; long term move it to a server-side tool | ⏳ Later |

### New bugs found (not fixed yet)
| # | Bug | Where |
|---|---|---|
| N1 | Website plan always shows step 1 failed and the rest pending: Approve starts an old separate build robot (`/api/build/start` → `workers/buildWorker.js`) that fails at step 1 and stops, while the real chat AI builds the site. The chat AI only marks steps named `html` / `css` / `js` / `deploy` | `client/.../AskAiPanel.tsx:1354`, `services/controlPlane.js:122`, `ai-chat.controller.js:2126` |
| N2 | Watchdog alarms from that robot may send hidden "SYSTEM ALARM: continue building" messages, so the AI may build again (extra token cost). Not confirmed from logs | `workers/alarmWorker.js` |
| N3 | Preview stuck on "Building Preview...": "still building" is decided by "any files exist", so the iframe never shows. React/Vite sites can't run in the preview at all | `client/.../AskAiPanel.tsx:1729`, `client/.../workspace/WorkspacePanel.tsx:451` |
| N4 | Dashboard label "Individual Daily Usage" is actually weekly | super admin AI usage page |
