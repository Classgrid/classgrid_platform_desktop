/*
 * ─────────────────────────────────────────────────────────
 * 🚨 CRITICAL AI AND SYSTEM RULES 🚨
 * 1. NEVER DELETE ANY ENVIRONMENT VARIABLES.
 * 2. LOCALHOST TESTING IS STRICTLY BANNED. NO AI WILL EVER TRY TO WORK LOCALLY.
 * 3. THIS REPO IS PRODUCTION-FIRST. DO NOT TOUCH OR REMOVE KEYS.
 * ─────────────────────────────────────────────────────────
 */

/**
 * ai-chat-history.service.js
 *
 * Dual-layer AI chat history: Redis (hot cache) + Supabase (source of truth).
 *
 * Architecture:
 *  - Every chat session has a Redis List at key: ai:chat:history:{sessionId}
 *  - Each item in the list is a JSON string: { role, content }
 *  - On every request, Redis is checked first (fast, ~1ms)
 *  - On cache miss, Supabase is queried and Redis is warmed
 *  - Redis list is capped at MAX_HISTORY (500) messages via LTRIM
 *  - TTL is reset to 24h on every write (active sessions stay warm)
 *
 * Tiered depth:
 *  - Default: 25 messages (fast, from Redis)
 *  - Extended: up to 500 (from Supabase via warmCache)
 *  - Hard cap: 500 messages max
 */

import redis from '../config/redis.js';
import { getSessionMessages } from './ai-chat.service.js';

const REDIS_KEY_PREFIX  = 'ai:chat:history:';
const MAX_HISTORY       = 500;   // absolute cap stored in Redis
const DEFAULT_DEPTH     = 25;    // default messages sent to LLM per request
const CACHE_TTL_SECONDS = 86400; // 24 hours

/**
 * Build the Redis list key for a session.
 */
function redisKey(sessionId) {
    return `${REDIS_KEY_PREFIX}${sessionId}`;
}

/**
 * Fetch the last `depth` messages for a session.
 *
 * Strategy:
 *  1. Try Redis (LRANGE from the right side — newest messages)
 *  2. On miss, warm the cache from Supabase then retry
 *
 * @param {string} sessionId
 * @param {number} depth - how many messages to return (default 25, max 500)
 * @returns {Promise<Array<{role: string, content: string}>>}
 */
export async function getHistory(sessionId, depth = DEFAULT_DEPTH) {
    if (!sessionId) return [];

    const safeDepth = Math.min(Math.max(1, depth), MAX_HISTORY);
    const key = redisKey(sessionId);

    try {
        // Check if the Redis list exists
        const listLen = await redis.llen(key);

        if (listLen === 0) {
            // Cache miss — warm from Supabase
            await warmCache(sessionId);
        }

        // LRANGE with negative index: -safeDepth gets the last N items
        const raw = await redis.lrange(key, -safeDepth, -1);
        return raw.map(item => {
            try { return JSON.parse(item); }
            catch { return null; }
        }).filter(Boolean);

    } catch (err) {
        console.error(`[ChatHistory] Redis error for session ${sessionId}, falling back to Supabase:`, err?.message);
        // Graceful fallback: read directly from Supabase
        return await getHistoryFromSupabase(sessionId, safeDepth);
    }
}

/**
 * Append a new message to the session history in Redis.
 * Also resets TTL so active sessions stay warm.
 * Caps list at MAX_HISTORY via LTRIM.
 *
 * @param {string} sessionId
 * @param {'user'|'assistant'} role
 * @param {string} content
 */
export async function appendToHistory(sessionId, role, content) {
    if (!sessionId || !role || !content) return;

    const key = redisKey(sessionId);
    const item = JSON.stringify({ role, content });

    try {
        await redis.rpush(key, item);
        await redis.ltrim(key, -MAX_HISTORY, -1); // Keep only the last 500
        await redis.expire(key, CACHE_TTL_SECONDS); // Reset 24h TTL
    } catch (err) {
        // Non-fatal — history is already saved to Supabase separately
        console.warn(`[ChatHistory] Failed to append to Redis for session ${sessionId}:`, err?.message);
    }
}

/**
 * Populate Redis from Supabase for a cold session.
 * Called automatically on cache miss.
 *
 * @param {string} sessionId
 */
export async function warmCache(sessionId) {
    if (!sessionId) return;

    try {
        const dbMessages = await getSessionMessages(sessionId);
        if (!dbMessages || dbMessages.length === 0) return;

        const key = redisKey(sessionId);

        // Write all messages into Redis as a pipeline (atomic, fast)
        const pipeline = redis.pipeline();
        for (const msg of dbMessages) {
            if (msg.role === 'user' || msg.role === 'assistant') {
                pipeline.rpush(key, JSON.stringify({ role: msg.role, content: msg.content || '' }));
            }
        }
        pipeline.ltrim(key, -MAX_HISTORY, -1);
        pipeline.expire(key, CACHE_TTL_SECONDS);
        await pipeline.exec();

        console.info(`[ChatHistory] ✅ Warmed Redis cache for session ${sessionId} with ${dbMessages.length} messages`);
    } catch (err) {
        console.error(`[ChatHistory] Failed to warm Redis cache for session ${sessionId}:`, err?.message);
    }
}

/**
 * Invalidate (delete) the Redis cache for a session.
 * Call this when a session is deleted.
 *
 * @param {string} sessionId
 */
export async function invalidateHistoryCache(sessionId) {
    if (!sessionId) return;
    try {
        await redis.del(redisKey(sessionId));
        console.info(`[ChatHistory] 🗑️ Invalidated Redis cache for session ${sessionId}`);
    } catch (err) {
        console.warn(`[ChatHistory] Failed to invalidate Redis cache for session ${sessionId}:`, err?.message);
    }
}

/**
 * Direct Supabase fallback (no Redis).
 * Used when Redis is unavailable.
 *
 * @param {string} sessionId
 * @param {number} depth
 * @returns {Promise<Array<{role: string, content: string}>>}
 */
async function getHistoryFromSupabase(sessionId, depth = DEFAULT_DEPTH) {
    try {
        const dbMessages = await getSessionMessages(sessionId);
        if (!dbMessages) return [];
        return dbMessages
            .slice(-depth)
            .map(m => ({ role: m.role, content: m.content || '' }));
    } catch (err) {
        console.error(`[ChatHistory] Supabase fallback also failed for session ${sessionId}:`, err?.message);
        return [];
    }
}
