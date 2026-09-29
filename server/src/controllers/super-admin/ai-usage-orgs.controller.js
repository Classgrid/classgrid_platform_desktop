import Organization from "../../models/Organization.js";
import User from "../../models/User.js";
import AiCreditTransaction from "../../models/AiCreditTransaction.js";
import { primarySupabaseClient as supabase } from "../../config/supabaseClient.js";
import mongoose from "mongoose";

/**
 * PHASE 7: Super Admin AI Usage - Organizations Controller
 * Handles listing all organizations and drilling down into a specific org (Level 1).
 */

// Fetches the list of all organizations to display as folders on Level 0
export const listOrgsWithAiUsage = async (req, res) => {
    try {
        const orgs = await Organization.find({ status: "active" })
            .select("name _id ai_config.total_ai_tokens_used ai_config.is_ai_blocked")
            .lean();

        // Format for the Folder grid (AgentReviews pattern)
        const formattedOrgs = orgs.map(org => ({
            id: org._id,
            name: org.name,
            totalUsage: org.ai_config?.total_ai_tokens_used || 0,
            isBlocked: org.ai_config?.is_ai_blocked || false
        }));

        res.status(200).json({ success: true, data: formattedOrgs });
    } catch (error) {
        console.error("List Orgs AI Usage Error:", error);
        res.status(500).json({ success: false, error: "Failed to list organizations" });
    }
};

// Fetches full detail for a single organization (Level 1 Stats)
export const getOrgAiDetail = async (req, res) => {
    try {
        const { orgId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(orgId)) {
            return res.status(400).json({ success: false, error: "Invalid organization ID" });
        }

        const org = await Organization.findById(orgId).select("name ai_config status").lean();
        if (!org) {
            return res.status(404).json({ success: false, error: "Organization not found" });
        }

        // 1. Get Top-ups for this specific org
        const topups = await AiCreditTransaction.aggregate([
            {
                $match: {
                    orgId: new mongoose.Types.ObjectId(orgId),
                    status: "success",
                    type: "topup"
                }
            },
            {
                $group: {
                    _id: null,
                    total_amount_inr: { $sum: "$amount_inr" },
                    total_credits_added: { $sum: "$credits_added" }
                }
            }
        ]);

        const totalRevenue = topups[0]?.total_amount_inr || 0;
        const totalTopUpCredits = topups[0]?.total_credits_added || 0;

        // 2. Fetch all users in this org to calculate total chats from Supabase
        const users = await User.find({ organization_id: orgId }).select("_id email").lean();
        const userEmails = users.map(u => u.email).filter(e => e);

        let totalChats = 0;
        if (userEmails.length > 0) {
            const { count, error } = await supabase
                .from('ai_chat_sessions')
                .select('*', { count: 'exact', head: true })
                .in('user_email', userEmails);
                
            if (!error) {
                totalChats = count || 0;
            }
        }

        res.status(200).json({
            success: true,
            data: {
                id: org._id,
                name: org.name,
                isBlocked: org.ai_config?.is_ai_blocked || false,
                poolLimit: org.ai_config?.pro_pool_limit || 0,
                usedThisPeriod: org.ai_config?.pro_used_this_period || 0,
                totalUsage: org.ai_config?.total_ai_tokens_used || 0,
                totalRevenue,
                totalTopUpCredits,
                totalChats
            }
        });

    } catch (error) {
        console.error("Get Org AI Detail Error:", error);
        res.status(500).json({ success: false, error: "Failed to fetch organization details" });
    }
};
