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
            "vercel_access_token notion_access_token notion_refresh_token google_workspace_tokens microsoft_access_token microsoft_refresh_token zoom_access_token zoom_refresh_token metadata"
        ).lean();

        if (!user) return res.status(404).json({ message: "User not found" });

        // Check actual token presence for each integration
        const connected = [];

        // Vercel
        if (user.vercel_access_token) connected.push("vercel");

        // Notion
        if (user.notion_access_token) connected.push("mcp-notion");

        // Google Workspace services (single token grants access to all)
        if (user.google_workspace_tokens?.access_token) {
            const scopes = user.google_workspace_tokens.scope || "";
            if (scopes.includes("gmail") || scopes.includes("mail")) connected.push("gmail");
            if (scopes.includes("calendar")) connected.push("gcal");
            if (scopes.includes("drive")) connected.push("gdrive");
            if (scopes.includes("classroom")) connected.push("gclass");
            // Google Meet uses Calendar API, so if calendar is connected, meet works too
            if (scopes.includes("calendar")) connected.push("gmeet");
        }

        // Microsoft (Outlook + Teams share the same token)
        if (user.microsoft_access_token) {
            connected.push("outlook");
            connected.push("teams");
        }

        // Zoom
        if (user.zoom_access_token) connected.push("zoom");

        // MCP integrations (Cursor, ChatGPT, Claude) — these are stored in metadata
        // because they use API key pairing, not full OAuth
        const mcpConnected = user.metadata?.connected_integrations || [];
        for (const id of mcpConnected) {
            if (!connected.includes(id)) connected.push(id);
        }

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

