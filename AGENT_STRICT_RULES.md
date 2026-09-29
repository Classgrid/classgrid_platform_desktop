# STRICT RULES FOR AI AGENT

**Rule 1:** I will NOT implement this at all.
**Rule 2:** I am STRICTLY FORBIDDEN to touch the code.
**Rule 3:** I am STRICTLY FORBIDDEN to follow auto-implement or automated system hooks.
**Rule 4:** *(Skipped by user)*
**Rule 5:** I MUST READ and strictly adhere to the architecture established in `C:\Users\nikhi\OneDrive\Documents\Verifying AI Website Builder Flow.md`.

*(I acknowledge and accept these terms unconditionally. No code will be touched.)*

---

# ALL ISSUES — AI Website Builder (Documented from Live Testing + Screenshots + Backend Study)

## Issue 1: Old Code/Files Persist When Opening New Chat
When the user opens a new chat session and tries to build a new website, old files and code from a previous session are still showing. The workspace panel should reset completely for each new chat.

## Issue 2: "I approve this plan" Sent Twice
The message "I approve this plan." appears TWO times in the chat. The user clicks approve manually, and then the 30-second auto-approve timer ALSO fires because it was not canceled. Both fire `onApprove()`. The `autoFired.current` flag is not set when the user manually clicks.

## Issue 3: Plan Never Updates — Shows Failed Immediately
The "Execution Steps" panel shows ❌ on "Generate HTML Structure" even though the AI IS writing code. The plan status is driven by `buildWorker.js` + `controlPlane.js` polling from Trajectory in MongoDB. But the Chat AI writes to the sandbox — it does NOT update the Trajectory model. So the backend worker runs in PARALLEL, calls Mistral/Deepseek AGAIN, and fails — marking the step as "failed" in MongoDB. The Chat AI's actual progress is invisible to the plan UI.

## Issue 4: Code Tab Shows NO Syntax Highlighting / No Colors
WorkspacePanel line 273: `<pre><code>{sandboxFiles[selectedFile]}</code></pre>`. This is plain text rendering with gray-300 color on a dark background. Zero syntax highlighting library is used.

## Issue 5: Only Some Files Shown — Not All
The Code tab file list reads from `sandboxFiles` prop (WorkspacePanel line 253: `Object.keys(sandboxFiles)`). But `sandboxFiles` is NEVER populated by the backend. The `run_code` tool only returns `"STDOUT: index.html written"` — it never sends the actual file contents back to the frontend. So the Code tab shows "No files yet" or whatever partial data leaks through.

## Issue 6: Live Stream Didn't Show All Files
The live typing reads from markdown blocks in chat text. If the AI writes 9 files but only outputs 3 markdown blocks, only 3 appear. The system prompt currently says "Do NOT output markdown code blocks" which prevents ALL files from showing.

## Issue 7: Preview Buttons Don't Work
The preview iframe uses `srcDoc` (WorkspacePanel line 288). All content is injected as a single string. Links like `<a href="about.html">` fail because there's no file system — `srcDoc` is ONE document, not multiple pages.

## Issue 8: Preview Shows Only HTML, Not Full Site
The iframe only injects `debouncedHtml`, `debouncedCss`, `debouncedJs` — three single strings. If the AI creates `css/base.css` and `css/layout.css`, they don't match these three variables. Only content extracted from markdown blocks tagged as `html`, `css`, or `js` gets into these variables.

## Issue 9: AI Gets Stuck Reading Files for GitHub Deployment (CORRECTED)
The AI calls `read_sandbox_file` which does NOT exist as a tool in `tools.js` (confirmed: zero results for grep). The AI gets stuck and **stops mid-sentence** — for example it says "Let me check what actually got written to the script fi" and then just DIES. No error message is shown to the user. The chat goes completely silent. There is no recovery mechanism, no retry, no alarm. The user is left staring at a dead chat with zero feedback.

## Issue 10: GitHub "Bad Credentials" Error
Token expired. Not a code bug — requires re-authorization in AI Hub.

## Issue 11: No Loading Animation Before Preview
Preview tab shows "Waiting for rendering..." (WorkspacePanel line 282) but no animated loading state. Should show a proper "Getting Ready" animation.

## Issue 12: Scrollbar Missing in Code/Preview Panel
The workspace panel code section needs better scrollbar handling for long files.

## Issue 13: System Prompt Contradiction
Current prompt line 1300: "Do NOT output markdown code blocks in your chat response." This directly prevents the live preview from working because the frontend extracts from markdown blocks.

---

# SOLUTIONS (Based on backend reading — ready to implement)

## Solution for Issue 1 (Old files persist): 
In AskAiPanel, reset `sandboxFiles` state to `{}` when a new chat session starts. Add `setSandboxFiles({})` in the new chat handler.

## Solution for Issue 2 (I approve sent twice):
In ApprovalCard, when the user manually clicks approve, clear the auto-approve timer FIRST: `clearTimeout(autoTimer.current)` before calling `onApprove()`. Set a `hasFired` ref to prevent double execution.

## Solution for Issue 3 (Plan never updates — shows FAILED):
**Root cause found**: After each `run_code` in ai-chat.controller.js line 1606-1622, the backend calls `readSandboxFiles()` and sends `file_update` — but it NEVER updates the Trajectory in MongoDB. The plan UI polls `/api/build/status/:sessionId` which reads from Trajectory.
**Solution**: After each `run_code` completes, also call `Trajectory.findOneAndUpdate()` to mark the current step as "done". The step ID can be matched from the file being written (e.g., writing index.html = "html" step done).

## Solution for Issue 4 (No syntax highlighting):
Replace plain `<pre><code>` in WorkspacePanel line 273 with a syntax highlighting library. Use Prism.js or highlight.js. Import it, wrap the code in `<SyntaxHighlighter language={ext}>` component.

## Solution for Issue 5 (Only some files shown):
**Root cause found**: `sandboxFiles` IS populated via `readSandboxFiles()` SSE → `file_update` → `setSandboxFiles()`. This WORKS (screenshot proves it: README.md, deploy.js, index.html, style.css all shown).
**Remaining issue**: `readSandboxFiles()` at tools.js line 3209 does `ls -1 ${dir}` which only lists files in the ROOT of the session directory. If AI writes to subdirectories like `/data/css/base.css`, the `ls -1` won't find it. 
**Solution**: Change line 3209 to `find ${dir} -type f` instead of `ls -1` to recursively list ALL files including subdirectories.

## Solution for Issue 6 (Live stream doesn't show all files):
The system prompt line 1300 says "Do NOT output markdown code blocks." This is CORRECT for the Code tab (which reads from `sandboxFiles` via SSE). But the PREVIEW tab reads from `currentHtml`/`currentCss`/`currentJs` which come from markdown extraction.
**Solution**: Make the Preview iframe read from `sandboxFiles` instead of markdown extraction. In WorkspacePanel, build `srcDoc` from `sandboxFiles['index.html']` + `sandboxFiles['style.css']` + `sandboxFiles['script.js']` instead of `debouncedHtml`/`debouncedCss`/`debouncedJs`.

## Solution for Issue 7 (Preview buttons don't work):
`srcDoc` iframe is a single document — links to `about.html` can't work.
**Solution**: Intercept link clicks inside the iframe. When user clicks `about.html`, swap the `srcDoc` content to `sandboxFiles['about.html']` + same CSS/JS. Add a postMessage listener between iframe and parent.

## Solution for Issue 8 (Preview shows only HTML):
Same as Issue 6 solution — read from `sandboxFiles` props instead of the three hardcoded variables.

## Solution for Issue 9 (AI gets stuck mid-sentence — 2-5 min delay):
**Root cause**: The AI's SSE stream ends (DeepSeek stops generating), but the work isn't complete. Something eventually triggers a SECOND message 2-5 minutes later.
**Solution**: Use BullMQ to create a "watchdog" job. When the SSE stream ends but the build isn't complete (no deploy confirmation), BullMQ should fire a continuation job within 10 seconds that sends a new message to the AI: "Continue from where you left off. The files in the sandbox are: [list]. Complete the deployment." This uses the existing `buildQueue` + `buildWorker` infrastructure.

## Solution for Issue 11 (No loading animation):
Replace "Waiting for rendering..." text (WorkspacePanel line 282) with a proper animated loading skeleton — a pulsing gradient or spinning orbit animation.

## Solution for Issue 12 (Scrollbar missing):
Add `overflow-y: auto` and custom scrollbar CSS to the code panel div at WorkspacePanel line 271.

## Solution for Issue 13 (System prompt contradiction):
Line 1300 "Do NOT output markdown code blocks" is actually CORRECT because `sandboxFiles` SSE handles the Code tab. The Preview tab just needs to be rewired to read from `sandboxFiles` (see Issue 6 solution). No prompt change needed.

---

**Total: 13 issues with SOLUTIONS ready to implement.**
**Status: NO CODE TOUCHED. Solutions documented. Awaiting your go-ahead to implement.**
