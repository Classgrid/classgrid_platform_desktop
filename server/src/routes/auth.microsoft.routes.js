import express from "express";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import User from "../models/User.js";
import connectDB from "../../config/db.js";

const router = express.Router();

const getMicrosoftAuthUrl = (userId) => {
    const tenant = 'common';
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const redirectUri = `${process.env.BACKEND_URL}/api/auth/microsoft/callback`;
    const scopes = ['offline_access', 'User.Read', 'Mail.Read', 'Calendars.ReadWrite', 'OnlineMeetings.ReadWrite'];
    
    const authUrl = new URL(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`);
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_mode', 'query');
    authUrl.searchParams.append('scope', scopes.join(' '));
    authUrl.searchParams.append('state', userId);
    
    return authUrl.toString();
};

// 1. GENERATE OAUTH URL
router.get("/connect", isAuthenticated, (req, res) => {
    if (!process.env.MICROSOFT_CLIENT_ID || !process.env.MICROSOFT_CLIENT_SECRET) {
        return res.status(500).json({ message: "Microsoft OAuth keys not configured in backend" });
    }
    const url = getMicrosoftAuthUrl(req.user._id.toString());
    res.json({ url });
});

// 2. HANDLE CALLBACK
router.get("/callback", async (req, res) => {
    try {
        await connectDB();
        const { code, state: userId, error, error_description } = req.query;

        if (error) {
            console.error("Microsoft OAuth Error:", error, error_description);
            return res.redirect(`${process.env.FRONTEND_URL}/tools?integration_error=microsoft`);
        }

        if (!code || !userId) {
            return res.redirect(`${process.env.FRONTEND_URL}/tools?integration_error=missing_params`);
        }

        // Exchange code for token
        const tokenResponse = await fetch(`https://login.microsoftonline.com/common/oauth2/v2.0/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env.MICROSOFT_CLIENT_ID,
                client_secret: process.env.MICROSOFT_CLIENT_SECRET,
                code: code,
                redirect_uri: `${process.env.BACKEND_URL}/api/auth/microsoft/callback`,
                grant_type: 'authorization_code'
            })
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            console.error("Token Exchange Error:", tokenData);
            return res.redirect(`${process.env.FRONTEND_URL}/tools?integration_error=microsoft_token`);
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.redirect(`${process.env.FRONTEND_URL}/tools?integration_error=user_not_found`);
        }

        user.microsoft_access_token = tokenData.access_token;
        if (tokenData.refresh_token) {
            user.microsoft_refresh_token = tokenData.refresh_token; 
        }
        if (tokenData.expires_in) {
            user.microsoft_token_expiry = new Date(Date.now() + tokenData.expires_in * 1000);
        }

        await user.save();

        res.redirect(`${process.env.FRONTEND_URL}/tools?integration_success=microsoft`);
    } catch (err) {
        console.error("Microsoft Callback Error:", err);
        res.redirect(`${process.env.FRONTEND_URL}/tools?integration_error=microsoft_fatal`);
    }
});

// 3. DISCONNECT ACCOUNT
router.post("/disconnect", isAuthenticated, async (req, res) => {
    try {
        await connectDB();
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.microsoft_access_token = undefined;
        user.microsoft_refresh_token = undefined;
        user.microsoft_token_expiry = undefined;
        await user.save();

        res.json({ success: true, message: "Microsoft account disconnected" });
    } catch (err) {
        console.error("Microsoft Disconnect Error:", err);
        res.status(500).json({ message: "Failed to disconnect Microsoft account" });
    }
});

export default router;
