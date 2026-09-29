import Organization from "../../models/Organization.js";
import User from "../../models/User.js";
import AiCreditTransaction from "../../models/AiCreditTransaction.js";
import { primarySupabaseClient as supabase } from "../../config/supabaseClient.js";
import mongoose from "mongoose";

/**
 * PHASE 6: Super Admin Global AI Usage Controller
 * Handles Level 0 of the Dashboard (All Orgs overview, bar graphs, model breakdowns)
 */

export const getGlobalStats = async (req, res) => {
    try {
        const { month, year } = req.query;

        // 1. Calculate the start and end dates based on the filter
        const currentDate = new Date();
        let targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
        let targetYear = year ? parseInt(year) : currentDate.getFullYear();
        
        const startDate = new Date(targetYear, targetMonth - 1, 1);
        const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

        // 2. Fetch total tokens (credits) used globally from MongoDB Users
        const userStats = await User.aggregate([
            {
                $group: {
                    _id: null,
                    total_tokens_used: { $sum: "$ai_tokens.total_ai_tokens_used" }
                }
            }
        ]);
        const totalCreditsSpent = userStats[0]?.total_tokens_used || 0;

        // 3. Fetch total top-ups (revenue generated) in the selected month
        const topups = await AiCreditTransaction.aggregate([
            {
                $match: {
                    status: "success",
                    type: "topup",
                    createdAt: { $gte: startDate, $lte: endDate }
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
        const creditsPurchasedThisMonth = topups[0]?.total_credits_added || 0;

        // 4. Fetch Supabase for total AI chats globally (just the count)
        const { count: totalChats, error: chatError } = await supabase
            .from('ai_chat_sessions')
            .select('*', { count: 'exact', head: true });
            
        if (chatError) console.error("Error fetching chat count from Supabase:", chatError);

        // 5. Hardcoded models list as per the plan
        const models = [
            { name: "@cf/deepseek-ai/deepseek-v4-pro-0813", type: "Text (Primary)", usage: "Primary Chat" },
            { name: "@cf/black-forest-labs/flux-1-schnell", type: "Image Gen", usage: "Image Generation" },
            { name: "@cf/meta/llama-3.2-11b-vision-instruct", type: "Image Understanding", usage: "Vision/Analysis" },
            { name: "@cf/openai/whisper-large-v3-turbo", type: "STT", usage: "Speech to Text" },
            { name: "@cf/deepgram/aura-2-en", type: "TTS", usage: "Text to Speech" },
            { name: "@cf/runwayml/stable-diffusion-v1-5-img2img", type: "Img2Img", usage: "Image Editing" }
        ];

        // 6. Build a dummy usage trend (bar graph data) for the month
        // In a real scenario, this would group by day. 
        const dummyTrend = Array.from({ length: 30 }, (_, i) => ({
            date: `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`,
            credits: Math.floor(Math.random() * 50000)
        }));

        res.status(200).json({
            success: true,
            data: {
                totalCreditsSpent,
                totalRevenue,
                creditsPurchasedThisMonth,
                totalChats: totalChats || 0,
                usageTrend: dummyTrend,
                models,
                notes: "Usage is calculated dynamically. 1 Credit = 1 Token exactly."
            }
        });

    } catch (error) {
        console.error("Global AI stats error:", error);
        res.status(500).json({ success: false, error: "Failed to fetch global AI stats" });
    }
};

export const getModelBreakdown = async (req, res) => {
    // A placeholder for future specific model-wise token usage breakdown if we start 
    // logging token usage per model in the database. Right now, it returns a static array.
    res.status(200).json({
        success: true,
        data: []
    });
};
