import User from "../models/User.js";
import Organization from "../models/Organization.js";

/**
 * Service to handle mathematical logic and database interactions 
 * for AI tokens/credits across the platform.
 * 
 * NOTE: 1 Credit = 1 Token exactly.
 * Conversion: ₹100 = 500,000 Credits
 */

import GlobalAiConfig from "../models/GlobalAiConfig.js";

const DEFAULT_CREDITS_PER_INR = 3000;
const DEFAULT_IMAGE_GENERATION_COST = 5000;

export const calculateCreditsFromAmount = async (amountInr) => {
    let multiplier;
    try {
        const config = await GlobalAiConfig.findOne({ key: "singleton" }).lean();
        if (config && config.credits_per_inr !== undefined && config.credits_per_inr !== null) {
            multiplier = config.credits_per_inr;
        } else {
            throw new Error("CRITICAL: Global AI Pricing is not configured. Fallback pricing is forbidden.");
        }
    } catch (err) {
        console.error("Error fetching credits_per_inr:", err);
        throw err;
    }
    return Math.floor(amountInr * multiplier);
};

export const hasEnoughTokens = async (userId, orgId, requiredTokens = 1) => {
    // 1. Check if user is blocked
    const user = await User.findById(userId).select('ai_tokens');
    if (!user || user.ai_tokens?.is_ai_blocked) {
        return { allowed: false, reason: "User AI access is blocked." };
    }

    // 2. Check free weekly limit FIRST (Always use free before touching paid/promo)
    // If free limit resets, this will naturally be > 0 and will be used again!
    const usedThisWeek = user.ai_tokens?.used_this_week || 0;
    const weeklyLimit = user.ai_tokens?.free_weekly_limit || 0;
    if (usedThisWeek + requiredTokens <= weeklyLimit) {
        return { allowed: true, source: "weekly_free" };
    }

    /*
    // --- SHARED ORG POOL (STEP 2) - COMMENTED OUT FOR NOW ---
    // Only applies to org_admin users. Consumed AFTER free, BEFORE paid/granted.
    if (orgId) {
        let org = await Organization.findById(orgId).select('ai_config status');
        if (org && org.status === "active" && !org.ai_config?.is_ai_blocked) {
            const orgUsed = org.ai_config?.pro_used_this_period || 0;
            const orgLimit = org.ai_config?.pro_pool_limit || 0;
            if (orgUsed + requiredTokens <= orgLimit) {
                return { allowed: true, source: "org_pool" };
            }
        }
    }
    */

    // 3. FIFO LOGIC: Determine which came FIRST between Top-Up (Paid) and Granted (Promotion)
    const promoBalance = user.ai_tokens?.promotion_credits_balance || 0;
    const paidBalance = user.ai_tokens?.ai_credits_balance || 0;
    
    const promoStart = user.ai_tokens?.promotion_credits_start_date ? new Date(user.ai_tokens.promotion_credits_start_date).getTime() : Infinity;
    const paidStart = user.ai_tokens?.ai_credits_start_date ? new Date(user.ai_tokens.ai_credits_start_date).getTime() : Infinity;

    // Whichever was purchased/granted FIRST gets used FIRST (FIFO)
    if (promoBalance >= requiredTokens && paidBalance >= requiredTokens) {
        if (promoStart <= paidStart) {
            return { allowed: true, source: "promotion" };
        } else {
            return { allowed: true, source: "personal" };
        }
    } else if (promoBalance >= requiredTokens) {
        return { allowed: true, source: "promotion" };
    } else if (paidBalance >= requiredTokens) {
        return { allowed: true, source: "personal" };
    }

    return { allowed: false, reason: "Insufficient tokens." };
};

export const deductTokens = async (userId, orgId, tokenAmount, source) => {
    try {
        if (source === "personal") {
            const updatedUser = await User.findByIdAndUpdate(userId, {
                $inc: {
                    "ai_tokens.ai_credits_balance": -tokenAmount,
                    "ai_tokens.total_ai_tokens_used": tokenAmount
                }
            }, { new: true });
            return { success: true, remaining: updatedUser.ai_tokens.ai_credits_balance, type: "personal" };
        } else if (source === "promotion") {
            const updatedUser = await User.findByIdAndUpdate(userId, {
                $inc: {
                    "ai_tokens.promotion_credits_balance": -tokenAmount,
                    "ai_tokens.total_ai_tokens_used": tokenAmount
                }
            }, { new: true });
            return { success: true, remaining: updatedUser.ai_tokens.promotion_credits_balance, type: "promotion" };
        } else if (source === "weekly_free") {
            const updatedUser = await User.findByIdAndUpdate(userId, {
                $inc: {
                    "ai_tokens.used_this_week": tokenAmount,
                    "ai_tokens.total_ai_tokens_used": tokenAmount
                }
            }, { new: true });
            return { success: true, remaining: updatedUser.ai_tokens.free_weekly_limit - updatedUser.ai_tokens.used_this_week, type: "free" };
        } 
        /*
        // --- SHARED ORG POOL IS COMMENTED OUT ---
        else if (source === "org_pool") {
            const updatedOrg = await Organization.findByIdAndUpdate(orgId, {
                $inc: {
                    "ai_config.pro_used_this_period": tokenAmount,
                    "ai_config.total_ai_tokens_used": tokenAmount
                }
            }, { new: true });
            await User.findByIdAndUpdate(userId, {
                $inc: { "ai_tokens.total_ai_tokens_used": tokenAmount }
            });
            return { success: true, remaining: updatedOrg.ai_config.pro_pool_limit - updatedOrg.ai_config.pro_used_this_period, type: "pro" };
        }
        */
        return { success: false, remaining: 0, type: "unknown" };
    } catch (error) {
        console.error("Error deducting tokens:", error);
        return { success: false, remaining: 0, type: "unknown" };
    }
};

export const addCredits = async (userId, amountToAdd) => {
    try {
        const user = await User.findByIdAndUpdate(userId, {
            $inc: { "ai_tokens.ai_credits_balance": amountToAdd }
        }, { new: true });
        return user;
    } catch (error) {
        console.error("Error adding credits:", error);
        return null;
    }
};

export const getImageGenerationCost = async () => {
    try {
        const config = await GlobalAiConfig.findOne({ key: "singleton" }).lean();
        if (config && config.image_generation_token_cost !== undefined && config.image_generation_token_cost !== null) {
            return config.image_generation_token_cost;
        }
    } catch (err) {
        console.error("Error fetching image_generation_token_cost:", err);
    }
    return DEFAULT_IMAGE_GENERATION_COST;
};
