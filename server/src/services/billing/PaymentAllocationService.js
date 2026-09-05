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

import Invoice from "../../models/Invoice.js";
import PaymentOrder from "../../models/PaymentOrder.js";
import PaymentTransaction from "../../models/PaymentTransaction.js";

/**
 * PaymentAllocationService
 * Maps a successful transaction to the respective invoice and updates balances.
 */
class PaymentAllocationService {
    static async allocatePayment(transactionId) {
        const transaction = await PaymentTransaction.findById(transactionId).populate("paymentOrderId").lean();
        if (!transaction || transaction.status !== "CAPTURED") return;

        const order = transaction.paymentOrderId;
        if (!order || order.paymentFlow !== "CLASSGRID_SUBSCRIPTION" || !order.invoiceId) return;

        const invoice = await Invoice.findById(order.invoiceId);
        if (!invoice || invoice.amountDuePaise <= 0) return;

        // Apply captured amount
        const appliedAmount = Math.min(transaction.amountCapturedPaise, invoice.amountDuePaise);
        
        invoice.amountPaidPaise += appliedAmount;
        invoice.amountDuePaise -= appliedAmount;

        if (invoice.amountDuePaise === 0) {
            invoice.status = "PAID";
        } else {
            invoice.status = "PARTIALLY_PAID";
        }

        await invoice.save();

        return invoice;
    }
}

export default PaymentAllocationService;
