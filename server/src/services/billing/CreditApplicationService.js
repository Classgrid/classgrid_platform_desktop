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

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 HOSTING & ARCHITECTURE RULE 🚨
 * 1. BACKEND IS HOSTED ON AWS EC2 AT API.CLASSGRID.IN
 * 2. FRONTEND IS HOSTED ON VERCEL
 * ─────────────────────────────────────────────────────────
 */

import OrganizationCreditAccount from "../../models/OrganizationCreditAccount.js";
import OrganizationCreditEntry from "../../models/OrganizationCreditEntry.js";

/**
 * CreditApplicationService
 * Handles the immutable ledger for deducting credits to apply to an invoice.
 */
class CreditApplicationService {
    static async applyCreditToInvoice(organizationId, invoiceId, amountToCoverPaise, session = null) {
        if (amountToCoverPaise <= 0) return 0;

        const account = await OrganizationCreditAccount.findOne({ organizationId }).session(session);
        if (!account || account.status !== "ACTIVE" || account.currentBalancePaise <= 0) return 0;

        const amountToApply = Math.min(account.currentBalancePaise, amountToCoverPaise);
        const balanceAfterPaise = account.currentBalancePaise - amountToApply;

        account.currentBalancePaise = balanceAfterPaise;
        await account.save({ session });

        await OrganizationCreditEntry.create([{
            organizationCreditAccountId: account._id,
            entryType: "CREDIT_APPLIED",
            amountPaise: -amountToApply,
            balanceAfterPaise,
            referenceType: "Invoice",
            referenceId: invoiceId,
            reason: `Applied to invoice ${invoiceId}`
        }], { session });

        return amountToApply;
    }
}

export default CreditApplicationService;
