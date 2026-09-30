import User from "../../models/User.js";
import Organization from "../../models/Organization.js";
import AiCreditTransaction from "../../models/AiCreditTransaction.js";
import mongoose from "mongoose";

/**
 * PHASE 9: Super Admin AI Credits Admin Controller
 * Handles mutations: Blocking, Unblocking, Resetting limits, Granting credits.
 */

export const blockAiUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { isBlocked } = req.body;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, error: "Invalid user ID" });
        }

        const user = await User.findByIdAndUpdate(
            userId, 
            { $set: { "ai_tokens.is_ai_blocked": isBlocked } }, 
            { new: true }
        );

        if (!user) return res.status(404).json({ success: false, error: "User not found" });

        res.status(200).json({ success: true, message: `User AI access ${isBlocked ? 'blocked' : 'unblocked'}` });
    } catch (error) {
        console.error("Block AI User Error:", error);
        res.status(500).json({ success: false, error: "Failed to update user block status" });
    }
};

export const blockAiOrg = async (req, res) => {
    try {
        const { orgId } = req.params;
        const { isBlocked } = req.body;

        if (!mongoose.Types.ObjectId.isValid(orgId)) {
            return res.status(400).json({ success: false, error: "Invalid org ID" });
        }

        const org = await Organization.findByIdAndUpdate(
            orgId, 
            { $set: { "ai_config.is_ai_blocked": isBlocked } }, 
            { new: true }
        );

        if (!org) return res.status(404).json({ success: false, error: "Organization not found" });

        res.status(200).json({ success: true, message: `Organization AI access ${isBlocked ? 'blocked' : 'unblocked'}` });
    } catch (error) {
        console.error("Block AI Org Error:", error);
        res.status(500).json({ success: false, error: "Failed to update org block status" });
    }
};

export const resetUserUsage = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, error: "Invalid user ID" });
        }

        // Resets their used_this_week counter to 0
        await User.findByIdAndUpdate(userId, {
            $set: { "ai_tokens.used_this_week": 0 }
        });

        res.status(200).json({ success: true, message: "User weekly usage reset to 0." });
    } catch (error) {
        console.error("Reset User Usage Error:", error);
        res.status(500).json({ success: false, error: "Failed to reset user usage" });
    }
};

export const resetOrgUsage = async (req, res) => {
    try {
        const { orgId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(orgId)) {
            return res.status(400).json({ success: false, error: "Invalid org ID" });
        }

        // Resets the org's pro pool usage
        await Organization.findByIdAndUpdate(orgId, {
            $set: { "ai_config.pro_used_this_period": 0 }
        });

        // Optionally reset ALL users in this org's weekly limits
        await User.updateMany(
            { organization_id: orgId },
            { $set: { "ai_tokens.used_this_week": 0 } }
        );

        res.status(200).json({ success: true, message: "Organization and all member usage reset." });
    } catch (error) {
        console.error("Reset Org Usage Error:", error);
        res.status(500).json({ success: false, error: "Failed to reset org usage" });
    }
};

export const grantCredits = async (req, res) => {
    try {
        const { userId } = req.params;
        const { amount } = req.body; // Token amount

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, error: "Invalid user ID" });
        }
        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, error: "Invalid amount" });
        }

        const user = await User.findByIdAndUpdate(
            userId, 
            { $inc: { "ai_tokens.ai_credits_balance": amount } }, 
            { new: true }
        );

        if (!user) return res.status(404).json({ success: false, error: "User not found" });

        // Record the transaction
        await AiCreditTransaction.create({
            userId: user._id,
            orgId: user.organization_id,
            amount_inr: 0, // Manual grant is free
            credits_added: amount,
            razorpay_payment_id: `grant_${new Date().getTime()}`,
            razorpay_order_id: `admin_grant`,
            type: "grant",
            status: "success"
        });

        res.status(200).json({ success: true, message: `${amount} credits granted to user.` });
    } catch (error) {
        console.error("Grant Credits Error:", error);
        res.status(500).json({ success: false, error: "Failed to grant credits" });
    }
};

export const deleteUserAiData = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);
        
        if (!user) return res.status(404).json({ success: false, error: "User not found" });

        // Delete from Supabase
        if (user.email) {
            const { error } = await supabase
                .from('ai_chat_sessions')
                .delete()
                .eq('user_email', user.email);
            
            if (error) console.error("Error deleting Supabase chat data:", error);
        }

        res.status(200).json({ success: true, message: "User AI chat data deleted from Supabase." });
    } catch (error) {
        console.error("Delete User AI Data Error:", error);
        res.status(500).json({ success: false, error: "Failed to delete user AI data" });
    }
};

export const updateOrgAiLimits = async (req, res) => {
    try {
        const { orgId } = req.params;
        const { pro_pool_limit, free_weekly_limit_per_user } = req.body;

        if (!mongoose.Types.ObjectId.isValid(orgId)) {
            return res.status(400).json({ success: false, error: "Invalid org ID" });
        }

        const org = await Organization.findByIdAndUpdate(
            orgId,
            { 
                $set: { 
                    "ai_config.pro_pool_limit": pro_pool_limit,
                    "ai_config.free_weekly_limit_per_user": free_weekly_limit_per_user
                } 
            },
            { new: true }
        );

        if (!org) return res.status(404).json({ success: false, error: "Organization not found" });

        // Update the default weekly limit for all users in this org
        await User.updateMany(
            { organization_id: orgId },
            { $set: { "ai_tokens.free_weekly_limit": free_weekly_limit_per_user } }
        );

        res.status(200).json({ success: true, message: "Organization AI limits updated successfully." });
    } catch (error) {
        console.error("Update Org AI Limits Error:", error);
        res.status(500).json({ success: false, error: "Failed to update org AI limits" });
    }
};
