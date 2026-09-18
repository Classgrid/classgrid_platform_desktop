# AI Quality Engineering (QE) - Issue Tracker

## Issue #1: Database Query Tool Exposing Full Documents (Security & Token Limit Issue)

**What is happening:**
1. **Frontend Data Leak (Security):** When the AI queries the database, the chat frontend UI shows the *full raw MongoDB document* to the user in the "Results" box. This exposes over 100 internal backend fields per user (like password hashes, tokens, biometric IDs, etc.) which the end user should NEVER see.
2. **AI Fails to Answer (Context Overload):** When the AI just needs something simple—like "give me the names of the students" or "names of org admins"—the database tool (MCP) returns the entire massive document for every single person. Because each document has 100-200+ fields, the data becomes way too large. The output gets truncated, the AI gets overwhelmed, and it fails to list the names (it only manages 1 or 2 before running out of space).

**Why it's a problem:**
- **Security:** We are exposing full, unedited database objects to the frontend.
- **AI Reliability:** The AI isn't getting just the fields it asked for. By getting everything instead of just the names, it hits limits and fails.

**How to fix it (Proposed):**
- **Database Query Tool:** Update the tool so it only returns the specific fields requested (e.g., only the `name` field) instead of returning the entire document.
- **Frontend UI:** Stop displaying the raw JSON database results in the frontend chat, or at least sanitize it so users don't see sensitive data.

---

## Issue #2: PDF Generation Loop & Wasting Time in Terminal

**What is happening:**
- **AI Stuck in Terminal Loops:** When the user asks the AI to create a PDF (e.g., a list of Org Admins), the AI ignores its proper PDF generation tool and instead tries to use the Terminal sandbox to manually write shell scripts or run commands to generate it. It struggles with commands (like missing `file` or `base64` packages) and loops for 3-4 minutes trying to make it work.

**Why it's a problem:**
- **Bad User Experience:** The user waits 3-4 minutes for the AI to run useless terminal commands that ultimately fail.

**How to fix it (Proposed):**
- **Enforce Dedicated PDF Tool:** Ensure the AI strictly uses its dedicated `generate_pdf_from_db` tool for generating PDFs from data, instead of relying on the sandbox terminal.

---

## Issue #3: AI Hallucinating Successful Uploads & Providing Fake Links

**What is happening:**
- **Fake Success & Hallucinated Links:** When the AI fails to generate the PDF in the sandbox, instead of admitting failure, it *hallucinates* that it succeeded. It gives the user a fake download link (e.g., `cdn.classgrid.in/organization_admins_list.pdf`).
- **Proof:** Checking the actual Classgrid Storage/Files dashboard shows the file is completely missing—it was never uploaded at all. 
- **The Result:** Because the file doesn't actually exist on the CDN, the user gets an S3 `AccessDenied` (XML) error when they click the hallucinated link.

**Why it's a problem:**
- **AI Lying/Hallucination:** The AI is lying to the user about completing a task instead of properly handling errors.
- **User Confusion:** The user clicks a link expecting a PDF and gets an Amazon S3 error, thinking the cloud is broken when in reality the AI never made the file.

**How to fix it (Proposed):**
- **Strict Error Handling:** Add strict prompt constraints forcing the AI to acknowledge when a file generation or upload tool fails, rather than making up a fake URL.
- **Upload Tool Verification:** Ensure the AI only provides a URL if the `upload_file_to_cdn` tool *explicitly* returns a successful URL, rather than letting the AI guess the URL format.

---

## Issue #4: Runaway Tool Execution (Infinite Retries & Repeated Failures)

**What is happening:**
- **Massive Looping:** Instead of executing a task once (e.g., Generate PDF -> Upload to CDN -> Stop), the AI panics when a tool fails and enters an infinite retry loop. 
- **Spamming Tools:** In the live test, the AI called the Terminal, failed, called the CDN upload, failed, then hallucinated calling an OCR tool, ran the Terminal again, and repeated this entire chaotic sequence more than 4+ times in a row. 

**Why it's a problem:**
- **Wastes Time & Resources:** The AI is burning through API tokens and wasting the user's time (minutes of waiting) just repeatedly smashing tools that are already broken or failing.
- **Unpredictable Behavior:** It completely loses track of the workflow and starts using random tools (like the OCR tool) out of nowhere.

**How to fix it (Proposed):**
- **Max Retry Limits:** Enforce a strict limit on tool retries in the AI SDK (e.g., if the upload tool fails twice, FORCE the AI to stop and tell the user, rather than letting it try 5 more times).

---

## Issue #5: Email Draft Infinite Loop & Unreadable HTML

**What is happening:**
1. **Raw HTML Display:** When the AI generates an email draft, it outputs the raw HTML code (e.g., `<div style="...">...`) into the chat window. This is completely unreadable for a normal user who just wants to see the text.
2. **Infinite Confirmation Loop:** The AI asks the user for confirmation to send the email. The user types `"yes"`. The AI attempts to send it, but the backend rejects it and forces the AI to ask for confirmation again. The user is stuck in a loop of saying "yes" and the email never sends.
3. **"Empty body" in UI:** In the chat UI, the tool execution block shows "Empty body" even though the AI wrote an email.

**Why it's a problem:**
- **Broken Workflow:** The user literally cannot send an email because the safety confirmation logic is broken.
- **Bad UX:** Showing raw HTML code to a non-technical user makes the feature feel broken.

**How to fix it (Proposed):**
- **Fix the Backend Safety Gate (Root Cause):** The backend `send_email` tool has a hardcoded array of allowed confirmation phrases (like `'yes send'`, `'send it'`). It is missing the simple word `"yes"`. When the user types `"yes"`, the backend blocks it because it's not in the array! Add `"yes"` to the `confirmPatterns` array in the backend.
- **Fix the AI Prompt (Plain Text):** Instruct the AI to output a plain-text summary of the email draft for the user to read, rather than pasting raw HTML code into the chat.
- **Fix the Frontend "Empty body":** The frontend is looking for an argument called `body` in the tool call, but the tool schema uses `htmlBody`. Update the frontend to read `htmlBody`.

---

## Deep Dive Root Cause Analysis: Why PDF & CDN Generation Really Fails

During live testing of Issues #2, #3, and #4, we discovered the exact root causes of why the PDF generation crashes and why the AI hallucinates. **It is a combination of a Small Model limitation AND a Frontend UI bug.**

### Root Cause 1: Small Model Limitation (PDF Generation Failure)
- **What happened:** In the terminal output, the Python script crashes with `NameError: name 'os' is not defined` and `name 'base64' is not defined`.
- **Why:** The AI is currently powered by a smaller model (like Gemini Flash or Mistral) which frequently forgets basic coding rules, like adding `import os` and `import base64` to the top of its scripts. 
- **The Fix:** Upgrading to a frontier model (like Claude 3.5 Sonnet or GPT-4o) would instantly solve this, as they do not forget basic Python imports, allowing the PDF generation to succeed.

### Root Cause 2: Frontend UI "Lying" Bug (Hallucination Trigger)
- **What happened:** When the PDF fails to generate, the AI passes an empty file to the backend CDN tool. The backend correctly blocks it and returns an error (`FAILED: base64 string is too short`).
- **Why it gets confusing:** The frontend UI ignores this backend error! The moment the AI *attempts* to call the tool, the frontend blindly prints `"Uploaded names_list.pdf to the global CDN"` on the screen, tricking the user into thinking it succeeded.
- **The Fix:** The frontend UI must be updated to wait for the backend's response. It should only display "Uploaded" if the tool returns a `SUCCESS` string. If it returns an error, the UI should display "Failed to upload." This will align what the user sees with what the AI actually experiences.

---

## Improvement #6: AI Usage Dashboard & Multi-Model Support

**The Goal:**
Build a unified "Model Settings & Usage Dashboard" (similar to Notion AI or advanced IDEs) for Classgrid admins.

**What it needs to do:**
1. **Usage Tracking (Quotas):** Visually display how much AI quota a user/school has consumed (e.g., "Monthly: 6% used") using progress bars.
2. **Multi-Model Support (Frontier Upgrades):** Allow users to select which AI model they want to use (e.g., Gemini Flash, Claude 3.5 Sonnet, GPT-4o).
3. **Credits/API Keys:** Provide a way for users to plug in their own paid API keys or purchase "AI Credits" when they run out of their free quota or want to use the smarter, more expensive models.

**How to implement the Usage Tracking (The Token System):**
Currently, the system sends prompts to third-party APIs (Gemini, Groq) but ignores the token count. To track usage accurately:
- **Extract Token Usage:** Every API response from Gemini, Groq, and OpenAI secretly includes a `usage` object (containing `prompt_tokens` and `completion_tokens`). 
- **Database Storage:** The Classgrid backend must extract this `total_tokens` number from the API response and add it to the user's `Organization` or `User` document in MongoDB.
- **Frontend Display:** The frontend simply divides `tokens_used / tokens_allowed` to calculate the percentage for the progress bars.

---

## Improvement #7: MCP Server & Third-Party Connectors (13 Integrations)

**The Goal:**
Build a Classgrid MCP Server + external connectors so the AI can talk to Gmail, Calendar, Drive, Teams, etc. — and so external AI tools (ChatGPT, Claude, Cursor) can talk to Classgrid.

**Direction 1 — Classgrid AS an MCP Server (build once, works everywhere):**
- Cursor, ChatGPT, Claude, Notion can all connect to Classgrid and query school data directly.
- We already have `unified_db_query` — just wrap it in MCP protocol format.

**Direction 2 — External Services INTO Classgrid AI (AI gets superpowers):**
- Gmail, Google Calendar, Google Drive, Google Classroom, Google Meet — all FREE, all share one OAuth token.
- Microsoft Outlook, Microsoft Teams — all FREE, share one Azure OAuth token.
- Zoom — free basic tier.
- WhatsApp Business — already set up and working!

**Cost:** 11 out of 13 connectors are 100% FREE. Only WhatsApp (pay-per-conversation) and Zoom premium cost money.

**Timeline:** ~3 weeks for all 13 connectors. Build Gmail first, then copy the pattern for the rest.

**Full List of Connectors to Build:**
1. Classgrid MCP Server (for Cursor) — 🟢 FREE
2. Classgrid MCP Server (for ChatGPT) — 🟢 FREE
3. Classgrid MCP Server (for Claude) — 🟢 FREE
4. Classgrid MCP Server (for Notion) — 🟢 FREE
5. Gmail — ✅ COMPLETED
6. Google Calendar — ✅ COMPLETED
7. Google Drive — ✅ COMPLETED
8. Google Classroom — ✅ COMPLETED
9. Google Meet — ✅ COMPLETED
10. Microsoft Outlook — 🟢 FREE (Next up)
11. Microsoft Teams — 🟢 FREE (Next up)
12. Zoom — ✅ COMPLETED
13. WhatsApp Business — ✅ Already set up!

---

## Improvement #8: Build Classgrid OAuth 2.0 Provider (For Secure MCP Access) - ✅ COMPLETED

**The Goal:**
To securely connect third-party apps (like Notion AI, ChatGPT, or Cursor) to the Classgrid MCP server, Classgrid needs to act as an OAuth 2.0 Provider (just like Google or Microsoft does).

**What was completed:**
1. **OAuth Database Models:** Created `OAuthClient`, `OAuthAuthCode`, and `OAuthToken` in `server/src/models/OAuth.js`.
2. **Authorization & Token Endpoints:** Built `server/src/routes/oauth.provider.routes.js` providing standard `/oauth/authorize` and `/oauth/token` endpoints.
3. **Secure the MCP Server:** Created `requireOAuthBearer` middleware that validates the JWT Bearer token before allowing third-party tools to hit the MCP endpoints.

**Why this is critical:**
Without this, the MCP server is completely open to the public without authentication. With this OAuth provider built, Classgrid achieves true enterprise-grade security and integration capabilities, allowing seamless, authenticated connection into platforms like Notion.

---

## Improvement #9: API Documentation & Developer Portal

**The Goal:**
If Classgrid acts as an OAuth Provider (Improvement #8), third-party developers (like library software or ed-tech apps) will need documentation to understand how to integrate "Login with Classgrid" and query the MCP API. We need a public-facing Developer Portal.

**What it needs to do:**
1. **Public Docs Site:** Host a documentation site (e.g., `developers.classgrid.in` or `classgrid.in/docs`) containing all API references.
2. **OAuth Guides:** Step-by-step instructions showing developers how to implement the Authorization Code Flow (`/oauth/authorize` -> `/oauth/token`).
3. **Code Snippets:** Provide copy-paste examples in Node.js, Python, and PHP so external developers can build integrations quickly.
4. **API Schema:** Document the MCP server endpoints and any public REST APIs they are allowed to access once they have the user's Bearer token.

