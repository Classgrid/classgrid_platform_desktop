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

import TaxRuleVersion from "../../models/TaxRuleVersion.js";

/**
 * TaxEngine
 * Calculates CGST, SGST, IGST based on the tax rule version and place of supply.
 */
class TaxEngine {
    static async calculateTax(taxRuleId, taxableAmountPaise, isInterState = false) {
        if (!taxRuleId || taxableAmountPaise <= 0) return { taxTotalPaise: 0 };

        const taxRuleVersion = await TaxRuleVersion.findOne({
            taxRuleId,
            effectiveFrom: { $lte: new Date() },
            $or: [{ effectiveUntil: null }, { effectiveUntil: { $gt: new Date() } }]
        }).sort({ versionNumber: -1 }).lean();

        if (!taxRuleVersion) return { taxTotalPaise: 0 };

        // We use percentages * 100 for basis points in the model, but here assuming standard percentage for simplicity
        const igst = isInterState ? Math.floor(taxableAmountPaise * (taxRuleVersion.igstPercentage / 100)) : 0;
        const cgst = !isInterState ? Math.floor(taxableAmountPaise * (taxRuleVersion.cgstPercentage / 100)) : 0;
        const sgst = !isInterState ? Math.floor(taxableAmountPaise * (taxRuleVersion.sgstPercentage / 100)) : 0;

        const taxTotalPaise = igst + cgst + sgst;

        return {
            taxTotalPaise,
            igstPaise: igst,
            cgstPaise: cgst,
            sgstPaise: sgst,
            taxRuleVersionId: taxRuleVersion._id
        };
    }
}

export default TaxEngine;
