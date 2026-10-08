// Streaming chat loop for Claude models on the Anthropic API.
// Same contract as streamChat in llm-stream.js (the Cloudflare / OpenAI-style path, which this file
// does not touch): takes OpenAI-style messages and tools, streams thinking and answer text live,
// runs tool calls with the same duplicate-call guard, and returns { answer, usage, toolsRun }.
//
// Claude specifics:
// - Adaptive thinking with display "summarized" so the reasoning streams to the UI.
// - No temperature: Claude 5.x models reject non-default sampling parameters.
// - Prompt caching: tools and the fixed part of the system prompt are cached; the per-request
//   tail of the system prompt (time, memory, user context) comes after the cache breakpoint.
// - Within one answer the assistant turns are passed back unchanged (thinking blocks included);
//   history from earlier answers is plain text, so no thinking block is ever replayed out of context.
//   "drop_block" makes a prefix mismatch degrade instead of failing the request.

import Anthropic from "@anthropic-ai/sdk";
import { StreamChatError } from "./llm-stream.js";

export const CLAUDE_CHAT_MODELS = new Set([
    "claude-haiku-5-5",
    "claude-sonnet-5-5",
    "claude-opus-5-5",
    "claude-fable-5-1",
]);

// Models that accept the server-side refusal fallback in its "default" form on the Claude API.
const FALLBACK_MODELS = new Set(["claude-sonnet-5-5", "claude-opus-5-5", "claude-fable-5-1"]);

const DEFAULT_EFFORT = {
    "claude-haiku-5-5": "low",
    "claude-sonnet-5-5": "medium",
    "claude-opus-5-5": "medium",
    "claude-fable-5-1": "medium",
};

// Thinking tokens count toward max_tokens, so Claude gets more room than the Cloudflare default -
// but only when the caller's cap (derived from the user's remaining tokens) is already at its normal size.
const MIN_MAX_TOKENS = 16000;
const NORMAL_CALLER_CAP = 8192;

// After a mid-response server-side fallback, blocks before the last `fallback` block belong to the
// model that declined: only its text is kept; its thinking and tool calls are neither run nor re-sent.
function contentAfterFallback(content) {
    let lastFallback = -1;
    content.forEach((b, i) => { if (b.type === "fallback") lastFallback = i; });
    if (lastFallback < 0) return content;
    return [...content.slice(0, lastFallback).filter((b) => b.type === "text"), ...content.slice(lastFallback)];
}

let client = null;
function getClient() {
    if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 2 });
    return client;
}

function toSystemBlocks(systemText, cacheBoundary) {
    if (!systemText) return undefined;
    const boundary = Number.isInteger(cacheBoundary) && cacheBoundary > 0 && cacheBoundary < systemText.length
        ? cacheBoundary
        : systemText.length;
    const blocks = [{ type: "text", text: systemText.slice(0, boundary), cache_control: { type: "ephemeral" } }];
    const tail = systemText.slice(boundary);
    if (tail.trim()) blocks.push({ type: "text", text: tail });
    return blocks;
}

function toClaudeMessages(messages) {
    const out = [];
    for (const m of messages) {
        if (m.role !== "user" && m.role !== "assistant") continue;
        const text = typeof m.content === "string" ? m.content : JSON.stringify(m.content ?? "");
        if (!text.trim()) continue;
        if (out.length === 0 && m.role === "assistant") continue; // the first message must be from the user
        out.push({ role: m.role, content: text });
    }
    return out;
}

function toClaudeTools(tools) {
    // The API rejects a request where two tools share a name, so keep the first definition of each.
    const seen = new Set();
    const out = tools
        .filter((t) => {
            const name = t?.function?.name;
            if (!name || name === "internal_thought_process" || seen.has(name)) return false;
            seen.add(name);
            return true;
        })
        .map((t) => {
            const schema = t.function.parameters && typeof t.function.parameters === "object"
                ? t.function.parameters
                : { type: "object", properties: {} };
            return {
                name: t.function.name,
                description: t.function.description || "",
                input_schema: schema.type ? schema : { type: "object", ...schema },
            };
        });
    // Tools render before the system prompt; caching the last one caches the whole tool list.
    if (out.length > 0) out[out.length - 1] = { ...out[out.length - 1], cache_control: { type: "ephemeral" } };
    return out;
}

function addUsage(total, u) {
    if (!u) return;
    total.input_tokens += u.input_tokens || 0;
    total.output_tokens += u.output_tokens || 0;
    total.cache_read_input_tokens += u.cache_read_input_tokens || 0;
    total.cache_creation_input_tokens += u.cache_creation_input_tokens || 0;
    total.prompt_tokens = total.input_tokens + total.cache_read_input_tokens + total.cache_creation_input_tokens;
    total.completion_tokens = total.output_tokens;
    total.total_tokens = total.prompt_tokens + total.completion_tokens;
}

/**
 * Runs the tool-calling loop on a Claude model with streaming.
 * Throws StreamChatError on API failures; `error.toolsRun` tells the caller whether
 * any real tool already executed (in which case retrying elsewhere could repeat side effects).
 */
export async function streamClaudeChat({
    model,
    messages,
    tools = [],
    toolHandlers = {},
    maxTokens = MIN_MAX_TOKENS,
    maxToolDepth = 100,
    timeoutMs = 300000,
    systemCacheBoundary,
    effort,
    signal,
    onToken,
    onThought,
    onStatus,
}) {
    if (!CLAUDE_CHAT_MODELS.has(model)) throw new StreamChatError(`Unsupported Claude model: ${model}`);
    if (!process.env.ANTHROPIC_API_KEY) throw new StreamChatError("ANTHROPIC_API_KEY is not set");

    const systemText = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
    const system = toSystemBlocks(systemText, systemCacheBoundary);
    const claudeTools = toClaudeTools(tools);
    const conversation = toClaudeMessages(messages);
    if (conversation.length === 0) throw new StreamChatError("No user message to send");

    const usage = {
        prompt_tokens: 0, completion_tokens: 0, total_tokens: 0,
        input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0,
    };
    const betas = ["thinking-binding-controls-2026-08-01"];
    if (FALLBACK_MODELS.has(model)) betas.push("server-side-fallback-2026-07-01");

    const params = {
        model,
        max_tokens: (maxTokens || 0) >= NORMAL_CALLER_CAP ? Math.max(maxTokens, MIN_MAX_TOKENS) : Math.max(maxTokens || 0, 1024),
        system,
        tools: claudeTools.length > 0 ? claudeTools : undefined,
        thinking: {
            type: "adaptive",
            display: "summarized",
            block_binding: { prefix_mismatch_behavior: "drop_block" },
        },
        output_config: { effort: effort || DEFAULT_EFFORT[model] || "medium" },
        betas,
        ...(FALLBACK_MODELS.has(model) ? { fallbacks: "default" } : {}),
    };

    const earlierCalls = []; // { name, input } of every tool call already handled in this answer
    let depth = 0;
    let toolsRun = 0;
    let hadReasoning = false;
    let thoughtThisRound = false;
    let servedModel = model; // differs from `model` when a server-side fallback answered
    // Usage of the round in progress, read from the stream events; added to `usage` if the round is cut off.
    let roundUsage = null;

    try {
        for (;;) {
            if (signal?.aborted) throw new StreamChatError("Request aborted");

            thoughtThisRound = false;
            const stream = getClient().beta.messages.stream(
                { ...params, messages: conversation },
                { signal, timeout: timeoutMs },
            );

            for await (const event of stream) {
                if (event.type === "message_start") {
                    roundUsage = { ...(event.message?.usage || {}) };
                    continue;
                }
                if (event.type === "message_delta") {
                    if (roundUsage && event.usage?.output_tokens !== undefined) roundUsage.output_tokens = event.usage.output_tokens;
                    continue;
                }
                if (event.type !== "content_block_delta") continue;
                if (event.delta.type === "thinking_delta" && event.delta.thinking) {
                    // Keep reasoning from separate rounds visually separate in the thought stream.
                    if (hadReasoning && !thoughtThisRound) onThought?.("\n\n");
                    thoughtThisRound = true;
                    onThought?.(event.delta.thinking);
                } else if (event.delta.type === "text_delta" && event.delta.text) {
                    onToken?.(event.delta.text);
                }
            }

            const message = await stream.finalMessage();
            roundUsage = null;
            addUsage(usage, message.usage);
            if (message.model) servedModel = message.model;
            if (thoughtThisRound) hadReasoning = true;

            const content = contentAfterFallback(message.content);
            const text = content.filter((b) => b.type === "text").map((b) => b.text).join("").trim();
            const toolUses = content.filter((b) => b.type === "tool_use");

            if (message.stop_reason === "refusal") {
                // Partial output from a declined response is discarded, not shown as a finished answer.
                return { answer: "I can't help with that request.", usage, toolsRun, servedModel };
            }
            if (message.stop_reason === "pause_turn") {
                conversation.push({ role: "assistant", content });
                continue;
            }
            if (toolUses.length === 0) {
                return { answer: text || null, usage, toolsRun, servedModel };
            }
            if (depth >= maxToolDepth) {
                return { answer: "I searched but couldn't find a clear answer. Could you try rephrasing?", usage, toolsRun, servedModel };
            }

            // Pass the assistant turn back unchanged (apart from a declined model's blocks) so its thinking stays valid.
            conversation.push({ role: "assistant", content });

            const truncated = message.stop_reason === "max_tokens";
            const callsThisRound = [];
            const toolResults = [];
            let countsTowardDepth = false;

            for (const call of toolUses) {
                const inputKey = JSON.stringify(call.input ?? {});
                let content;
                let isError = false;

                if (truncated) {
                    content = "Error: this tool call was cut off before its input was complete. Call it again with shorter input.";
                    isError = true;
                } else if ([...earlierCalls, ...callsThisRound].some((c) => c.name === call.name && c.input === inputKey)) {
                    content = `ERROR: You have ALREADY called ${call.name} with these exact arguments. Use the data you already have.`;
                    isError = true;
                } else if (!toolHandlers[call.name]) {
                    content = `Error: Unknown tool ${call.name}.`;
                    isError = true;
                } else {
                    onStatus?.(call.name.replace(/_/g, " "));
                    toolsRun++;
                    try {
                        content = await toolHandlers[call.name](call.input ?? {});
                    } catch (e) {
                        content = `Tool error: ${e instanceof Error ? e.message : String(e)}`;
                        isError = true;
                    }
                    onStatus?.("analyzing");
                }
                countsTowardDepth = true;
                callsThisRound.push({ name: call.name, input: inputKey });
                toolResults.push({
                    type: "tool_result",
                    tool_use_id: call.id,
                    content: String(content ?? "").slice(0, 6000),
                    ...(isError ? { is_error: true } : {}),
                });
            }

            // All results go back in one user message, which keeps Claude making parallel calls.
            conversation.push({ role: "user", content: toolResults });
            earlierCalls.push(...callsThisRound);
            if (countsTowardDepth) depth++;
        }
    } catch (err) {
        // A round that failed or was aborted mid-stream is still billed for what it processed.
        if (roundUsage) addUsage(usage, roundUsage);
        let wrapped;
        if (err instanceof StreamChatError) {
            wrapped = err;
        } else if (err instanceof Anthropic.APIError) {
            wrapped = new StreamChatError(`Anthropic${err.status ? ` ${err.status}` : ""}: ${err.message}`, {
                status: err.status,
                rateLimited: err instanceof Anthropic.RateLimitError,
            });
        } else {
            wrapped = new StreamChatError(err?.message || String(err));
        }
        wrapped.toolsRun = toolsRun;
        wrapped.usage = usage;
        wrapped.servedModel = servedModel;
        throw wrapped;
    }
}
