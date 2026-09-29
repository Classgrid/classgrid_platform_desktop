import User from "../../models/User.js";
import AiCreditTransaction from "../../models/AiCreditTransaction.js";

/**
 * PHASE 13: End User AI Credits Controller
 * Allows end-users (students, teachers, admins) to view their own balance,
 * free limits, and top-up transaction history.
 */

export const getMyCredits = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("ai_tokens").lean();
        
        if (!user) {
            return res.status(404).json({ success: false, error: "User not found" });
        }

        res.status(200).json({
            success: true,
            data: user.ai_tokens
        });
    } catch (error) {
        console.error("Get My AI Balance Error:", error);
        res.status(500).json({ success: false, error: "Failed to fetch AI balance" });
    }
};

export const getMyPurchaseHistory = async (req, res) => {
    try {
        const history = await AiCreditTransaction.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            data: history
        });
    } catch (error) {
        console.error("Get My Top-up History Error:", error);
        res.status(500).json({ success: false, error: "Failed to fetch top-up history" });
    }
};

export const getMyUsage = async (req, res) => {
    try {
        // Implement real usage retrieval from Supabase ai_chat_sessions
        const { primarySupabaseClient: supabase } = await import("../../config/supabaseClient.js");
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: recentChats, error } = await supabase
            .from('ai_chat_sessions')
            .select('created_at')
            .eq('user_email', req.user.email)
            .gte('created_at', sevenDaysAgo.toISOString());

        res.status(200).json({
            success: true,
            data: recentChats || []
        });
    } catch (error) {
        console.error("Get My Usage Error:", error);
        res.status(500).json({ success: false, error: "Failed to fetch AI usage" });
    }
};
