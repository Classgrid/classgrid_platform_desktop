import Organization from "../../models/Organization.js";
import User from "../../models/User.js";
import AiCreditTransaction from "../../models/AiCreditTransaction.js";
import AiUsageLog from "../../models/AiUsageLog.js";
import { primarySupabaseClient as supabase } from "../../config/supabaseClient.js";
import mongoose from "mongoose";

// PHASE 6: Super Admin Global AI Usage Controller

export const getGlobalStats = async (req, res) => {
    try {
        const { month, year, orgId } = req.query;

        const currentDate = new Date();
        let targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
        let targetYear = year ? parseInt(year) : currentDate.getFullYear();
        
        const startDate = new Date(targetYear, targetMonth - 1, 1);
        const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

        let userMatch = {};
        let topupMatch = { status: "success", type: "topup", createdAt: { $gte: startDate, $lte: endDate } };
        let chatQuery = supabase.from('ai_chat_sessions').select('*', { count: 'exact', head: true });
        let logMatch = { createdAt: { $gte: startDate, $lte: endDate } };

        if (orgId && orgId !== "all") {
            if (orgId === "classgrid") {
                userMatch = { $or: [{ role: 'super_admin' }, { organization_id: null }, { organization_id: { $exists: false } }] };
                topupMatch.orgId = null; // Assuming no topups for classgrid
                logMatch.organization_id = null;
                // For supabase, we would need to get these specific user emails to filter, simplifying for now
            } else {
                if (mongoose.Types.ObjectId.isValid(orgId)) {
                    userMatch.organization_id = new mongoose.Types.ObjectId(orgId);
                    topupMatch.orgId = new mongoose.Types.ObjectId(orgId);
                    logMatch.organization_id = new mongoose.Types.ObjectId(orgId);
                }
            }
        }

        // Fetch total tokens (credits) used
        const userStats = await User.aggregate([
            { $match: userMatch },
            {
                $group: {
                    _id: null,
                    total_tokens_used: { $sum: "$ai_tokens.total_ai_tokens_used" }
                }
            }
        ]);
        const totalCreditsSpent = userStats[0]?.total_tokens_used || 0;

        // Fetch total top-ups
        const topups = await AiCreditTransaction.aggregate([
            { $match: topupMatch },
            {
                $group: {
                    _id: null,
                    total_amount_inr: { $sum: "$amount_inr" },
                    total_credits_added: { $sum: "$credits_added" }
                }
            }
        ]);
        const totalRevenue = topups[0]?.total_amount_inr || 0;
        const creditsPurchasedThisMonth = topups[0]?.total_credits_added || 0;

        // Total Chats globally or by org (Approximated if orgId is passed to avoid heavy Supabase filtering)
        // If orgId is passed, we fetch users first
        let totalChats = 0;
        if (orgId && orgId !== "all" && orgId !== "classgrid") {
             const users = await User.find(userMatch).select("email").lean();
             const emails = users.map(u => u.email).filter(e => e);
             if (emails.length > 0) {
                 const { count, error } = await supabase
                    .from('ai_chat_sessions')
                    .select('*', { count: 'exact', head: true })
                    .in('user_email', emails);
                 if (!error) totalChats = count || 0;
             }
        } else {
            const { count, error } = await chatQuery;
            if (!error) totalChats = count || 0;
        }

        const totalModels = 6;
        const textTokens = Math.floor(totalCreditsSpent * 0.75); // 75% for text
        const imageTokens = Math.floor(totalCreditsSpent * 0.15); // 15% for image
        const audioTokens = totalCreditsSpent - textTokens - imageTokens; // 10% for audio

        const mockModels = [
            { name: "@cf/deepseek-ai/deepseek-v4-pro-0813", type: "Text (Primary)", usage: "Primary Chat", value: textTokens },
            { name: "@cf/black-forest-labs/flux-1-schnell", type: "Image Gen", usage: "Image Generation", value: Math.floor(imageTokens * 0.7) },
            { name: "@cf/meta/llama-3.2-11b-vision-instruct", type: "Image Understanding", usage: "Vision/Analysis", value: Math.floor(imageTokens * 0.3) },
            { name: "@cf/openai/whisper-large-v3-turbo", type: "STT", usage: "Speech to Text", value: Math.floor(audioTokens * 0.8) },
            { name: "@cf/deepgram/aura-2-en", type: "TTS", usage: "Text to Speech", value: Math.floor(audioTokens * 0.15) },
            { name: "@cf/runwayml/stable-diffusion-v1-5-img2img", type: "Img2Img", usage: "Image Editing", value: Math.floor(audioTokens * 0.05) }
        ];

        // Daily Trend: Fetch Tokens, Requests, Active Users, Active Orgs from AiUsageLog
        const dailyUsage = await AiUsageLog.aggregate([
            { $match: logMatch },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } },
                    totalTokens: { $sum: "$totalTokens" },
                    promptTokens: { $sum: "$promptTokens" },
                    completionTokens: { $sum: "$completionTokens" },
                    requests: { $sum: 1 },
                    uniqueUsers: { $addToSet: "$userId" },
                    uniqueOrgs: { $addToSet: "$organization_id" }
                }
            }
        ]);
        
        const trendMap = {};
        dailyUsage.forEach(d => {
            trendMap[d._id] = {
                totalTokens: d.totalTokens,
                promptTokens: d.promptTokens,
                completionTokens: d.completionTokens,
                requests: d.requests,
                activeUsers: d.uniqueUsers.length,
                activeOrgs: d.uniqueOrgs.length
            };
        });

        // Revenue Trend: Fetch Top-ups per day
        const dailyRevenue = await AiCreditTransaction.aggregate([
            { $match: topupMatch },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } },
                    totalRevenue: { $sum: "$amount_inr" }
                }
            }
        ]);
        
        const revenueMap = {};
        dailyRevenue.forEach(d => {
            revenueMap[d._id] = d.totalRevenue;
        });

        const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
        const usageTrend = Array.from({ length: daysInMonth }, (_, i) => {
            const d = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
            const t = trendMap[d] || {};
            return {
                date: d,
                credits: t.totalTokens || 0,
                promptTokens: t.promptTokens || 0,
                completionTokens: t.completionTokens || 0,
                requests: t.requests || 0,
                activeUsers: t.activeUsers || 0,
                activeOrgs: t.activeOrgs || 0,
                revenue: revenueMap[d] || 0
            };
        });

        // Feature Breakdown
        const featureData = await AiUsageLog.aggregate([
            { $match: logMatch },
            { $group: { _id: "$feature", requests: { $sum: 1 }, tokens: { $sum: "$totalTokens" } } }
        ]);
        const featuresBreakdown = featureData.map(f => ({ name: f._id || "unknown", requests: f.requests, value: f.tokens }));

        // Model Breakdown
        const modelData = await AiUsageLog.aggregate([
            { $match: logMatch },
            { $group: { _id: "$model", requests: { $sum: 1 }, tokens: { $sum: "$totalTokens" } } }
        ]);
        let modelsBreakdown = modelData.map(m => ({ name: m._id || "unknown", requests: m.requests, value: m.tokens }));
        
        if (modelsBreakdown.length === 0) {
            modelsBreakdown = [
                { name: "@cf/deepseek-ai/deepseek-v4-pro-0813", requests: 0, value: 0 },
                { name: "cloudflare-llama-3.2-vision", requests: 0, value: 0 }
            ];
        }

        // Org Breakdown
        const orgData = await AiUsageLog.aggregate([
            { $match: logMatch },
            { $group: { _id: "$organization_id", requests: { $sum: 1 } } },
            { $lookup: { from: "organizations", localField: "_id", foreignField: "_id", as: "org" } },
            { $unwind: { path: "$org", preserveNullAndEmptyArrays: true } },
            { $project: { name: { $ifNull: ["$org.name", "Unknown Org"] }, orgId: "$org._id", logo: "$org.logo", requests: 1, _id: 0 } }
        ]);
        const orgsBreakdown = orgData.map(o => ({ name: o.name, orgId: o.orgId, logo: o.logo, value: o.requests, requests: o.requests }));

        // Status Breakdown
        const statusData = await AiUsageLog.aggregate([
            { $match: logMatch },
            { $group: { _id: "$success", requests: { $sum: 1 } } }
        ]);
        const statusBreakdown = statusData.map(s => ({ name: s._id ? "Success (200)" : "Error (4xx/5xx)", value: s.requests, requests: s.requests }));

        // Role Breakdown
        const roleData = await AiUsageLog.aggregate([
            { $match: logMatch },
            { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
            { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
            { $group: { _id: "$user.role", requests: { $sum: 1 } } }
        ]);
        const rolesBreakdown = roleData.map(r => ({ name: r._id || "unknown", value: r.requests, requests: r.requests }));

        // Users Breakdown
        const userData = await AiUsageLog.aggregate([
            { $match: logMatch },
            { $group: { _id: { userId: "$userId", orgId: "$organization_id" }, requests: { $sum: 1 } } },
            { $lookup: { from: "users", localField: "_id.userId", foreignField: "_id", as: "user" } },
            { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
            { $lookup: { from: "organizations", localField: "_id.orgId", foreignField: "_id", as: "org" } },
            { $unwind: { path: "$org", preserveNullAndEmptyArrays: true } },
            { $project: { name: { $ifNull: ["$user.name", "$user.email"] }, fallbackName: "Unknown User", orgName: { $ifNull: ["$org.name", "Unknown Org"] }, requests: 1, _id: 0 } }
        ]);
        const usersBreakdown = userData.map(u => ({ name: u.name || u.fallbackName, orgName: u.orgName, value: u.requests, requests: u.requests }));

        res.status(200).json({
            success: true,
            data: {
                totalCreditsSpent,
                totalRevenue,
                creditsPurchasedThisMonth,
                totalChats: totalChats,
                usageTrend,
                models: modelsBreakdown, 
                features: featuresBreakdown,
                orgsBreakdown,
                usersBreakdown,

                statusBreakdown,
                rolesBreakdown,
                notes: "Analytics data pulled from AiUsageLog for full granularity."
            }
        });
    } catch (error) {
        console.error("Global AI stats error:", error);
        res.status(500).json({ success: false, error: "Failed to fetch global AI stats" });
    }
};

export const getModelBreakdown = async (req, res) => {
    res.status(200).json({ success: true, data: [] });
};
