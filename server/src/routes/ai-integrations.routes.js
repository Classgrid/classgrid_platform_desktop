import express from "express";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import User from "../models/User.js";
import connectDB from "../../config/db.js";

const router = express.Router();

// ─────────────────────────────────────────────
// GET /api/ai-integrations/status
// Returns REAL connection status for all integrations
// by checking actual OAuth tokens stored on the user.
// ─────────────────────────────────────────────
router.get("/status", isAuthenticated, async (req, res) => {
    try {
        await connectDB();
        const user = await User.findById(req.user._id).select(
            "google_access_token google_refresh_token microsoft_access_token microsoft_refresh_token zoom_access_token zoom_refresh_token vercel_access_token notion_access_token notion_refresh_token webex_access_token webex_refresh_token metadata"
        ).lean();

        if (!user) return res.status(404).json({ message: "User not found" });

        const connected = [];

        // Helper to check if a token is valid (exists, not empty, not "null")
        const isValidToken = (token) => {
            return token != null && typeof token === 'string' && token.trim().length > 5 && token !== "null" && token !== "undefined";
        };

        // Google Workspace — ONLY if real OAuth tokens exist AND they specifically connected that service
        if (isValidToken(user.google_access_token) || isValidToken(user.google_refresh_token)) {
            if (user.metadata && Array.isArray(user.metadata.connected_google_services)) {
                connected.push(...user.metadata.connected_google_services);
            }
        }

        // Microsoft — ONLY if real OAuth tokens exist
        if (isValidToken(user.microsoft_access_token) || isValidToken(user.microsoft_refresh_token)) {
            connected.push("outlook", "teams");
        }

        // Zoom — ONLY if real OAuth tokens exist
        if (isValidToken(user.zoom_access_token) || isValidToken(user.zoom_refresh_token)) {
            connected.push("zoom");
        }

        // Vercel — ONLY if real OAuth token exists
        if (isValidToken(user.vercel_access_token)) connected.push("vercel");

        // Notion — ONLY if real OAuth tokens exist
        if (isValidToken(user.notion_access_token) || isValidToken(user.notion_refresh_token)) connected.push("mcp-notion");

        // Log what we found for debugging
        console.log(`[Integration Status] User ${req.user._id}: connected=[${connected.join(',')}], google_token=${!!user.google_access_token}, ms_token=${!!user.microsoft_access_token}, zoom_token=${!!user.zoom_access_token}, vercel_token=${!!user.vercel_access_token}, notion_token=${!!user.notion_access_token}`);

        res.json({ connected });
    } catch (err) {
        console.error("AI Integration Status Error:", err);
        res.status(500).json({ message: "Failed to fetch integration status" });
    }
});

// ─────────────────────────────────────────────
// GET /api/ai-integrations/connect/:id  
// Only for integrations that don't have their own OAuth routes
// (MCP plugins like Cursor, ChatGPT, Claude, WhatsApp)
// ─────────────────────────────────────────────
router.get("/connect/:id", isAuthenticated, async (req, res) => {
    try {
        await connectDB();
        const { id } = req.params;
        
        const user = await User.findById(req.user._id);
        
        if (!user.metadata) user.metadata = {};
        if (!user.metadata.connected_integrations) {
            user.metadata.connected_integrations = [];
        }

        if (!user.metadata.connected_integrations.includes(id)) {
            user.metadata.connected_integrations.push(id);
            user.markModified('metadata');
            await user.save();
        }

        // Return success without a redirect URL so the frontend can just show a toast
        res.json({ success: true });

    } catch (err) {
        console.error("AI Integration Connect Error:", err);
        res.status(500).json({ message: "Failed to connect integration" });
    }
});

router.post("/disconnect/:id", isAuthenticated, async (req, res) => {
    try {
        await connectDB();
        const { id } = req.params;
        const user = await User.findById(req.user._id);
        
        if (user.metadata && user.metadata.connected_integrations) {
            user.metadata.connected_integrations = user.metadata.connected_integrations.filter(i => i !== id);
            user.markModified('metadata');
            await user.save();
        }

        res.json({ success: true, message: "Integration disconnected" });
    } catch (error) {
        console.error("Integration disconnect error:", error);
        res.status(500).json({ message: "Failed to disconnect" });
    }
});

export default router;

