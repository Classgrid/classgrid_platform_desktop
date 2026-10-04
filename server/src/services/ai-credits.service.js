// CLASSGRID USES CLOUDFLARE USAGE TO CALCULATE TOKENS, NOT GPT-TOKENIZER (WHICH IS ONLY A FALLBACK)
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


export const calculateCreditsFromAmount = async (amountInr) => {
    let multiplier = 0;
    try {
        const config = await GlobalAiConfig.findOne({ key: "singleton" }).lean();
        if (config && config.credits_per_inr !== undefined && config.credits_per_inr !== null) {
            multiplier = config.credits_per_inr;
        }
    } catch (err) {
        console.error("Error fetching credits_per_inr:", err);
    }
    return Math.floor(amountInr * multiplier);
};

export const hasEnoughTokens = async (userId, orgId, requiredTokens = 1) => {
    // 1. Check if user is blocked or suspended
    const user = await User.findById(userId).select('ai_tokens role status');
    if (!user) {
        return { allowed: false, reason: "User not found." };
    }
    if (user.ai_tokens?.is_ai_blocked) {
        return { allowed: false, reason: "User AI access is explicitly blocked." };
    }
    if (user.status && user.status !== "active" && user.status !== "pending") {
        return { allowed: false, reason: `User account is ${user.status}.` };
    }

    // FETCH GLOBAL CONFIG
    const globalConfig = await GlobalAiConfig.findOne({ key: "singleton" }).select("global_user_weekly_limit global_ai_blocked classgrid_custom_limits_enabled classgrid_user_weekly_limit").lean() || {};
    if (globalConfig.global_ai_blocked) {
        return { allowed: false, reason: "AI access is globally blocked by administrators." };
    }

    let weeklyLimit = globalConfig.global_user_weekly_limit || 0;
    
    // --- SHARED ORG POOL & ORG CUSTOM LIMITS (STEP 2) ---
    let org = null;
    if (orgId) {
        org = await Organization.findById(orgId).select('ai_config status').lean();
        if (org) {
            if (org.status && org.status !== "active") {
                 return { allowed: false, reason: `Organization account is ${org.status}.` };
            }
            if (org.ai_config?.is_ai_blocked) {
                 return { allowed: false, reason: "Organization AI access is explicitly blocked." };
            }

            // Apply Org Custom Limit for individual
            if (org.ai_config?.custom_limits_enabled) {
                if (org.ai_config.free_weekly_limit_per_user !== undefined && org.ai_config.free_weekly_limit_per_user !== null) {
                    weeklyLimit = org.ai_config.free_weekly_limit_per_user;
                }
            }

            // Check Org Pool (if org_admin)
            if (user.role === 'org_admin') {
                const orgUsed = org.ai_config?.pro_used_this_period || 0;
                const orgLimit = org.ai_config?.pro_pool_limit || 0;
                if (orgUsed + requiredTokens <= orgLimit) {
                    return { allowed: true, source: "org_pool", remaining: orgLimit - orgUsed };
                }
            }
        }
    } else {
        // Virtual Classgrid Organization for platform team/super admins
        if (globalConfig.classgrid_custom_limits_enabled) {
            if (globalConfig.classgrid_user_weekly_limit !== undefined && globalConfig.classgrid_user_weekly_limit !== null) {
                weeklyLimit = globalConfig.classgrid_user_weekly_limit;
            }
        }
    }

    // Apply User Custom Limit (Overrides Org and Global)
    if (user.ai_tokens?.custom_limits_enabled) {
        if (user.ai_tokens.free_weekly_limit !== undefined && user.ai_tokens.free_weekly_limit !== null) {
            weeklyLimit = user.ai_tokens.free_weekly_limit;
        }
    }

    // 2. Check free weekly limit FIRST (Always use free before touching paid/promo)
    let usedThisWeek = user.ai_tokens?.used_this_week || 0;
    let weekResetDate = user.ai_tokens?.week_reset_date ? new Date(user.ai_tokens.week_reset_date).getTime() : 0;
    
    // Auto-Reset logic if 7 days have passed
    if (Date.now() >= weekResetDate) {
        usedThisWeek = 0;
        const newResetDate = new Date();
        newResetDate.setDate(newResetDate.getDate() + 7);
        // Async update DB but don't block the chat flow
        User.findByIdAndUpdate(userId, { 
            $set: { 
                "ai_tokens.used_this_week": 0,
                "ai_tokens.week_reset_date": newResetDate,
                "ai_image_free_weekly_used": 0
            }
        }).catch(e => console.error("Auto-reset error:", e));
    }

    if (usedThisWeek + requiredTokens <= weeklyLimit) {
        return { allowed: true, source: "weekly_free", remaining: weeklyLimit - usedThisWeek };
    }

    // 3. FIFO LOGIC: Determine which came FIRST between Top-Up (Paid) and Granted (Promotion)
    const now = new Date().getTime();
    
    // Check if Promotion credits are expired
    // Note: paused/revoked credits are already subtracted from balance by the per-transaction controllers
    let promoBalance = user.ai_tokens?.promotion_credits_balance || 0;
    if (user.ai_tokens?.promotion_credits_end_date && new Date(user.ai_tokens.promotion_credits_end_date).getTime() < now) {
        promoBalance = 0; // Expired
    }
    
    // Check if Paid credits are expired
    let paidBalance = user.ai_tokens?.ai_credits_balance || 0;
    if (user.ai_tokens?.ai_credits_end_date && new Date(user.ai_tokens.ai_credits_end_date).getTime() < now) {
        paidBalance = 0; // Expired
    }
    
    const promoStart = user.ai_tokens?.promotion_credits_start_date ? new Date(user.ai_tokens.promotion_credits_start_date).getTime() : Infinity;
    const paidStart = user.ai_tokens?.ai_credits_start_date ? new Date(user.ai_tokens.ai_credits_start_date).getTime() : Infinity;

    // Whichever was purchased/granted FIRST gets used FIRST (FIFO)
    if (promoBalance >= requiredTokens && paidBalance >= requiredTokens) {
        if (promoStart <= paidStart) {
            return { allowed: true, source: "promotion", remaining: promoBalance };
        } else {
            return { allowed: true, source: "personal", remaining: paidBalance };
        }
    } else if (promoBalance >= requiredTokens) {
        return { allowed: true, source: "promotion", remaining: promoBalance };
    } else if (paidBalance >= requiredTokens) {
        return { allowed: true, source: "personal", remaining: paidBalance };
    }

    return { allowed: false, reason: "Insufficient tokens." };
};

export const deductTokens = async (userId, orgId, tokenAmount, source) => {
    try {
        let result = { success: false, remaining: 0, type: "unknown" };

        if (source === "personal") {
            // Read current balance FIRST, then cap the deduction
            const user = await User.findById(userId).select("ai_tokens.ai_credits_balance");
            const currentBalance = Math.max(0, user?.ai_tokens?.ai_credits_balance || 0);
            const actualDeduction = Math.min(tokenAmount, currentBalance);
            if (actualDeduction <= 0) {
                return { success: true, remaining: 0, limit: 0, type: "personal" };
            }
            const updatedUser = await User.findByIdAndUpdate(userId, {
                $inc: {
                    "ai_tokens.ai_credits_balance": -actualDeduction,
                    "ai_tokens.total_ai_tokens_used": actualDeduction
                }
            }, { new: true });
            result = { success: true, remaining: Math.max(0, updatedUser.ai_tokens.ai_credits_balance), limit: updatedUser.ai_tokens.ai_credits_balance + actualDeduction, type: "personal" };

        } else if (source === "promotion") {
            // Read current balance FIRST, then cap the deduction
            const user = await User.findById(userId).select("ai_tokens.promotion_credits_balance");
            const currentBalance = Math.max(0, user?.ai_tokens?.promotion_credits_balance || 0);
            const actualDeduction = Math.min(tokenAmount, currentBalance);
            if (actualDeduction <= 0) {
                return { success: true, remaining: 0, limit: 0, type: "promotion" };
            }
            const updatedUser = await User.findByIdAndUpdate(userId, {
                $inc: {
                    "ai_tokens.promotion_credits_balance": -actualDeduction,
                    "ai_tokens.total_ai_tokens_used": actualDeduction
                }
            }, { new: true });
            result = { success: true, remaining: Math.max(0, updatedUser.ai_tokens.promotion_credits_balance), limit: updatedUser.ai_tokens.promotion_credits_balance + actualDeduction, type: "promotion" };

        } else if (source === "weekly_free") {
            // For free tier: cap so used_this_week never exceeds the weekly limit
            const user = await User.findById(userId).select("ai_tokens.used_this_week ai_tokens.free_weekly_limit");
            const weeklyLimit = user?.ai_tokens?.free_weekly_limit || 100000;
            const currentUsed = user?.ai_tokens?.used_this_week || 0;
            const headroom = Math.max(0, weeklyLimit - currentUsed);
            const actualDeduction = Math.min(tokenAmount, headroom);
            if (actualDeduction <= 0) {
                return { success: true, remaining: 0, limit: weeklyLimit, type: "free" };
            }
            const updatedUser = await User.findByIdAndUpdate(userId, {
                $inc: {
                    "ai_tokens.used_this_week": actualDeduction,
                    "ai_tokens.total_ai_tokens_used": actualDeduction
                }
            }, { new: true });
            result = { success: true, remaining: Math.max(0, updatedUser.ai_tokens.free_weekly_limit - updatedUser.ai_tokens.used_this_week), limit: updatedUser.ai_tokens.free_weekly_limit, type: "free" };

        } else if (source === "org_pool") {
            // For org pool: cap so pro_used_this_period never exceeds pro_pool_limit
            const Organization = (await import("../models/Organization.js")).default;
            const org = await Organization.findById(orgId).select("ai_config.pro_used_this_period ai_config.pro_pool_limit");
            const orgLimit = org?.ai_config?.pro_pool_limit || 0;
            const orgUsed = org?.ai_config?.pro_used_this_period || 0;
            const headroom = Math.max(0, orgLimit - orgUsed);
            const actualDeduction = Math.min(tokenAmount, headroom);
            if (actualDeduction <= 0) {
                return { success: true, remaining: 0, limit: orgLimit, type: "pro" };
            }
            const updatedOrg = await Organization.findByIdAndUpdate(orgId, {
                $inc: {
                    "ai_config.pro_used_this_period": actualDeduction,
                    "ai_config.total_ai_tokens_used": actualDeduction
                }
            }, { new: true });
            await User.findByIdAndUpdate(userId, {
                $inc: { "ai_tokens.total_ai_tokens_used": actualDeduction }
            });
            result = { success: true, remaining: Math.max(0, updatedOrg.ai_config.pro_pool_limit - updatedOrg.ai_config.pro_used_this_period), limit: updatedOrg.ai_config.pro_pool_limit, type: "pro" };
        }

        if (result.success) {
            import("../services/socket.service.js").then(({ getIO }) => {
                const io = getIO();
                if (io) {
                    io.to(userId.toString()).emit("ai_token_update");
                    io.to("superadmin:ai_usage").emit("ai_usage_updated");
                }
            }).catch(err => console.error("Socket error in deductTokens:", err));
        }

        return result;
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
        
        import("../services/socket.service.js").then(({ getIO }) => {
            const io = getIO();
            if (io) {
                io.to(userId.toString()).emit("ai_token_update");
                io.to("superadmin:ai_usage").emit("ai_usage_updated");
            }
        }).catch(err => console.error("Socket error in addCredits:", err));
        
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
    return 0;
};

