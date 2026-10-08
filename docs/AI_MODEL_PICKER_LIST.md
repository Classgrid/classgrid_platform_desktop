# AI Model Picker — Candidate Model List

Checked live on **8 Oct 2026** against our Cloudflare Workers AI account and our Anthropic (Claude API) account.

**How to use this file:** tick `[x]` in the **Pick** column for every model you want in the dropdown, then send the list back. Models marked **✅ Already in use** are running in the AI chat today.

Our system prompt + tools are about **35k tokens**, so a model needs a context window well above that to work with the agent. Every model in sections 1 and 2 meets that and supports tool calling.

---

## 1. Anthropic — Claude API (paid from the $1,000 credit grant)

All four were tested with a live request on 8 Oct 2026 and answered.

| Pick | Model | Model ID | Speed (tiny test) | Input / Output per 1M tokens | Cache read per 1M | Context | Best for | Status |
|---|---|---|---|---|---|---|---|---|
| [ ] | Claude Haiku 5.5 | `claude-haiku-5-5` | Fastest (0.88s) | $0.10 / $0.50 (prompts ≤100k tokens; $0.50 / $2.50 above) | $0.01 | 1M | Simple chat, quick answers, routing | New (released 7 Oct 2026) |
| [ ] | Claude Sonnet 5.5 | `claude-sonnet-5-5` | Fast (1.13s) | $2 / $10 | $0.10 | 1M | Everyday tasks, writing, best speed + intelligence mix | New |
| [ ] | Claude Opus 5.5 | `claude-opus-5-5` | Moderate (2.52s) | $4 / $20 | $0.20 | 1M | Complex projects, coding, agents | New |
| [ ] | Claude Fable 5.1 | `claude-fable-5-1` | Slower (1.39s on a tiny test) | $10 / $50 | $0.25 | 1M | Hardest reasoning, multi-day tasks | New — most expensive |

Older Claude models are also available to our account (Opus 5, Sonnet 5, Fable 5, Opus 4.8, Opus 4.7, Opus 4.6, Sonnet 4.6, Opus 4.5, Haiku 4.5, Sonnet 4.5). They are not recommended: none is better or cheaper than the four above.

---

## 2. Cloudflare Workers AI — work with our agent (tool calling + big enough context)

| Pick | Model | Model ID | Input / Output per 1M tokens | Cache read per 1M | Context | Thinking | Status |
|---|---|---|---|---|---|---|---|
| [x] | DeepSeek V4 Pro | `@cf/deepseek-ai/deepseek-v4-pro-0813` | $1.32 / $3.96 | $0.044 | 1M | Yes | ✅ **Already in use** (main model) |
| [x] | DeepSeek V4 Flash | `@cf/deepseek-ai/deepseek-v4-flash-0731` | $0.44 / $1.32 | $0.014 | 1M | Yes | ✅ **Already in use** (simple messages) |
| [ ] | GPT-OSS 120B | `@cf/openai/gpt-oss-120b` | $0.35 / $0.75 | — | 128K | Yes | New |
| [ ] | GPT-OSS 20B | `@cf/openai/gpt-oss-20b` | $0.20 / $0.30 | — | 128K | Yes | New |
| [ ] | Kimi K2.6 | `@cf/moonshotai/kimi-k2.6` | $0.95 / $4.00 | $0.16 | 262K | Yes | New — strong agent model |
| [ ] | Kimi K2.7 Code | `@cf/moonshotai/kimi-k2.7-code` | $0.95 / $4.00 | $0.19 | 262K | Yes | New — coding focused |
| [ ] | GLM 5.3 | `@cf/zai-org/glm-5.3` | $1.40 / $4.40 | $0.26 | 1M | Yes | New |
| [ ] | GLM 5.3 Flash | `@cf/zai-org/glm-5.3-flash` | $0.15 / $0.50 | $0.03 | 1M | Yes | New — cheap and fast |
| [ ] | GLM 5.2 | `@cf/zai-org/glm-5.2` | $1.40 / $4.40 | $0.26 | 262K | Yes | New |
| [ ] | GLM 4.7 Flash | `@cf/zai-org/glm-4.7-flash` | $0.06 / $0.40 | — | 131K | Yes | New |
| [ ] | Qwen 3.8 27B | `@cf/qwen/qwen3.8-27b` | $0.45 / $3.20 | $0.05 | 262K | Yes | New |
| [ ] | Gemma 4 26B | `@cf/google/gemma-4-26b-a4b-it` | $0.10 / $0.30 | $0.05 | 256K | Yes | New |
| [ ] | Nemotron 3 120B | `@cf/nvidia/nemotron-3-120b-a12b` | $0.50 / $1.50 | — | 256K | Yes | New |
| [ ] | Llama 4 Scout 17B | `@cf/meta/llama-4-scout-17b-16e-instruct` | $0.27 / $0.85 | — | 131K | No | New |

### 2b. Cloudflare — works, but weaker (not recommended)

| Pick | Model | Model ID | Input / Output per 1M | Context | Why not |
|---|---|---|---|---|---|
| [ ] | Mistral Small 3.1 24B | `@cf/mistralai/mistral-small-3.1-24b-instruct` | $0.351 / $0.555 | 128K | Older, weaker at tool use |
| [ ] | Granite 4.0 Micro | `@cf/ibm-granite/granite-4.0-h-micro` | $0.017 / $0.112 | 131K | Very small model |
| [ ] | Apertus 1.5 8B | `@cf/swiss-ai/apertus-v1.5-8b` | not listed | 262K | Small model |

---

## 3. Cloudflare — will NOT work with our agent (do not add)

**Supports tools, but the context is too small for our ~35k-token prompt:**

| Model | Model ID | Context |
|---|---|---|
| Llama 3.3 70B | `@cf/meta/llama-3.3-70b-instruct-fp8-fast` | 24K |
| Qwen3 30B | `@cf/qwen/qwen3-30b-a3b-fp8` | 32K |
| EuroLLM 9B | `@cf/utter-project/eurollm-9b-it` | 32K |

**No tool calling (cannot run the agent's tools):**
`gemma-sea-lion-v4-27b-it`, `cloudflare/clef`, `cloudflare/clef-flash`, `deepseek-r1-distill-qwen-32b`, `gemma-2b-it-lora`, `gemma-7b-it-lora`, `llama-2-7b-chat-hf-lora`, `llama-3.1-8b-instruct-fp8`, `llama-3.2-11b-vision-instruct`, `llama-3.2-1b-instruct`, `llama-3.2-3b-instruct`, `llama-guard-3-8b`, `mistral-7b-instruct-v0.2-lora`, `qwen2.5-coder-32b-instruct`, `qwq-32b`.

---

## 4. Summary

| Group | Count |
|---|---|
| Claude (recommended) | 4 |
| Cloudflare that work with the agent | 14 (2 already in use) |
| Cloudflare, weaker | 3 |
| Cloudflare that will not work | 18 |
| **Max usable in the dropdown** | **21** (+ Auto) |

**Rough cost of one "hi" with our ~35k-token prompt:**

| Model | First message | When the prompt is cached |
|---|---|---|
| Claude Haiku 5.5 | ~$0.0035 | ~$0.00035 |
| DeepSeek V4 Flash (now) | ~$0.015 | ~$0.0005 |
| DeepSeek V4 Pro (now) | ~$0.046 | ~$0.0015 |
| Claude Opus 5.5 | ~$0.14 | ~$0.007 |

Prices are taken from the Cloudflare model catalog and Anthropic's model docs on 8 Oct 2026. They can change.
