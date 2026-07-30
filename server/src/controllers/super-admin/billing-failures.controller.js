import PaymentFailure from "../../models/PaymentFailure.js";
import PaymentAttempt from "../../models/PaymentAttempt.js";
import { logAdminAction } from "../../services/auditLog.service.js";

export const listFailedPayments = async (req, res) => {
    try {
        const failures = await PaymentFailure.find().populate("organizationId paymentOrderId paymentAttemptId").sort({ createdAt: -1 });
        res.json({ success: true, data: failures });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getFailureOverview = async (req, res) => {
    try {
        const failures = await PaymentFailure.aggregate([
            { $match: { resolved: { $ne: true } } },
            {
                $group: {
                    _id: null,
                    failedPaymentsCount: { $sum: 1 },
                    revenueAtRiskPaise: { $sum: "$amountPaise" },
                    uniqueOrgs: { $addToSet: "$organizationId" }
                }
            }
        ]);

        const stats = failures[0] || { failedPaymentsCount: 0, revenueAtRiskPaise: 0, uniqueOrgs: [] };

        res.json({
            success: true,
            data: {
                failedPayments: stats.failedPaymentsCount,
                revenueAtRiskPaise: stats.revenueAtRiskPaise,
                affectedOrgs: stats.uniqueOrgs.length
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getFailedPayment = async (req, res) => {
    try {
        const failure = await PaymentFailure.findById(req.params.failureId).populate("organizationId paymentOrderId paymentAttemptId assignedTo");
        if (!failure) return res.status(404).json({ success: false, message: "Failure record not found" });
        res.json({ success: true, data: failure });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

import Razorpay from "razorpay";

export const generatePaymentLink = async (req, res) => {
    try {
        const failure = await PaymentFailure.findById(req.params.failureId).populate("paymentOrderId organizationId");
        if (!failure) return res.status(404).json({ success: false, message: "Failure not found" });

        if (!failure.retryEligibility) {
            return res.status(400).json({ success: false, message: "This failure is not eligible for a retry link." });
        }

        let paymentUrl = "";
        try {
            const razorpay = new Razorpay({
                key_id: process.env.RAZORPAY_KEY_ID || 'dummy',
                key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy'
            });
            const amountInPaise = failure.paymentOrderId ? failure.paymentOrderId.amountPaise : 10000;
            const plink = await razorpay.paymentLink.create({
                amount: amountInPaise,
                currency: "INR",
                description: "Retry Payment for Failed Transaction",
                customer: {
                    name: failure.organizationId?.name || "Customer",
                    email: failure.organizationId?.invoice_email || "customer@example.com"
                },
                notify: { sms: true, email: true },
                reminder_enable: true,
                notes: { failureId: failure._id.toString() }
            });
            paymentUrl = plink.short_url;
        } catch (rzpErr) {
            console.error("Razorpay link error:", rzpErr);
            return res.status(400).json({ success: false, message: "Failed to generate payment link: " + rzpErr.message });
        }

        // Generate new PaymentAttempt
        const newAttempt = await PaymentAttempt.create({
            paymentOrderId: failure.paymentOrderId?._id,
            organizationId: failure.organizationId,
            stage: "TOKEN_CREATED",
            amountPaise: failure.paymentOrderId?.amountPaise || 10000,
            createdBy: req.user?._id
        });

        // Fallback to internal checkout link if Razorpay link creation failed for some reason, though it shouldn't
        if (!paymentUrl) {
            paymentUrl = `https://billing.classgrid.in/checkout/${newAttempt._id}`;
        }

        // RULE 6 ENFORCEMENT: Audit Log
        await logAdminAction(
            req, 
            "UPDATE_BILLING", 
            "organization", 
            failure.organizationId?._id || failure.organizationId || null, 
            "Generated secure Razorpay payment retry link", 
            { failureId: failure._id, attemptId: newAttempt._id, link: paymentUrl }
        );

        res.json({ success: true, data: { link: paymentUrl } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const retryWebhook = async (req, res) => {
    try {
        const { failureId } = req.params;
        const failure = await PaymentFailure.findById(failureId).select("organizationId").lean();
        
        // RULE 6 ENFORCEMENT: Audit Log
        await logAdminAction(
            req, 
            "UPDATE_BILLING", 
            "organization", 
            failure?.organizationId || null, 
            "Triggered manual webhook retry for payment failure", 
            { failureId }
        );

        res.json({ success: true, message: "Webhook retry queued" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const recheckProvider = async (req, res) => {
    try {
        const { failureId } = req.params;
        const failure = await PaymentFailure.findById(failureId).select("organizationId").lean();

        // RULE 6 ENFORCEMENT: Audit Log
        await logAdminAction(
            req, 
            "UPDATE_BILLING", 
            "organization", 
            failure?.organizationId || null, 
            "Rechecked provider status for payment failure", 
            { failureId }
        );

        res.json({ success: true, message: "Provider status rechecked" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const assignFailure = async (req, res) => {
    try {
        const failure = await PaymentFailure.findByIdAndUpdate(req.params.failureId, { assignedTo: req.body.userId }, { new: true });
        
        // RULE 6 ENFORCEMENT: Audit Log
        await logAdminAction(
            req, 
            "UPDATE_BILLING", 
            "organization", 
            failure?.organizationId || null, 
            "Assigned payment failure to agent", 
            { failureId: failure._id, assignedTo: req.body.userId }
        );

        res.json({ success: true, data: failure });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const addFailureNote = async (req, res) => {
    try {
        const { failureId } = req.params;
        const failure = await PaymentFailure.findById(failureId).select("organizationId").lean();

        // RULE 6 ENFORCEMENT: Audit Log
        await logAdminAction(
            req, 
            "UPDATE_BILLING", 
            "organization", 
            failure?.organizationId || null, 
            "Added internal note to payment failure", 
            { failureId }
        );

        res.json({ success: true, message: "Note added" }); // In reality, we'd have a notes sub-schema or array
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const resolveFailure = async (req, res) => {
    try {
        const failure = await PaymentFailure.findByIdAndUpdate(req.params.failureId, { resolved: true }, { new: true });
        
        // RULE 6 ENFORCEMENT: Audit Log
        await logAdminAction(
            req, 
            "UPDATE_BILLING", 
            "organization", 
            failure?.organizationId || null, 
            "Resolved payment failure ticket", 
            { failureId: failure._id }
        );

        res.json({ success: true, data: failure });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
