import User from "../models/User.js";
import Organization from "../models/Organization.js";

/**
 * Service to handle mathematical logic and database interactions 
 * for AI tokens/credits across the platform.
 * 
 * NOTE: 1 Credit = 1 Token exactly.
 * Conversion: ₹100 = 500,000 Credits
 */

const CREDITS_PER_INR = 5000;
const IMAGE_GENERATION_COST = 20000;

export const calculateCreditsFromAmount = (amountInr) => {
    return Math.floor(amountInr * CREDITS_PER_INR);
};

export const hasEnoughTokens = async (userId, orgId, requiredTokens = 1) => {
    // 1. Check if user is blocked
    const user = await User.findById(userId).select('ai_tokens');
    if (!user || user.ai_tokens?.is_ai_blocked) {
        return { allowed: false, reason: "User AI access is blocked." };
    }

    // 2. Check if org is blocked
    let org = null;
    if (orgId) {
        org = await Organization.findById(orgId).select('ai_config status');
        if (org && (org.status !== "active" || org.ai_config?.is_ai_blocked)) {
            return { allowed: false, reason: "Organization AI access is blocked or inactive." };
        }
    }

    // 3. Check free weekly limit FIRST (So users don't waste paid credits if they have free ones)
    const usedThisWeek = user.ai_tokens?.used_this_week || 0;
    const weeklyLimit = user.ai_tokens?.free_weekly_limit || 0;
    if (usedThisWeek + requiredTokens <= weeklyLimit) {
        return { allowed: true, source: "weekly_free" };
    }

    // 4. Check personal balance NEXT (Paid credits)
    if (user.ai_tokens?.ai_credits_balance >= requiredTokens) {
        return { allowed: true, source: "personal" };
    }

    // 5. Check Org pro pool limit (if enabled for user's role/id)
    if (org) {
        const orgUsed = org.ai_config?.pro_used_this_period || 0;
        const orgLimit = org.ai_config?.pro_pool_limit || 0;
        
        if (orgUsed + requiredTokens <= orgLimit) {
            return { allowed: true, source: "org_pool" };
        }
    }

    return { allowed: false, reason: "Insufficient tokens." };
};

export const deductTokens = async (userId, orgId, tokenAmount, source) => {
    try {
        if (source === "personal") {
            await User.findByIdAndUpdate(userId, {
                $inc: {
                    "ai_tokens.ai_credits_balance": -tokenAmount,
                    "ai_tokens.total_ai_tokens_used": tokenAmount
                }
            });
        } else if (source === "weekly_free") {
            await User.findByIdAndUpdate(userId, {
                $inc: {
                    "ai_tokens.used_this_week": tokenAmount,
                    "ai_tokens.total_ai_tokens_used": tokenAmount
                }
            });
        } else if (source === "org_pool") {
            await Organization.findByIdAndUpdate(orgId, {
                $inc: {
                    "ai_config.pro_used_this_period": tokenAmount,
                    "ai_config.total_ai_tokens_used": tokenAmount
                }
            });
            // Still track global usage for the user
            await User.findByIdAndUpdate(userId, {
                $inc: {
                    "ai_tokens.total_ai_tokens_used": tokenAmount
                }
            });
        }
        return true;
    } catch (error) {
        console.error("Error deducting tokens:", error);
        return false;
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

export const getImageGenerationCost = () => {
    return IMAGE_GENERATION_COST;
};
