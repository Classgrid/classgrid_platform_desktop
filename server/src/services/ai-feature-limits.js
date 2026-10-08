// CLASSGRID USES CLOUDFLARE USAGE TO CALCULATE TOKENS, NOT GPT-TOKENIZER (WHICH IS ONLY A FALLBACK)
// Weekly limits for the AI's extra features (WhatsApp messages, image generations), resolved the same way
// as the free token limit (resolveWeeklyLimit): global limit -> the org's own limit when the org has custom
// limits on, or the Classgrid limit for users without an org. The super admin dashboard shows this same
// value, so what the dashboard says is what the chat enforces.
import redis from "../config/redis.js";

const FIELDS = {
    whatsapp: { global: "global_whatsapp_scheduling_limit", org: "whatsapp_scheduling_limit", classgrid: "classgrid_whatsapp_scheduling_limit", fallback: 10 },
    image: { global: "global_image_weekly_limit", org: "image_generation_limit", classgrid: "classgrid_image_weekly_limit", fallback: 20 },
};

const isSet = (v) => v !== undefined && v !== null;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function resolveFeatureLimit(feature, org, globalConfig, orgId = org?._id) {
    const f = FIELDS[feature];
    let limit = isSet(globalConfig?.[f.global]) ? globalConfig[f.global] : f.fallback;
    if (org) {
        if (org.ai_config?.custom_limits_enabled && isSet(org.ai_config[f.org])) limit = org.ai_config[f.org];
    } else if (!orgId && globalConfig?.classgrid_custom_limits_enabled && isSet(globalConfig[f.classgrid])) {
        limit = globalConfig[f.classgrid];
    }
    return limit;
}

const directSendKey = (userId) => `ai:wa-direct:${userId}`;

/**
 * WhatsApp messages a user has used in the last 7 days: scheduled ones (not cancelled) + ones sent right away.
 * Returns { allowed, limit, used }.
 */
export async function checkWhatsappLimit(user) {
    const [{ default: GlobalAiConfig }, { default: Organization }, { default: AiSchedule }] = await Promise.all([
        import("../models/GlobalAiConfig.js"),
        import("../models/Organization.js"),
        import("../models/AiSchedule.js"),
    ]);
    const globalConfig = await GlobalAiConfig.findOne({ key: "singleton" }).lean();
    const orgId = user.organization_id || null;
    const org = orgId ? await Organization.findById(orgId).select("ai_config").lean() : null;
    const limit = resolveFeatureLimit("whatsapp", org, globalConfig, orgId);

    const since = new Date(Date.now() - WEEK_MS);
    const scheduled = await AiSchedule.countDocuments({
        user_id: user._id,
        createdAt: { $gte: since },
        status: { $ne: "cancelled" },
        $or: [
            { whatsapp_phone_number: { $exists: true, $ne: "" } },
            { whatsapp_message: { $exists: true, $ne: "" } },
        ],
    });

    let direct = 0;
    try {
        const key = directSendKey(user._id);
        await redis.zremrangebyscore(key, 0, Date.now() - WEEK_MS);
        direct = await redis.zcard(key);
    } catch (e) { /* Redis down: count only the scheduled ones */ }

    const used = scheduled + direct;
    return { allowed: used < limit, limit, used };
}

/** Counts one WhatsApp message sent right away (not scheduled) toward the user's weekly limit. */
export async function recordDirectWhatsappSend(userId) {
    try {
        const key = directSendKey(userId);
        const now = Date.now();
        await redis.zadd(key, now, `${now}-${Math.random().toString(36).slice(2, 8)}`);
        await redis.expire(key, 8 * 24 * 60 * 60);
    } catch (e) { /* Redis down: the send is not counted */ }
}
