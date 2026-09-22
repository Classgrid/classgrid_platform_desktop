import fetch from 'node-fetch';

const INTERNAL_THOUGHT_TOOL = {
    type: "function",
    function: {
        name: "internal_thought_process",
        description: "CRITICAL: Use this tool first before calling any other tools if you need to think, plan, analyze, or decompose a complex problem into steps.",
        parameters: {
            type: "object",
            properties: {
                thought: {
                    type: "string",
                    description: "Your detailed thinking process, step-by-step breakdown, and analysis."
                }
            },
            required: ["thought"]
        }
    }
};

function extractResponse(message) {
    let content = message.content || null;
    let thinking = message.reasoning_content || message.thinking || message.thought || message.thinkingContent || message.reasoning || null;
    let toolCalls = message.tool_calls || [];
    if (!content && message.text) content = message.text;
    if (message.parts && Array.isArray(message.parts)) {
        for (const p of message.parts) {
            if (p.text) content = (content || "") + p.text;
            if (p.functionCall) {
                toolCalls.push({
                    id: p.functionCall.name + "_" + Math.random().toString(36).substr(2, 9),
                    type: "function",
                    function: {
                        name: p.functionCall.name,
                        arguments: JSON.stringify(p.functionCall.args)
                    }
                });
            }
        }
    }
    return { content, toolCalls, thinking };
}

async function tryProvider(provider, messages, config, temperature, maxTokens, timeoutMs, onStatus, onThought, depth = 0) {
    const verbose = config.verbose !== false;
    const maxDepth = config.maxToolDepth || 15;
    const startTime = Date.now();
    try {
        if (verbose) {
            onStatus(`Connecting to ${provider.name}...`);
        }
        
        let allTools = [...(config.tools || [])];
        if (provider.name !== 'cloudflare') {
            allTools = [INTERNAL_THOUGHT_TOOL, ...allTools];
        }

        const payload = {
            model: provider.model,
            messages,
            temperature,
            ...(provider.name !== "gemini" ? { max_tokens: maxTokens } : {}),
            stream: false
        };
        if (allTools.length > 0) {
            payload.tools = allTools;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${provider.apiKey}`,
            "x-session-affinity": "classgrid-ai-production-cache"
        };
        if (provider.name === "gemini") {
            delete headers["Authorization"];
            headers["x-goog-api-key"] = provider.apiKey;
        }
        const response = await fetch(provider.url, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
            signal: controller.signal
        });
        clearTimeout(timeout);
        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            if (response.status === 429) return { answer: null, rateLimited: true, error: "429 Rate Limit" };
            return { answer: null, rateLimited: false, error: `HTTP ${response.status}: ${text.substring(0, 100)}` };
        }
        if (data.error) {
            if (response.status === 429 || (data.error.message && data.error.message.includes("429"))) {
                return { answer: null, rateLimited: true, error: data.error.message || "Rate limited" };
            }
            return { answer: null, rateLimited: false, error: data.error.message || JSON.stringify(data.error) };
        }
        let message = null;
        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            message = data.choices[0].message;
        } else if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
            message = data.candidates[0].content;
        } else {
            return { answer: null, rateLimited: false, error: `Unexpected format: ${JSON.stringify(data).substring(0, 100)}` };
        }
        const result = extractResponse(message);
        if (result.thinking) {
            onThought(result.thinking);
        }
        if (result.toolCalls && result.toolCalls.length > 0) {
            if (depth >= maxDepth) {
                if (verbose) console.error(`\u274C [llm:${provider.name}] Max tool depth (${maxDepth}) reached.`);
                return { answer: "I searched but couldn't find a clear answer. Could you try rephrasing?", rateLimited: false, error: "max_depth" };
            }

            // CRITICAL FIX: Loop over ALL tool calls in parallel and resolve them
            const executedToolCalls = [];
            const toolResponses = [];
            
            // Collect duplicate-checked tool calls
            for (const call of result.toolCalls) {
                const toolName = call.function.name;
                let args;
                try {
                    args = JSON.parse(call.function.arguments);
                } catch (e) {
                    args = {};
                }

                if (toolName === "internal_thought_process") {
                    const alreadyThought = messages.some((m) => m.tool_calls && m.tool_calls.some((tc) => tc.function.name === "internal_thought_process"));
                    if (alreadyThought) {
                        executedToolCalls.push(call);
                        toolResponses.push({ role: "tool", tool_call_id: call.id, content: "ERROR: You have ALREADY used the internal_thought_process tool. Provide your final answer now." });
                        continue;
                    }
                    if (args.thought) onThought(args.thought);
                    executedToolCalls.push(call);
                    toolResponses.push({ role: "tool", tool_call_id: call.id, content: "Thought logged. Provide your final answer now." });
                    continue;
                }

                const alreadyCalled = messages.some((m) => m.tool_calls && m.tool_calls.some((tc) => tc.function.name === toolName && tc.function.arguments === call.function.arguments));
                if (alreadyCalled) {
                    executedToolCalls.push(call);
                    toolResponses.push({ role: "tool", tool_call_id: call.id, content: `ERROR: You have ALREADY called ${toolName} with these exact arguments. Use the data you already have.` });
                    continue;
                }

                const toolWrapper = config.tools.find((t) => t.function.name === toolName);
                if (!toolWrapper) {
                    executedToolCalls.push(call);
                    toolResponses.push({ role: "tool", tool_call_id: call.id, content: `ERROR: Tool ${toolName} not found.` });
                    continue;
                }

                if (verbose) {
                    onStatus(`Running ${toolName}...`);
                }

                try {
                    const toolResult = await toolWrapper.function.execute(args);
                    executedToolCalls.push(call);
                    toolResponses.push({ role: "tool", tool_call_id: call.id, content: String(toolResult).substring(0, 8000) });
                } catch (e) {
                    executedToolCalls.push(call);
                    toolResponses.push({ role: "tool", tool_call_id: call.id, content: `ERROR executing ${toolName}: ${e.message}` });
                }
            }

            const nextMessages = [
                ...messages,
                { role: "assistant", content: result.content || "", tool_calls: executedToolCalls },
                ...toolResponses
            ];

            return tryProvider(provider, nextMessages, config, temperature, maxTokens, timeoutMs, onStatus, onThought, depth + 1);
        }

        if (result.content && verbose) {
            const duration = ((Date.now() - startTime) / 1e3).toFixed(2);
            console.log(`\u2705 [llm] ${provider.name.toUpperCase()} answered in ${duration}s!`);
        }
        
        if (!result.content && (!result.toolCalls || result.toolCalls.length === 0)) {
            console.error(`\u274C [llm:${provider.name}] returned empty content and empty tool_calls! RAW RESPONSE:`, JSON.stringify(data).substring(0, 500));
        }

        return { answer: result.content || null, rateLimited: false };
    } catch (e) {
        let message = e.message;
        if (e.name === "AbortError" || message.toLowerCase().includes("abort")) {
            if (verbose) console.warn(`\u26A0\uFE0F [llm:${provider.name}] Timeout after ${timeoutMs}ms`);
            message = "The operation was aborted";
        } else {
            console.error(`\u274C [llm:${provider.name}] Request failed:`, e);
        }
        return { answer: null, rateLimited: false, error: message };
    }
}

export function createLLMClient(config) {
    if (!config || !config.providers) throw new Error("providers configuration is required");
    return {
        generate: async (options) => {
            const { messages, temperature = 0.7, timeoutMs = config.timeoutMs || 3e4, onStatus = () => {}, onThought = () => {} } = options;
            if (config.providers.length === 0) {
                console.error("[llm] No providers configured.");
                return null;
            }
            let allRateLimited = true;
            for (const provider of config.providers) {
                const maxTokens = config.defaultMaxTokens ?? 600;
                const pTimeout = provider.timeoutMs || timeoutMs;
                const result = await tryProvider(provider, messages, config, temperature, maxTokens, pTimeout, onStatus, onThought, 0);
                if (result.answer) return result.answer;
                if (!result.rateLimited) {
                    allRateLimited = false;
                }
                if (config.verbose !== false) {
                    console.warn(`[llm] ${provider.name} failed (${result.error}), trying next...`);
                }
            }
            if (allRateLimited) {
                console.error("[llm] All providers rate-limited.");
                return "[RATE_LIMITED]";
            }
            console.error("[llm] All providers failed.");
            return null;
        }
    };
}
