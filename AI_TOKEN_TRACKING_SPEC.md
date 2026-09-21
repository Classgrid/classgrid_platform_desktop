# AI Token Usage Tracking & Multi-Model Support — Full Specification

> **Author:** Nikhil + AI Pair Programming Session  
> **Date:** September 20, 2026  
> **Status:** Spec Complete — Ready to Implement  
> **Related:** `AI_QE_ISSUES.md` → Improvement #6

---

## 1. Why This Matters (The Hidden Cost Problem)

When a user sends a simple message like "hi" to the Classgrid AI, the actual token cost is NOT just 1 token. The LLM API has to read a massive amount of hidden context before it can respond.

### Classgrid AI Token Breakdown (Per Message)

| # | Category | Where in Code | What it Contains | ~Tokens |
|---|---|---|---|---|
| 1 | System Prompt | `dynamicSystemPrompt` in `ai-chat.controller.js` (~line 500-930) | Timezone rules, formatting bans, duplicate email prevention, DB access rules, calendar context, connected providers (Google/Microsoft/Slack/GitHub/Notion/Zoom), plugin prompts, Google Classroom rules | ~3,500 |
| 2 | Tool Definitions | `allTools` array in `tools.js` (~line 30-250) | All 15+ MCP tools: unified_db_query, google_workspace_connector, microsoft_workspace_connector, send_email, web_search, generate_chart, upload_drive_file, parse_document, get_timezone_time, etc. — each with full inputSchema JSON | ~4,000 |
| 3 | Chat History | `messages` array from `getHistory()` in `ai-chat.controller.js` | Last N messages from MongoDB — grows with EVERY message the user sends | ~500 → 10,000+ |
| 4 | User Metadata | Provider blocks in `ai-chat.controller.js` (~line 830-930) | Connected provider names/emails (google_name, microsoft_email, slack_email, github_email), Voyage embeddings context, RAG search results | ~500 |
| 5 | RAG Context | Voyage AI embeddings search in `ai-chat.controller.js` | Relevant document chunks retrieved from vector DB based on user query | ~500-2,000 |
| 6 | User Message | `req.body.message` | Whatever the student/teacher typed | ~10-200 |
| | **TOTAL INPUT** | | | **~9,000 - 20,000+** |

| # | Output Category | Where | ~Tokens |
|---|---|---|---|
| 7 | AI Thinking | Internal model reasoning (not visible) | ~100-500 |
| 8 | Tool Calls | Model calls tools like unified_db_query, web_search | ~50-300 per call |
| 9 | Tool Results | Data returned FROM tools back to the model | ~200-5,000 per result |
| 10 | Final Response | Streamed text to the user via SSE | ~100-1,000 |
| | **TOTAL OUTPUT** | | **~500 - 6,000+** |

### The Killer Cost: Chat History Growth

| Message # | Chat History Tokens | Total Input | Cost Trend |
|---|---|---|---|
| 1st message | 0 | ~9,000 | Baseline |
| 5th message | ~2,000 | ~11,000 | +22% |
| 10th message | ~5,000 | ~14,000 | +55% |
| 20th message | ~12,000 | ~21,000 | +133% |
| 50th message | ~30,000+ | ~39,000+ | 💸💸💸 |

Every single message re-sends the ENTIRE conversation history. That's where the money goes.

---

## 2. Architecture Overview

### Key Design Decisions

1. **ONE usage bar per user.** Like Notion AI.
2. **User NEVER sees model names.** Backend silently picks the best model.
3. **Tokens reset every 7 days (weekly) for the FREE tier.** Unused free tokens expire.
4. **Pro tokens reset every 4 hours.** The school has a shared Pro token limit that refreshes frequently.
5. **Super Admin Control:** Super Admins can manually reset anyone's token limit (Free or Pro) from their dashboard at any time.

### The Two Tiers

**Free Tier (Default for everyone):**
- Model: Backend picks (Gemini Flash)
- Limit: 100,000 tokens **per user** per week
- Resets every 7 days (1 week) automatically
- When exhausted → AI blocked → "Upgrade to Pro" or wait for reset

**Pro Tier (Paid Org Pool):**
- Model: Backend picks smarter models (Claude Sonnet, GPT-4o)
- Limit: Org buys a shared pack (e.g., 500,000 or 1,000,000 tokens)
- Resets every 4 hours automatically.
- Org Admin decides WHO can use this pool by enabling specific roles (e.g., Faculty, Admin). Later, we will allow enabling specific individuals.
- If a user has Pro access, they draw from the Org's shared Pro pool. If the pool empties, they fall back to the Free tier (if they have free tokens left) or get blocked.

---

## 3. How Token Tracking Works (Step by Step)

### Example: Faculty Member (Pro Access Enabled by Admin)
- Org has a shared Pro pool of `500,000` tokens.
- Faculty sends a complex message. Backend routes to Claude.
- API responds with `20,000` total tokens.
- Backend subtracts `20,000` from the **Org's Shared Pro Pool**.
- New Org Pool: `480,000`.

### Example: Student (Free Tier Only)
- Student has personal weekly limit of `50,000` free tokens.
- Student sends a message. Backend routes to Gemini.
- API responds with `5,000` total tokens.
- Backend subtracts `5,000` from the **Student's Personal Free Pool**.
- New Student Free Pool: `45,000`.

---

## 4. What the User Sees vs What the Backend Knows

### User Sees (Simple — Like Notion AI)

```
AI Usage
████████████░░░░░░░░  62% used
```
*Note: If on Free tier, it says "Resets in X days". If on Pro tier, it shows the org's shared pool percentage.*

### Backend Knows (Detailed — For Our Analytics)
Per message, the backend stores prompt/completion/total tokens, model used, user_id, org_id, and which pool was billed (free vs pro).

---

## 5. Database Schema Changes

### 5a. Organization.js — Add `ai_config`

```javascript
ai_config: {
    // Shared Pro Token Pool (Resets every 4 hours)
    pro_pool_limit: { type: Number, default: 500000 },
    pro_used_this_period: { type: Number, default: 0 },
    pro_reset_date: { type: Date, default: () => getNext4HourReset() },
    
    // 1. Role-based Access (Give Pro to ALL faculty, ALL admins, etc.)
    pro_enabled_roles: { 
        type: [String], 
        enum: ["org_admin", "department_admin", "faculty", "student"],
        default: ["org_admin"] 
    },
    
    // 2. Individual Access (Give Pro to SPECIFIC emails/users only)
    // The Org Admin can type in specific emails to grant them access to the shared pool,
    // so they don't have to give it to the entire faculty role.
    pro_enabled_users: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }],
    
    // Custom API keys (AES-256 encrypted)
    custom_api_keys: {
        openai_key: { type: String, default: "" },
        anthropic_key: { type: String, default: "" },
        gemini_key: { type: String, default: "" },
    }
}
```

### 5b. User.js — Add `ai_tokens`

```javascript
ai_tokens: {
    // Personal Free Weekly Pool
    free_weekly_limit: { type: Number, default: 100000 }, 
    used_this_week: { type: Number, default: 0 },
    week_reset_date: { type: Date, default: () => getNextWeekReset() }
}
```

### 5c. AI Chat Messages — Add `token_usage`

```javascript
// On each assistant message document
token_usage: {
    prompt_tokens: { type: Number, default: 0 },
    completion_tokens: { type: Number, default: 0 },
    total_tokens: { type: Number, default: 0 },
    model_used: { type: String, default: "gemini_flash" },
    billed_to: { type: String, enum: ["personal_free", "org_pro"] } // Tracks which pool paid for it
}
```

---

## 6. Backend Code Changes

### 6a. thinking-extractor.ts — Extract `usage`

**File:** `packages/classgrid-ai-sdk2/src/core/thinking-extractor.ts`

```typescript
// Add to the return value of extractResponse()
return {
    content: (content as string) || null,
    toolCalls: message.tool_calls,
    thinking,
    usage: (data as any).usage || null,  // NEW
};
```

### 6b. llm-client.ts — Return `usage` from generate()

**File:** `packages/classgrid-ai-sdk2/src/core/llm-client.ts`

```typescript
// tryProvider() returns { answer, rateLimited, error, usage }
// generate() returns { answer, usage } instead of just string | null
```

### 6c. ai-chat.controller.js — Track Usage Per Message

After every AI response:

```javascript
const totalTokens = result.usage?.total_tokens || 0;

// 1. Save on the message document
await saveAssistantMessage({
    ...messageData,
    token_usage: {
        prompt_tokens: result.usage?.prompt_tokens || 0,
        completion_tokens: result.usage?.completion_tokens || 0,
        total_tokens: totalTokens,
        model_used: currentModel
    }
});

// 2. Subtract from user's weekly pool (atomic operation)
await User.findByIdAndUpdate(userId, {
    $inc: { "ai_tokens.used_this_week": totalTokens }
});
```

### 6d. Quota Check — Block When Exhausted

Before processing any AI request:

```javascript
const user = await User.findById(userId).select("ai_tokens");

// Check weekly reset
if (new Date() > user.ai_tokens.week_reset_date) {
    await User.findByIdAndUpdate(userId, {
        $set: { 
            "ai_tokens.used_this_week": 0,
            "ai_tokens.week_reset_date": getNextWeekReset()
        }
    });
}

// Check quota
const remaining = user.ai_tokens.free_weekly_limit - user.ai_tokens.used_this_week + (user.ai_tokens.bonus_tokens || 0);
if (remaining <= 0) {
    return res.status(429).json({
        error: "ai_quota_exceeded",
        message: "Your weekly AI tokens are finished. Get more tokens or wait for reset.",
        usage: {
            used: user.ai_tokens.used_this_week,
            limit: user.ai_tokens.free_weekly_limit,
            resets_at: user.ai_tokens.week_reset_date
        }
    });
}
```

### 6e. Weekly Reset — Automatic via Check

No cron job needed. The quota check in 6d automatically resets the counter when `week_reset_date` has passed. Simple and reliable.

---

## 7. Frontend UI — Real-Time via WebSocket

### 7a. Usage Bar (Visible to All Users)

The usage bar MUST be connected to the server via **WebSocket (Socket.IO)** — NOT polling, NOT hardcoded. The bar updates in real-time after every AI response.

**How it works:**

1. When the AI chat page loads, the frontend fetches the user's current token usage via API: `GET /api/ai/my-usage`
2. The frontend subscribes to a WebSocket event: `ai_token_update`
3. After every AI response, the backend emits `ai_token_update` via Socket.IO with:
   ```javascript
   io.to(userId).emit("ai_token_update", {
       used: 62000,
       limit: 100000,
       percentage: 62,
       resets_at: "2026-09-27T00:00:00Z",
       tier: "free"
   });
   ```
4. The frontend receives this and updates the bar instantly — no page reload, no polling.

**What the user sees:**

```
AI Usage
████████████░░░░░░░░  62% used
Resets in 3 days, 14 hours

[Get More Tokens]
```

- Progress bar updates LIVE after every AI response via WebSocket
- "Get More Tokens" button always visible
- When 100% → send button disabled with lock icon and message: "Your weekly AI tokens are finished."
- Color transitions: Green (0-60%), Yellow (60-85%), Red (85-100%)

### 7b. Quota Exceeded State

When tokens hit 0:
- The chat input gets disabled
- A banner appears: "Your weekly AI tokens are finished. Get more tokens or wait for reset."
- The "Get More Tokens" button becomes prominent
- A countdown shows: "Resets in 2 days, 6 hours"

### 7c. Admin Dashboard (Org Admin Only)

Org admin sees:
- Per-user token usage table (who used how much this week)
- Toggle: "Enable Pro for this org"
- Toggle: "Include students in Pro"
- API key input fields (OpenAI, Anthropic, Gemini)
- Weekly usage chart (line graph showing usage trend)

---

## 8. Streaming Consideration

When using `stream: true`, some providers include `usage` in the final SSE chunk. Others don't.

**Solution Options:**
1. Use `stream_options: { include_usage: true }` for OpenAI (they support this)
2. For Gemini/Groq: Check the last SSE chunk for usage data
3. Fallback: Estimate tokens using a tokenizer library like `tiktoken` (approximate but free)
4. Nuclear option: Temporarily disable streaming for the first test to capture exact `usage` from the JSON response

**Recommendation for testing:** Use option 4 first (disable streaming temporarily) to get REAL numbers. Then implement option 1/2 for production.

---

## 9. Testing Plan — Capture Real Token Numbers

Before building the full feature, we MUST capture real token data from the live Classgrid AI to validate our estimates.

### Step 1: Add Server Log (Temporary)

Add ONE `console.log` line in `llm-client.ts` after the API response:

```typescript
// In tryProvider(), after line 184:
const data = await response.json();
console.log(`🎯 [TOKEN USAGE] ${provider.name} | prompt: ${data?.usage?.prompt_tokens} | completion: ${data?.usage?.completion_tokens} | total: ${data?.usage?.total_tokens}`);
```

### Step 2: Deploy to AWS

Push the change and let the backend deploy to EC2.

### Step 3: Test with Real Messages

Open the Classgrid AI chat and send these test messages:

| Test | Message | Expected ~Tokens |
|---|---|---|
| 1 | "hi" | ~5,000-9,000 |
| 2 | "Show me all students" | ~8,000-12,000 |
| 3 | "Draft an email to parents about exam schedule" | ~10,000-15,000 |
| 4 | (5th message in same chat) | ~12,000-18,000 |
| 5 | (10th message in same chat) | ~20,000-30,000 |

### Step 4: Read Server Logs

SSH into EC2 and read the logs:
```bash
# Check the last 50 token usage logs
pm2 logs --lines 50 | grep "TOKEN USAGE"
```

### Step 5: Validate and Finalize Limits

Compare real numbers with our estimates:
- If "hi" costs ~5,600 → our estimate was correct → 100K free tokens ≈ 15-18 messages
- If "hi" costs ~9,000 → our system prompt is bigger than expected → adjust limit to 150K
- Use real data to finalize the free tier and pro tier weekly limits

### Step 6: Remove the Log

After testing, remove the temporary `console.log` and build the full feature.

---

## 10. WebSocket Events (Full List)

| Event | Direction | When | Payload |
|---|---|---|---|
| `ai_token_update` | Server → Client | After every AI response | `{ used, limit, percentage, resets_at, tier }` |
| `ai_quota_exceeded` | Server → Client | When tokens hit 0 | `{ message, resets_at }` |
| `ai_quota_reset` | Server → Client | When weekly reset happens | `{ new_limit, resets_at }` |
| `ai_tier_changed` | Server → Client | When user upgrades to pro | `{ new_tier, new_limit }` |

---

## 11. API Endpoints (New)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/ai/my-usage` | User | Get current token usage + limits |
| `GET` | `/api/ai/org-usage` | Org Admin | Get per-user breakdown for the org |
| `POST` | `/api/ai/buy-tokens` | User | Purchase additional token pack |
| `POST` | `/api/ai/upgrade-pro` | User | Upgrade to pro tier |
| `POST` | `/api/ai/org-enable-pro` | Org Admin | Enable pro for the whole org |
| `POST` | `/api/ai/super-admin/reset-tokens` | Super Admin | Manually reset a user's or org's tokens immediately |

---

## 12. Files to Modify (Checklist)

### Backend — AI SDK Package
- [ ] `packages/classgrid-ai-sdk2/src/core/thinking-extractor.ts` — Extract `usage` from response
- [ ] `packages/classgrid-ai-sdk2/src/types.ts` — Add `usage` to `ExtractedResponse` type
- [ ] `packages/classgrid-ai-sdk2/src/core/llm-client.ts` — Return `usage` from `tryProvider` and `generate`

### Backend — Database Models
- [ ] `server/src/models/Organization.js` — Add `ai_config` schema
- [ ] `server/src/models/User.js` — Add `ai_tokens` schema

### Backend — Controllers & Routes
- [ ] `server/src/controllers/ai-chat.controller.js` — Store token usage + quota check + block when exhausted + emit WebSocket events
- [ ] `server/src/routes/ai.routes.js` — Add `/my-usage`, `/org-usage`, `/buy-tokens`, `/upgrade-pro` routes

### Frontend — UI Components
- [ ] `client/src/components/ai/components/AskAiPanel.tsx` — Add usage bar UI + WebSocket listener
- [ ] `client/src/components/admin/settings/AiSettingsView.tsx` — [NEW] Admin usage dashboard
- [ ] `client/src/components/ai/components/AiHubModal.tsx` — Add "Usage" tab (like we added "Images" tab today)

---

## 13. Token Limits Summary

| Tier | Weekly Limit | Model | Reset | Cost to Us |
|---|---|---|---|---|
| Free | 100,000 tokens | Gemini Flash (user doesn't know) | Every 7 days (1 week) | ~$0.04/user/week max |
| Pro | 500,000 tokens | Claude/GPT (user doesn't know) | Every 4 hours | ~$2.00/org/4-hours max |
| Bonus | Never expires | Whatever tier they're on | Never | User paid for it |

Unused tokens expire weekly. Costs us $0 if not used.

**Note:** These limits are ESTIMATES. The real limits will be finalized after completing the Testing Plan (Section 9) with real server logs from the production Classgrid AI.

---

*This document captures the complete architecture discussed on September 20, 2026. It can be used to implement the feature at any time without needing to re-discuss the design decisions.*
