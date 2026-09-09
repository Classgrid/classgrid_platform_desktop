import { createLLMClient } from "@classgrid/ai/core";
import { getPresignedUploadUrl } from "../config/r2Client.js";
import {
    createSession,
    saveMessage,
    getSessions,
    getSessionMessages,
    updateSessionTitle,
    deleteSession,
    updateSessionPinned,
    getSessionById,
    createSharedSnapshot,
    getSharedSnapshot
} from "../services/ai-chat.service.js";
import { sendEmail } from "../services/aws-ses.service.js";
// The system prompt was originally in ./prompt, we will define it here or import it if needed.
const SYSTEM_PROMPT = `You are the Classgrid AI Assistant.

RESPONSE STYLE:
- Be concise and direct.
- DO NOT use tables for explanations or analysis. Use numbered lists (1, 2, 3), bullet points, or sections instead.
- Only use tables if the user EXPLICITLY asks for a table.
- Use code blocks or code components when sharing code or mathematical formulas.

SAFETY OVERRIDE: 
If you must refuse a request for safety reasons, DO NOT repeat the default "I'm sorry, I can't help with that" phrase. Instead, naturally and politely explain to the user exactly why the request violates the safety policy in your own words.`;

async function generateSessionTitle(sessionId, question) {
    try {
        const client = createLLMClient({
            providers: [
                {
                    name: "mistral",
                    url: "https://api.mistral.ai/v1/chat/completions",
                    apiKey: process.env.MISTRAL_API_KEY || process.env.MISTRAL_API_KEY_2 || "",
                    model: "open-mistral-nemo"
                },
                {
                    name: "gemini",
                    url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
                    apiKey: process.env.GEMINI_API_KEY || "",
                    model: "gemini-3.5-flash"
                },
                {
                    name: "groq",
                    url: "https://api.groq.com/openai/v1/chat/completions",
                    apiKey: process.env.GROQ_API_KEY || "",
                    model: "openai/gpt-oss-20b"
                }
            ]
        });
        const answer = await client.generate({
            messages: [
                { role: "system", content: "You are a title generator. Generate a very short 3-5 word title for the user's message. Output ONLY the raw words, without quotes or punctuation. DO NOT explain your thought process. DO NOT output any XML or thoughts." },
                { role: "user", content: question }
            ],
            maxToolDepth: 0
        });
        if (answer && !answer.includes("[RATE_LIMITED]")) {
            const cleanTitle = answer.trim().replace(/^["']|["']$/g, '');
            if (cleanTitle.length > 0) {
                await updateSessionTitle(sessionId, cleanTitle);
            }
        }
    } catch (err) {
        console.error("Error generating session title:", err);
    }
}

export const streamAskAi = async (req, res) => {
    // 1. Setup Server-Sent Events (SSE) headers for Express
    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
    });

    try {
        const body = req.body || {};

        if (body.question === "__ban_check__") {
            // Frontend is just checking if they get a 403 Forbidden.
            // Since we reached here (passed auth middleware), they are not banned. 
            // Just return early without invoking the LLM or creating a database session.
            res.end();
            return;
        }

        const messages = body.history || [];

        let sessionId = body.sessionId;
        const isIncognito = body.isIncognito || false;

        // 2a. If not incognito and no session exists, create one
        if (!isIncognito && !sessionId && body.question) {
            const title = body.question.length > 50 ? body.question.substring(0, 47) + "..." : body.question;
            const userEmail = req.user?.email || body.userEmail || 'unknown@classgrid.in';
            const session = await createSession(userEmail, title, false);
            if (session) {
                sessionId = session.id;
                // Generate a real title in the background
                generateSessionTitle(sessionId, body.question).catch(console.error);
                
                // Send back the sessionId immediately so the frontend sidebar can update instantly
                res.write(`data: ${JSON.stringify({ type: "session_info", sessionId })}\n\n`);
            }
        }

        // 2b. If not incognito, save the user message to DB immediately
        if (!isIncognito && sessionId && body.question) {
            await saveMessage(sessionId, "user", body.question, body.fileUrls || []);
        }

        if (body.question) {
            // Include image URLs in the SDK's expected format if needed
            // Currently, simple string content is supported by the AI core, but if they had fileUrls, we append them as context.
            let content = body.question;
            if (body.fileUrls && body.fileUrls.length > 0) {
                content += "\n\nAttached Files:\n" + body.fileUrls.join('\n');
            }
            messages.push({ role: "user", content });
        }

        let dynamicSystemPrompt = SYSTEM_PROMPT;
        if (body.userName || body.userEmail || body.userRole || body.subdomain) {
            dynamicSystemPrompt += `\n\n--- USER CONTEXT ---\nYou are currently speaking to ${body.userName || "a user"}.`;
            if (body.userEmail) {
                dynamicSystemPrompt += `\nTheir Email: ${body.userEmail}`;
                if (body.userEmail.endsWith("@classgrid.in")) {
                    dynamicSystemPrompt += ` (SUPER ADMIN / PLATFORM OWNER)`;
                }
            }
            if (body.userRole) dynamicSystemPrompt += `\nTheir Role: ${body.userRole}`;
            if (body.subdomain) {
                dynamicSystemPrompt += `\nCurrent Dashboard Subdomain: ${body.subdomain}`;
                if (body.subdomain !== "classgrid.in" && body.subdomain !== "superadmin.classgrid.in" && body.subdomain !== "localhost") {
                    dynamicSystemPrompt += ` (This means they are using a school/organization's dashboard, not the super admin dashboard)`;
                }
            }
        }

        messages.unshift({ role: "system", content: dynamicSystemPrompt });

        // 3. Initialize the real LLM Client from the Classgrid SDK using the fallback hierarchy
        const client = createLLMClient({
            providers: [
                {
                    name: "groq",
                    url: "https://api.groq.com/openai/v1/chat/completions",
                    apiKey: process.env.GROQ_API_KEY || "",
                    model: "openai/gpt-oss-20b"
                },
                {
                    name: "mistral",
                    url: "https://api.mistral.ai/v1/chat/completions",
                    apiKey: process.env.MISTRAL_API_KEY || process.env.MISTRAL_API_KEY_2 || "",
                    model: "open-mistral-nemo"
                },
                {
                    name: "gemini",
                    url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
                    apiKey: process.env.GEMINI_API_KEY || "",
                    // 🚨 AI WARNING: DO NOT CHANGE THIS TO gemini-1.5-flash 🚨
                    // gemini-1.5-flash was deprecated and completely removed by Google in 2025.
                    // If you change this back to 1.5, the backend will crash and hang.
                    model: "gemini-3.5-flash"
                }
            ],
            verbose: true,
            maxToolDepth: 5,
            defaultMaxTokens: 2000,
            tools: [
                {
                    type: "function",
                    function: {
                        name: "search_web",
                        description: "Search the live web for competitor analysis, news, or external facts.",
                        parameters: {
                            type: "object",
                            properties: {
                                query: { type: "string", description: "The search query (e.g. 'Teachmint features and pricing')" }
                            },
                            required: ["query"]
                        }
                    }
                }
            ],
            toolHandlers: {
                search_web: async (args) => {
                    const tavilyKey = process.env.TAVILY_API_KEY?.trim();
                    if (!tavilyKey) return "Search failed because TAVILY_API_KEY is missing.";
                    try {
                        const tavilyRes = await fetch("https://api.tavily.com/search", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                api_key: tavilyKey,
                                query: args.query,
                                search_depth: "basic",
                                include_answer: true,
                                max_results: 5
                            })
                        });
                        const searchData = await tavilyRes.json();
                        if (searchData.answer) {
                            const sourceUrls = (searchData.results || []).map(r => `- ${r.title}: ${r.url}`).join('\n');
                            return `${searchData.answer}\n\nSource URLs:\n${sourceUrls}`;
                        } else if (searchData.results && searchData.results.length > 0) {
                            return searchData.results.map(r => `${r.title} (${r.url})\n${r.content}`).join('\n\n');
                        } else {
                            return "No search results found.";
                        }
                    } catch (e) {
                        return "Web Search failed: " + e;
                    }
                }
            }
        });

        let requestAborted = false;
        
        req.on('close', () => {
            requestAborted = true;
            if (!res.writableEnded) res.end();
        });

        // 4. Run the Client and pass SSE writes inside the callbacks
        const answer = await client.generate({
            messages,
            timeoutMs: 600000, // 10 MINUTES - Maxed out so it never times out
            onStatus: (status) => {
                if (requestAborted) return;
                const mappedLabel = status === "search web" ? "searching" : status;
                if (!res.writableEnded) res.write(`data: ${JSON.stringify({ type: "status", label: mappedLabel })}\n\n`);
            },
            onThought: (thought) => {
                if (requestAborted) return;
                if (!res.writableEnded) res.write(`data: ${JSON.stringify({ type: "thought", thought })}\n\n`);
            }
        });

        if (requestAborted) {
            return; // Client disconnected, exit silently
        }

        // 5. Send back the sessionId if it was provided by the client, just in case
        if (sessionId && !res.writableEnded) {
            res.write(`data: ${JSON.stringify({ type: "session_info", sessionId })}\n\n`);
        }

        if (!answer && !res.writableEnded) {
            res.write(`data: ${JSON.stringify({ type: "answer", answer: "Failed to get an answer from the AI." })}\n\n`);
        } else if (answer === "[RATE_LIMITED]" && !res.writableEnded) {
            res.write(`data: ${JSON.stringify({ type: "answer", answer: "I'm currently experiencing high traffic and cannot process your request right now." })}\n\n`);
        } else if (!res.writableEnded) {
            // Save Assistant response
            if (!isIncognito && sessionId) {
                await saveMessage(sessionId, "assistant", answer, []);
            }
            res.write(`data: ${JSON.stringify({ type: "answer", answer })}\n\n`);
        }

    } catch (err) {
        console.error("API Route Error:", err);
        if (!res.writableEnded) {
            res.write(`data: ${JSON.stringify({ type: "answer", answer: "An error occurred while calling the AI." })}\n\n`);
        }
    } finally {
        if (!res.writableEnded) res.end();
    }
};

export const getChatSessions = async (req, res) => {
    try {
        const email = req.user?.email; // Assumes isAuthenticated populates req.user
        if (!email) return res.status(401).json({ error: "Unauthorized" });

        const sessions = await getSessions(email);
        res.json({ sessions });
    } catch (e) {
        console.error("Error getting sessions:", e);
        res.status(500).json({ error: "Failed to load chat sessions" });
    }
};

export const getChatSessionMessages = async (req, res) => {
    try {
        const { id } = req.params;
        const messages = await getSessionMessages(id);
        res.json({ messages });
    } catch (e) {
        console.error("Error getting session messages:", e);
        res.status(500).json({ error: "Failed to load messages" });
    }
};

export const uploadChatImage = async (req, res) => {
    try {
        const { fileName, mimeType } = req.body;
        if (!fileName || !mimeType) {
            return res.status(400).json({ error: "fileName and mimeType required" });
        }

        // Use R2 presigned URL generator for secure direct browser upload
        const result = await getPresignedUploadUrl(fileName, mimeType, 3600, `ai-chat-uploads/${Date.now()}-${fileName}`);
        res.json(result);
    } catch (e) {
        console.error("Error generating presigned URL for AI chat:", e);
        res.status(500).json({ error: "Failed to generate upload URL" });
    }
};

export const updateChatSession = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, pinned } = req.body;
        let updatedSession = null;
        if (title !== undefined) {
            updatedSession = await updateSessionTitle(id, title);
        }
        if (pinned !== undefined) {
            updatedSession = await updateSessionPinned(id, pinned);
        }
        res.json({ success: true, session: updatedSession });
    } catch (e) {
        console.error("Error updating session:", e);
        res.status(500).json({ error: "Failed to update session" });
    }
};

export const deleteChatSession = async (req, res) => {
    try {
        const { id } = req.params;
        await deleteSession(id);
        res.json({ success: true });
    } catch (e) {
        console.error("Error deleting session:", e);
        res.status(500).json({ error: "Failed to delete session" });
    }
};

export const shareChatSession = async (req, res) => {
    try {
        const { id } = req.params;
        const session = await getSessionById(id);
        
        if (!session || session.user_email !== req.user.email) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const messages = await getSessionMessages(id);

        let transcript = `Chat Transcript: ${session.title}\n\n`;
        transcript += `Exported on ${new Date().toLocaleString()}\n\n---\n\n`;
        messages.forEach((msg) => {
            transcript += `${msg.role === 'user' ? 'You' : 'Classgrid AI'}:\n${msg.content}\n\n`;
        });

        // sendEmail from aws-ses.service.js takes a named object
        await sendEmail({
            fromName: "Classgrid AI",
            fromEmail: "agent@classgrid.in",
            to: req.user.email,
            subject: `Classgrid AI Chat: ${session.title}`,
            text: transcript,
            html: `<pre style="font-family: sans-serif; white-space: pre-wrap;">${transcript}</pre>`,
        });

        console.info(`[Chat API] ✅ Chat transcript emailed to ${req.user.email} for session ${id}`);
        res.json({ success: true, message: "Email sent successfully" });
    } catch (e) {
        console.error(`[Chat API] ❌ Failed to email chat transcript:`, e);
        res.status(500).json({ error: "Failed to share session" });
    }
};

// ─────────────────────────────────────────────────
// PUBLIC CHAT SHARING
// ─────────────────────────────────────────────────

const SHARE_BASE_URL = process.env.SHARE_BASE_URL || "https://share.classgrid.in";

/**
 * Creates a public share link for a chat session.
 * Authenticated — only the session owner can share.
 */
export const createPublicShare = async (req, res) => {
    try {
        const { id } = req.params;
        const session = await getSessionById(id);

        if (!session || session.user_email !== req.user.email) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const messages = await getSessionMessages(id);

        // Create a frozen snapshot
        const snapshot = await createSharedSnapshot(
            id,
            req.user.email,
            req.user.name || req.user.email.split('@')[0],
            session.title,
            messages.map(m => ({ role: m.role, content: m.content, created_at: m.created_at }))
        );

        const shareUrl = `${SHARE_BASE_URL}/${snapshot.share_id}`;
        console.info(`[Chat API] ✅ Public share created: ${shareUrl} for session ${id}`);

        res.json({ success: true, shareId: snapshot.share_id, shareUrl });
    } catch (e) {
        console.error(`[Chat API] ❌ Failed to create public share:`, e);
        res.status(500).json({ error: "Failed to create public share link" });
    }
};

/**
 * Retrieves a shared chat snapshot by share ID.
 * PUBLIC — no authentication required.
 */
export const getPublicShare = async (req, res) => {
    try {
        const { shareId } = req.params;
        const snapshot = await getSharedSnapshot(shareId);

        if (!snapshot) {
            return res.status(404).json({ error: "Shared chat not found" });
        }

        // Parse messages if stored as a string
        const messages = typeof snapshot.messages === 'string'
            ? JSON.parse(snapshot.messages)
            : snapshot.messages;

        res.json({
            title: snapshot.title,
            sharedBy: snapshot.user_name,
            messages,
            createdAt: snapshot.created_at,
        });
    } catch (e) {
        console.error(`[Chat API] ❌ Failed to retrieve public share:`, e);
        res.status(500).json({ error: "Failed to load shared chat" });
    }
};

