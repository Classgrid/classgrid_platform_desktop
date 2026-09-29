import User from "../../models/User.js";
import AiCreditTransaction from "../../models/AiCreditTransaction.js";
import { primarySupabaseClient as supabase } from "../../config/supabaseClient.js";
import mongoose from "mongoose";

/**
 * PHASE 8: Super Admin AI Usage - Users Controller
 * Handles Roles (Level 2) and Users (Level 3) of the Dashboard.
 */

// Lists all roles in an org and the users inside them
export const listUsersInOrg = async (req, res) => {
    try {
        const { orgId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(orgId)) {
            return res.status(400).json({ success: false, error: "Invalid organization ID" });
        }

        const users = await User.find({ organization_id: orgId })
            .select("name email role ai_tokens.total_ai_tokens_used ai_tokens.is_ai_blocked")
            .lean();

        // Group users by role for the Level 2 Folder Grid
        const roles = {};
        users.forEach(user => {
            const role = user.role || "unknown";
            if (!roles[role]) {
                roles[role] = {
                    roleName: role,
                    userCount: 0,
                    totalUsage: 0,
                    users: []
                };
            }
            roles[role].userCount += 1;
            roles[role].totalUsage += (user.ai_tokens?.total_ai_tokens_used || 0);
            roles[role].users.push({
                id: user._id,
                name: user.name,
                email: user.email,
                totalUsage: user.ai_tokens?.total_ai_tokens_used || 0,
                isBlocked: user.ai_tokens?.is_ai_blocked || false
            });
        });

        res.status(200).json({ success: true, data: Object.values(roles) });

    } catch (error) {
        console.error("List Users in Org Error:", error);
        res.status(500).json({ success: false, error: "Failed to list users" });
    }
};

// Fetches full detail for a single user (Level 3 Stats)
export const getUserAiDetail = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, error: "Invalid user ID" });
        }

        const user = await User.findById(userId)
            .select("name email role ai_tokens organization_id")
            .lean();

        if (!user) {
            return res.status(404).json({ success: false, error: "User not found" });
        }

        // 1. Fetch Top-up Purchase History
        const topupHistory = await AiCreditTransaction.find({ userId: userId })
            .sort({ createdAt: -1 })
            .lean();

        const totalTopUps = topupHistory.filter(t => t.type === "topup" && t.status === "success").length;

        // 2. Fetch Chat data from Supabase
        let totalChats = 0;
        let longestChat = null;

        if (user.email) {
            // Count total chats
            const { count, error: countError } = await supabase
                .from('ai_chat_sessions')
                .select('*', { count: 'exact', head: true })
                .eq('user_email', user.email);
            
            if (!countError) totalChats = count || 0;

            // Find longest chat (We approximate by looking at message count if stored, 
            // or we just fetch sessions and sort by updated_at / created_at difference if tracked.
            // For now, if we don't have message count in session table, we can just fetch the most recently updated one as a placeholder).
            const { data: latestChats } = await supabase
                .from('ai_chat_sessions')
                .select('id, title, updated_at, created_at')
                .eq('user_email', user.email)
                .order('updated_at', { ascending: false })
                .limit(1);

            if (latestChats && latestChats.length > 0) {
                longestChat = latestChats[0]; // Placeholder for longest chat
            }
        }

        // 3. Real 7-day Chart: Aggregate chat sessions from the last 7 days from Supabase
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        let spendChart = [];
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        if (user.email) {
            const { data: recentChats, error: recentChatsError } = await supabase
                .from('ai_chat_sessions')
                .select('created_at')
                .eq('user_email', user.email)
                .gte('created_at', sevenDaysAgo.toISOString());

            const dailyCounts = { "Sun": 0, "Mon": 0, "Tue": 0, "Wed": 0, "Thu": 0, "Fri": 0, "Sat": 0 };
            
            if (recentChats && !recentChatsError) {
                recentChats.forEach(chat => {
                    const date = new Date(chat.created_at);
                    const dayName = days[date.getDay()];
                    dailyCounts[dayName] = (dailyCounts[dayName] || 0) + 1;
                });
            }
            
            // Build the chart array for the last 7 days in order
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dayName = days[d.getDay()];
                spendChart.push({
                    day: dayName,
                    tokens: dailyCounts[dayName] // Using chat session count as a proxy for usage trend
                });
            }
        }

        res.status(200).json({
            success: true,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                aiTokens: user.ai_tokens,
                totalChats,
                longestChat,
                totalTopUps,
                topupHistory,
                spendChart
            }
        });

    } catch (error) {
        console.error("Get User AI Detail Error:", error);
        res.status(500).json({ success: false, error: "Failed to fetch user details" });
    }
};
