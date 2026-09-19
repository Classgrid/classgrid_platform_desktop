import express from "express";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import User from "../models/User.js";
import connectDB from "../../config/db.js";

const router = express.Router();

const getVercelAuthUrl = (state) => {
    const clientId = process.env.VERCEL_CLIENT_ID;
    const redirectUri = `${process.env.BACKEND_URL}/api/auth/vercel/callback`;
    const authUrl = new URL(`https://vercel.com/oauth/authorize`);
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('state', state);
    
    return authUrl.toString();
};

// 1. GENERATE OAUTH URL
router.get("/connect", isAuthenticated, (req, res) => {
    if (!process.env.VERCEL_CLIENT_ID || !process.env.VERCEL_CLIENT_SECRET) {
        return res.status(500).json({ message: "Vercel OAuth keys not configured in backend" });
    }

    const returnTo = req.query.returnTo || req.headers.referer || req.headers.origin || process.env.FRONTEND_URL;
    const statePayload = Buffer.from(JSON.stringify({ 
        userId: req.user._id.toString(),
        returnTo 
    })).toString('base64');

    const url = getVercelAuthUrl(statePayload);
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
            console.error("Vercel OAuth Error:", error, error_description);
            return res.redirect(`${returnTo}?integration_error=vercel`);
        }

        if (!code || !userId) {
            return res.redirect(`${returnTo}?integration_error=missing_params`);
        }

        // Exchange code for token
        const tokenResponse = await fetch(`https://api.vercel.com/v2/oauth/access_token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                client_id: process.env.VERCEL_CLIENT_ID,
                client_secret: process.env.VERCEL_CLIENT_SECRET,
                code: code,
                redirect_uri: `${process.env.BACKEND_URL}/api/auth/vercel/callback`
            })
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            console.error("Vercel Token Exchange Error:", tokenData);
            return res.redirect(`${returnTo}?integration_error=vercel_token`);
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.redirect(`${returnTo}?integration_error=user_not_found`);
        }

        user.vercel_access_token = tokenData.access_token;
        await user.save();

        const redirectUrl = new URL(returnTo);
        redirectUrl.searchParams.set('integration_success', 'vercel');
        res.redirect(redirectUrl.toString());
    } catch (err) {
        console.error("Vercel Callback Error:", err);
        res.redirect(`${process.env.FRONTEND_URL || 'https://classgrid.in'}?integration_error=vercel_fatal`);
    }
});

// 3. DISCONNECT ACCOUNT
router.post("/disconnect", isAuthenticated, async (req, res) => {
    try {
        await connectDB();
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.vercel_access_token = undefined;
        await user.save();

        res.json({ success: true, message: "Vercel account disconnected" });
    } catch (err) {
        console.error("Vercel Disconnect Error:", err);
        res.status(500).json({ message: "Failed to disconnect Vercel account" });
    }
});

export default router;
