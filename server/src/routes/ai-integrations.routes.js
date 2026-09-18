import express from "express";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import User from "../models/User.js";

const router = express.Router();

router.get("/connect/:id", isAuthenticated, async (req, res) => {
    try {
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
