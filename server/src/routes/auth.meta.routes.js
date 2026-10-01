import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import User from '../models/User.js';

const router = express.Router();

/**
 * @route POST /api/auth/meta/connect
 * @desc  Save Meta Access Token, Page ID, and Instagram Account ID for AI Hub.
 * @access Private
 */
router.post('/connect', protect, async (req, res) => {
    try {
        const { meta_access_token, meta_page_id, meta_ig_account_id } = req.body;

        if (!meta_access_token) {
            return res.status(400).json({ success: false, message: 'Meta Access Token is required.' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.meta_access_token = meta_access_token;
        user.meta_page_id = meta_page_id || null;
        user.meta_ig_account_id = meta_ig_account_id || null;
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Meta connection successfully updated.',
            data: {
                has_page: !!meta_page_id,
                has_ig: !!meta_ig_account_id
            }
        });
    } catch (error) {
        console.error('Error connecting Meta:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

/**
 * @route DELETE /api/auth/meta/disconnect
 * @desc  Disconnect Meta credentials
 * @access Private
 */
router.delete('/disconnect', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.meta_access_token = null;
        user.meta_page_id = null;
        user.meta_ig_account_id = null;
        await user.save();

        return res.status(200).json({ success: true, message: 'Meta integration disconnected.' });
    } catch (error) {
        console.error('Error disconnecting Meta:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

export default router;
