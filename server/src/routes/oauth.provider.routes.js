import express from "express";
import crypto from "crypto";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import { OAuthClient, OAuthAuthCode, OAuthToken } from "../models/OAuth.js";
import connectDB from "../../config/db.js";
import User from "../models/User.js";

const router = express.Router();

// Helper to generate secure tokens
const generateToken = (length = 40) => crypto.randomBytes(length).toString('hex');

// ─────────────────────────────────────────────
// 1. DEVELOPER UI: Create an OAuth App (Client)
// ─────────────────────────────────────────────
router.post("/clients/register", isAuthenticated, async (req, res) => {
    try {
        await connectDB();
        const { name, redirectUris } = req.body;
        
        if (!name || !redirectUris || redirectUris.length === 0) {
            return res.status(400).json({ message: "Name and at least one Redirect URI are required." });
        }

        const clientId = `cg_${generateToken(16)}`; // e.g. cg_abc123...
        const clientSecret = `cg_secret_${generateToken(32)}`;

        const client = new OAuthClient({
            clientId,
            clientSecret,
            name,
            redirectUris,
            createdBy: req.user._id
        });

        await client.save();
        res.status(201).json({ 
            message: "App registered successfully", 
            clientId, 
            clientSecret 
        });
    } catch (err) {
        console.error("Register OAuth Client Error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// ─────────────────────────────────────────────
// 1.5 DYNAMIC CLIENT REGISTRATION (DCR)
// ─────────────────────────────────────────────
router.post("/register", async (req, res) => {
    try {
        await connectDB();
        const { client_name, redirect_uris } = req.body;
        
        if (!redirect_uris || !Array.isArray(redirect_uris) || redirect_uris.length === 0) {
            return res.status(400).json({ error: "invalid_redirect_uri" });
        }

        const clientId = `cg_${generateToken(16)}`;
        const clientSecret = `cg_secret_${generateToken(32)}`;

        const client = new OAuthClient({
            clientId,
            clientSecret,
            name: client_name || "Dynamic Custom Connector",
            redirectUris: redirect_uris,
            createdBy: null
        });

        await client.save();

        res.status(201).json({ 
            client_id: clientId, 
            client_secret: clientSecret,
            client_id_issued_at: Math.floor(Date.now() / 1000),
            client_name: client.name,
            redirect_uris: client.redirectUris
        });
    } catch (err) {
        console.error("DCR Register Error:", err);
        res.status(500).json({ error: "server_error" });
    }
});

// ─────────────────────────────────────────────
// 2. AUTHORIZATION ENDPOINT (Shows Consent Screen)
// ─────────────────────────────────────────────
router.get("/authorize", isAuthenticated, async (req, res) => {
    try {
        await connectDB();
        const { client_id, redirect_uri, response_type, state } = req.query;

        if (response_type !== "code") {
            return res.status(400).json({ error: "unsupported_response_type" });
        }

        const client = await OAuthClient.findOne({ clientId: client_id });
        if (!client) {
            return res.status(400).json({ error: "invalid_client" });
        }

        if (!client.redirectUris.includes(redirect_uri)) {
            return res.status(400).json({ error: "invalid_grant", message: "Redirect URI mismatch" });
        }

        // Ideally, we'd render a frontend consent screen here: "Notion wants access to your data..."
        // But since this is API-first, we'll respond with the app details so the frontend can build the UI.
        res.json({
            client: { name: client.name, clientId: client.clientId },
            user: { name: req.user.name, email: req.user.email },
            redirect_uri,
            state
        });
    } catch (err) {
        console.error("Authorize GET Error:", err);
        res.status(500).json({ error: "server_error" });
    }
});

// ─────────────────────────────────────────────
// 3. AUTHORIZATION ENDPOINT (User clicks "Allow")
// ─────────────────────────────────────────────
router.post("/authorize", isAuthenticated, async (req, res) => {
    try {
        await connectDB();
        const { client_id, redirect_uri, state, allow } = req.body;

        const client = await OAuthClient.findOne({ clientId: client_id });
        if (!client || !client.redirectUris.includes(redirect_uri)) {
            return res.status(400).json({ error: "invalid_request" });
        }

        if (!allow) {
            // User denied access
            const redirectUrl = new URL(redirect_uri);
            redirectUrl.searchParams.append("error", "access_denied");
            if (state) redirectUrl.searchParams.append("state", state);
            return res.json({ redirect_url: redirectUrl.toString() });
        }

        // Generate short-lived Auth Code (expires in 10 mins)
        const code = generateToken(20);
        await new OAuthAuthCode({
            authorizationCode: code,
            expiresAt: new Date(Date.now() + 10 * 60000), // 10 mins
            redirectUri: redirect_uri,
            clientId: client_id,
            userId: req.user._id
        }).save();

        const redirectUrl = new URL(redirect_uri);
        redirectUrl.searchParams.append("code", code);
        if (state) redirectUrl.searchParams.append("state", state);

        res.json({ redirect_url: redirectUrl.toString() });
    } catch (err) {
        console.error("Authorize POST Error:", err);
        res.status(500).json({ error: "server_error" });
    }
});

// ─────────────────────────────────────────────
// 4. TOKEN ENDPOINT (Exchange Code for Token)
// ─────────────────────────────────────────────
router.post("/token", async (req, res) => {
    try {
        await connectDB();
        const { grant_type, code, redirect_uri, client_id, client_secret } = req.body;

        // Basic Auth support (some clients send credentials in headers)
        let cId = client_id;
        let cSecret = client_secret;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Basic ')) {
            const decoded = Buffer.from(authHeader.split(' ')[1], 'base64').toString('ascii');
            [cId, cSecret] = decoded.split(':');
        }

        if (grant_type !== "authorization_code") {
            return res.status(400).json({ error: "unsupported_grant_type" });
        }

        const client = await OAuthClient.findOne({ clientId: cId, clientSecret: cSecret });
        if (!client) {
            return res.status(401).json({ error: "invalid_client" });
        }

        const authCode = await OAuthAuthCode.findOne({ authorizationCode: code });
        if (!authCode || authCode.clientId !== cId || authCode.redirectUri !== redirect_uri) {
            return res.status(400).json({ error: "invalid_grant" });
        }

        if (new Date() > authCode.expiresAt) {
            await OAuthAuthCode.deleteOne({ _id: authCode._id });
            return res.status(400).json({ error: "invalid_grant", message: "Code expired" });
        }

        // Generate JWT / Bearer Token
        const accessToken = generateToken(40);
        const refreshToken = generateToken(40);

        await new OAuthToken({
            accessToken,
            accessTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60000), // 24 hours
            refreshToken,
            refreshTokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60000), // 30 days
            clientId: cId,
            userId: authCode.userId
        }).save();

        // Burn the auth code so it can't be reused
        await OAuthAuthCode.deleteOne({ _id: authCode._id });

        res.json({
            access_token: accessToken,
            token_type: "Bearer",
            expires_in: 86400, // 24 hours in seconds
            refresh_token: refreshToken
        });
    } catch (err) {
        console.error("Token POST Error:", err);
        res.status(500).json({ error: "server_error" });
    }
});

// Middleware to protect routes that require Classgrid OAuth Tokens
export const requireOAuthBearer = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: "Unauthorized. Bearer token missing." });
        }

        const token = authHeader.split(' ')[1];
        const oauthToken = await OAuthToken.findOne({ accessToken: token }).populate('userId');

        if (!oauthToken) {
            return res.status(401).json({ error: "Invalid token" });
        }

        if (new Date() > oauthToken.accessTokenExpiresAt) {
            return res.status(401).json({ error: "Token expired" });
        }

        req.user = oauthToken.userId; // Inject user just like standard auth
        req.oauthClient = oauthToken.clientId;
        next();
    } catch (err) {
        res.status(500).json({ error: "server_error" });
    }
};

export default router;
