// Premium model access: Claude Fable 5.1 (the most expensive model) unlocks once a person's successful
// top-ups add up to at least ₹100, and then stays unlocked. Super admins and Classgrid team accounts
// (@classgrid.in) can always use it.
import mongoose from "mongoose";
import AiCreditTransaction from "../models/AiCreditTransaction.js";

export const FABLE_MODEL = "claude-fable-5-1";
export const FABLE_UNLOCK_INR = 100;

// userId -> { unlocked, toppedUpInr, at }. Unlocked is permanent, so it's cached long; locked is re-checked
// after a minute so a fresh top-up unlocks quickly.
const cache = new Map();
const LOCKED_TTL_MS = 60 * 1000;

function isExempt(user) {
    return user?.role === "super_admin" || String(user?.email || "").toLowerCase().endsWith("@classgrid.in");
}

/** @returns {Promise<{ unlocked: boolean, exempt: boolean, toppedUpInr: number, requiredInr: number }>} */
export async function fableAccess(user) {
    if (isExempt(user)) return { unlocked: true, exempt: true, toppedUpInr: 0, requiredInr: FABLE_UNLOCK_INR };
    const id = String(user?._id || "");
    if (!id) return { unlocked: false, exempt: false, toppedUpInr: 0, requiredInr: FABLE_UNLOCK_INR };

    const hit = cache.get(id);
    if (hit && (hit.unlocked || Date.now() - hit.at < LOCKED_TTL_MS)) {
        return { unlocked: hit.unlocked, exempt: false, toppedUpInr: hit.toppedUpInr, requiredInr: FABLE_UNLOCK_INR };
    }
    const [row] = await AiCreditTransaction.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(id), type: "topup", status: "success" } },
        { $group: { _id: null, total: { $sum: { $ifNull: ["$amount_inr", 0] } } } },
    ]);
    const toppedUpInr = Number(row?.total || 0);
    const unlocked = toppedUpInr >= FABLE_UNLOCK_INR;
    if (cache.size > 5000) cache.delete(cache.keys().next().value);
    cache.set(id, { unlocked, toppedUpInr, at: Date.now() });
    return { unlocked, exempt: false, toppedUpInr, requiredInr: FABLE_UNLOCK_INR };
}
