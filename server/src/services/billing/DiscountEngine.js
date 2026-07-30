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
