// CLASSGRID USES CLOUDFLARE USAGE TO CALCULATE TOKENS, NOT GPT-TOKENIZER (WHICH IS ONLY A FALLBACK)
import express from 'express';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import User from '../models/User.js';

const router = express.Router();

router.post('/connect', isAuthenticated, async (req, res) => {
    try {
        const { projectId, apiToken } = req.body;

        if (!projectId || !apiToken) {
            return res.status(400).json({ success: false, message: 'Project ID and API Token are required.' });
        }

        // Test the Sanity connection
        const response = await fetch(`https://${projectId}.api.sanity.io/v2022-03-07/data/query/production?query=*[_type == "sanity.imageAsset"][0...1]`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            console.error('[Sanity API Error]', await response.text());
            return res.status(401).json({ success: false, message: 'Failed to verify Sanity credentials.' });
        }

        await User.findByIdAndUpdate(req.user._id, {
            sanity_project_id: projectId,
            sanity_access_token: apiToken,
        });

        res.json({ success: true, message: 'Sanity connected successfully.' });
    } catch (err) {
        console.error('[Sanity Connect Error]', err);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

router.post('/disconnect', isAuthenticated, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user._id, {
            sanity_project_id: null,
            sanity_access_token: null,
        });
        res.json({ success: true, message: 'Sanity disconnected successfully.' });
    } catch (err) {
        console.error('[Sanity Disconnect Error]', err);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

export default router;
