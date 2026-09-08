import { primarySupabaseClient } from '../config/supabaseClient.js';
import accessLogger from '../config/logger.js';

/**
 * Creates a new AI chat session.
 */
export async function createSession(userEmail, title, isIncognito = false) {
    if (isIncognito) return null; // Do not save incognito sessions

    const { data, error } = await primarySupabaseClient
        .from('ai_chat_sessions')
        .insert([{ user_email: userEmail, title, is_incognito: false }])
        .select()
        .single();

    if (error) {
        console.error("Error creating AI chat session:", error);
        throw error;
    }
    
    return data;
}

/**
 * Updates the title of an existing AI chat session.
 */
export async function updateSessionTitle(sessionId, title) {
    if (!sessionId) return null;

    const { data, error } = await primarySupabaseClient
        .from('ai_chat_sessions')
        .update({ title })
        .eq('id', sessionId)
        .select()
        .single();

    if (error) {
        console.error("Error updating AI chat session title:", error);
        throw error;
    }

    return data;
}

/**
 * Saves a message to an existing chat session.
 */
export async function saveMessage(sessionId, role, content, fileUrls = []) {
    if (!sessionId) return null;

    const { data, error } = await primarySupabaseClient
        .from('ai_chat_messages')
        .insert([{ session_id: sessionId, role, content, file_urls: fileUrls }])
        .select()
        .single();

    if (error) {
        console.error("Error saving AI chat message:", error);
        throw error;
    }

    return data;
}

/**
 * Retrieves all non-incognito sessions for a user.
 */
export async function getSessions(userEmail) {
    const { data, error } = await primarySupabaseClient
        .from('ai_chat_sessions')
        .select('*')
        .eq('user_email', userEmail)
        .eq('is_incognito', false)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching AI chat sessions:", error);
        throw error;
    }

    return data;
}

/**
 * Retrieves all messages for a given session.
 */
export async function getSessionMessages(sessionId) {
    const { data, error } = await primarySupabaseClient
        .from('ai_chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error("Error fetching AI chat messages:", error);
        throw error;
    }

    return data;
}

/**
 * Deletes a chat session and its messages.
 */
export async function deleteSession(sessionId) {
    if (!sessionId) return null;

    // Messages cascade delete if foreign key is set up, but let's delete messages first just in case
    await primarySupabaseClient.from('ai_chat_messages').delete().eq('session_id', sessionId);
    
    const { error } = await primarySupabaseClient
        .from('ai_chat_sessions')
        .delete()
        .eq('id', sessionId);

    if (error) {
        console.error("Error deleting AI chat session:", error);
        throw error;
    }
    return true;
}

/**
 * Updates the pinned status of a chat session.
 */
export async function updateSessionPinned(sessionId, pinned) {
    if (!sessionId) return null;

    const { data, error } = await primarySupabaseClient
        .from('ai_chat_sessions')
        .update({ pinned })
        .eq('id', sessionId)
        .select()
        .single();

    if (error) {
        console.error("Error updating AI chat session pinned status:", error);
        throw error;
    }
    return data;
}

/**
 * Retrieves a single session by ID.
 */
export async function getSessionById(sessionId) {
    const { data, error } = await primarySupabaseClient
        .from('ai_chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

    if (error) {
        console.error("Error fetching session:", error);
        return null; // Might not exist
    }
    return data;
}

// ─────────────────────────────────────────────────
// PUBLIC CHAT SHARING
// ─────────────────────────────────────────────────

import crypto from 'crypto';

/**
 * Generates a short, URL-safe share ID (10 chars).
 */
function generateShareId() {
    return crypto.randomBytes(8).toString('base64url').slice(0, 10);
}

/**
 * Creates a public snapshot of a chat session for sharing.
 * Stores a frozen copy of all messages so the shared link remains valid
 * even if the original session is later edited or deleted.
 */
export async function createSharedSnapshot(sessionId, userEmail, userName, title, messages) {
    const shareId = generateShareId();

    const { data, error } = await primarySupabaseClient
        .from('shared_chat_snapshots')
        .insert([{
            share_id: shareId,
            original_session_id: sessionId,
            user_email: userEmail,
            user_name: userName || userEmail.split('@')[0],
            title,
            messages: JSON.stringify(messages),
        }])
        .select()
        .single();

    if (error) {
        console.error("[Share] Error creating shared snapshot:", error);
        throw error;
    }

    console.info(`[Share] ✅ Created public share ${shareId} for session ${sessionId} by ${userEmail}`);
    return data;
}

/**
 * Retrieves a shared chat snapshot by its public share ID.
 * No authentication required — this is a public endpoint.
 */
export async function getSharedSnapshot(shareId) {
    const { data, error } = await primarySupabaseClient
        .from('shared_chat_snapshots')
        .select('*')
        .eq('share_id', shareId)
        .single();

    if (error) {
        console.warn(`[Share] Snapshot not found for shareId: ${shareId}`);
        return null;
    }

    return data;
}
