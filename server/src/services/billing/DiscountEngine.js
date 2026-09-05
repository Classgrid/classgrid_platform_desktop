/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 CRITICAL AI AND SYSTEM RULES 🚨
 * 1. NEVER DELETE ANY ENVIRONMENT VARIABLES.
 * 2. LOCALHOST TESTING IS STRICTLY BANNED. NO AI WILL EVER TRY TO WORK LOCALLY.
 * 3. THIS REPO IS PRODUCTION-FIRST. DO NOT TOUCH OR REMOVE KEYS.
 * ─────────────────────────────────────────────────────────
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 NAMING CONVENTION RULE 🚨
 * 1. "CLASSGRID PLATFORM" is strictly the REPO NAME.
 * 2. "CLASSGRID ERP" is the actual PRODUCT NAME.
 * 3. NEVER use "Classgrid Platform" anywhere in the frontend UI or user-facing text.
 * ─────────────────────────────────────────────────────────
 */

import Discount from "../../models/Discount.js";
import DiscountRedemption from "../../models/DiscountRedemption.js";

/**
 * DiscountEngine
 * Calculates discount amounts for line-level and invoice-level.
 */
class DiscountEngine {
    static async calculateDiscount(discountId, organizationId, subtotalPaise) {
        if (!discountId) return 0;

        const discount = await Discount.findById(discountId).lean();
        if (!discount || discount.status !== "ACTIVE") return 0;

        // Check if expired
        if (discount.validUntil && new Date() > discount.validUntil) return 0;

        // Check limits
        if (discount.maxRedemptionsPerOrganization) {
            const usageCount = await DiscountRedemption.countDocuments({
                discountId,
                organizationId,
                status: "REDEEMED"
            });
            if (usageCount >= discount.maxRedemptionsPerOrganization) return 0;
        }

        if (subtotalPaise < discount.minimumInvoiceAmountPaise) return 0;

        if (discount.discountType === "FIXED_AMOUNT") {
            return Math.min(discount.amountPaise, subtotalPaise); // Can't discount more than subtotal
        } else if (discount.discountType === "PERCENTAGE") {
            return Math.floor(subtotalPaise * (discount.percentage / 100));
        }

        return 0;
    }
}

export default DiscountEngine;
