import express from "express";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import User from "../models/User.js";
import connectDB from "../../config/db.js";

const router = express.Router();

const getNotionAuthUrl = (state) => {
    const clientId = process.env.NOTION_CLIENT_ID;
    const redirectUri = `${process.env.BACKEND_URL}/api/auth/notion/callback`;
    
    const authUrl = new URL(`https://api.notion.com/v1/oauth/authorize`);
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('owner', 'user');
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('state', state);
    
    return authUrl.toString();
};

// 1. GENERATE OAUTH URL
router.get("/connect", isAuthenticated, (req, res) => {
    if (!process.env.NOTION_CLIENT_ID || !process.env.NOTION_CLIENT_SECRET) {
        return res.status(500).json({ message: "Notion OAuth keys not configured in backend" });
    }

    const returnTo = req.query.returnTo || req.headers.referer || req.headers.origin || process.env.FRONTEND_URL;
    const statePayload = Buffer.from(JSON.stringify({ 
        userId: req.user._id.toString(),
        returnTo 
    })).toString('base64');

    const url = getNotionAuthUrl(statePayload);
    res.json({ url });
});

// 2. HANDLE CALLBACK
router.get("/callback", async (req, res) => {
    try {
        await connectDB();
        const { code, state, error, error_description } = req.query;

        let userId, returnTo = process.env.FRONTEND_URL;
        if (state) {
            try {
                const decodedState = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
                userId = decodedState.userId;
                if (decodedState.returnTo) returnTo = decodedState.returnTo;
            } catch (e) {
                userId = state;
            }
        }

        if (error) {
            console.error("Notion OAuth Error:", error, error_description);
            return res.redirect(`${returnTo}?integration_error=notion`);
        }

        if (!code || !userId) {
            return res.redirect(`${returnTo}?integration_error=missing_params`);
        }

        // Exchange code for token
        const credentials = Buffer.from(`${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`).toString('base64');
        const tokenResponse = await fetch(`https://api.notion.com/v1/oauth/token`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json',
                'Notion-Version': '2022-06-28'
            },
            body: JSON.stringify({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: `${process.env.BACKEND_URL}/api/auth/notion/callback`
            })
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            console.error("Notion Token Exchange Error:", tokenData);
            return res.redirect(`${returnTo}?integration_error=notion_token`);
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.redirect(`${returnTo}?integration_error=user_not_found`);
        }

        // Notion tokens are long-lived by default.
        user.notion_access_token = tokenData.access_token;
        if (tokenData.refresh_token) {
            user.notion_refresh_token = tokenData.refresh_token; 
        }
        
        await user.save();

        const redirectUrl = new URL(returnTo);
        redirectUrl.searchParams.set('integration_success', 'notion');
        res.redirect(redirectUrl.toString());
    } catch (err) {
        console.error("Notion Callback Error:", err);
        res.redirect(`${process.env.FRONTEND_URL}/tools?integration_error=notion_fatal`);
    }
});

// 3. DISCONNECT ACCOUNT
router.post("/disconnect", isAuthenticated, async (req, res) => {
    try {
        await connectDB();
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.notion_access_token = undefined;
        user.notion_refresh_token = undefined;
        user.notion_token_expiry = undefined;
        await user.save();

        res.json({ success: true, message: "Notion account disconnected" });
    } catch (err) {
        console.error("Notion Disconnect Error:", err);
        res.status(500).json({ message: "Failed to disconnect Notion account" });
    }
});

export default router;
