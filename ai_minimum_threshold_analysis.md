# AI Cost Analysis & Minimum Threshold Strategy

## The Financial Loss Problem
When a user asks a simple question like "Hi", they expect it to cost very few tokens. However, the true cost to Classgrid is much higher because of **System Prompt Overhead**.

For every request sent to Cloudflare, the AI must process the entire context:
- Base system instructions
- The user's metadata (role, organization)
- The entire chat history
- Dynamic prompt injections (rules, plugins, etc.)

**Real-world Example (from logs):**
* User prompt: "HI"
* Input tokens (System Prompt + History): **33,629 tokens**
* Output tokens: **55 tokens**
* Total cost to Classgrid: **33,684 tokens**

If a user only has **3,000 tokens** remaining in their account, Classgrid will successfully cap their deduction at 3,000 (meaning their balance hits exactly 0). However, **Cloudflare still charges Classgrid for the full 33,684 tokens**. 

This means Classgrid takes a direct financial loss of **30,684 tokens** on that single request!

## The Solution: A Hard Minimum Threshold (10,000 Tokens)
Instead of building complex and slow token-estimation logic before every request, we implement a strict **Gatekeeper Rule**:

> **Rule:** No request will be forwarded to Cloudflare unless the user's remaining balance is **at least 10,000 tokens**.

### Why 10,000?
10,000 tokens is the "safety buffer". It ensures that the user has enough equity in their account to cover the massive, invisible cost of the system prompt and history. 

If their balance drops to 9,999 or lower, the backend will immediately reject the request with a `429 Insufficient tokens` error **before** it ever reaches Cloudflare. 

### Implementation Plan (Next Steps)
In `server/src/controllers/ai-chat.controller.js`:
Change the `estimatedCost` from `50` to `10000` for standard text requests (and perhaps higher for image/diagram requests). 

```javascript
// CURRENT:
const estimatedCost = isDiagramRequest ? 500 : 50; 

// PROPOSED FIX:
const estimatedCost = isDiagramRequest ? 25000 : 10000;
```

This single line change guarantees Classgrid will never process a request for an almost-empty account, entirely eliminating the "free system prompt overhead" exploit.
