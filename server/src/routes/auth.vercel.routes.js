import express from 'express';
import User from '../models/User.js';
import fetch from 'node-fetch';

const router = express.Router();

// The callback URL registered in the Vercel Developer App should be:
// https://api.classgrid.in/auth/vercel/callback
router.get('/vercel/callback', async (req, res) => {
  try {
    const { code, state, next } = req.query;

    if (!code) {
      return res.status(400).send('Error: Missing authorization code from Vercel.');
    }

    if (!state) {
      return res.status(400).send('Error: Missing state parameter (User ID).');
    }

    const userId = state;

    // Exchange the authorization code for an access token
    const tokenResponse = await fetch('https://api.vercel.com/v2/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.VERCEL_CLIENT_ID,
        client_secret: process.env.VERCEL_CLIENT_SECRET,
        code,
        redirect_uri: process.env.VERCEL_REDIRECT_URI || 'https://api.classgrid.in/auth/vercel/callback',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Vercel Token Exchange Error:', errorText);
      return res.status(500).send(`Failed to exchange token with Vercel: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    const { access_token } = tokenData;

    // Save the access token to the User document
    await User.findByIdAndUpdate(userId, {
      vercel_access_token: access_token
    });

    // Redirect the user back to the frontend settings page
    // Using a default frontend URL, can be configured via ENV
    const frontendUrl = process.env.FRONTEND_URL || 'https://app.classgrid.in';
    const redirectTarget = next ? decodeURIComponent(next) : `${frontendUrl}/superadmin/settings?integration=success`;
    
    res.redirect(redirectTarget);

  } catch (error) {
    console.error('Vercel OAuth Callback Error:', error);
    res.status(500).send('An internal error occurred during Vercel authentication.');
  }
});

export default router;
