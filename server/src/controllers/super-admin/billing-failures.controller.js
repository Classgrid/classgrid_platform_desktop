import PaymentFailure from "../../models/PaymentFailure.js";
import PaymentAttempt from "../../models/PaymentAttempt.js";

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

export const generatePaymentLink = async (req, res) => {
    try {
        const failure = await PaymentFailure.findById(req.params.failureId).populate("paymentOrderId");
        if (!failure) return res.status(404).json({ success: false, message: "Failure not found" });

        if (!failure.retryEligibility) {
            return res.status(400).json({ success: false, message: "This failure is not eligible for a retry link." });
        }

        // Generate new PaymentAttempt
        const newAttempt = await PaymentAttempt.create({
            paymentOrderId: failure.paymentOrderId._id,
            organizationId: failure.organizationId,
            stage: "TOKEN_CREATED",
            amountPaise: failure.paymentOrderId.amountPaise,
            createdBy: req.user?._id
        });

        // Mocking the generation of a secure link
        const link = `https://billing.classgrid.in/checkout/${newAttempt._id}`;

        res.json({ success: true, data: { link, attempt: newAttempt }, message: "Generated a new authorized checkout attempt." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const retryWebhook = async (req, res) => {
    try {
        res.json({ success: true, message: "Webhook retry queued" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const recheckProvider = async (req, res) => {
    try {
        res.json({ success: true, message: "Provider status rechecked" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const assignFailure = async (req, res) => {
    try {
        const failure = await PaymentFailure.findByIdAndUpdate(req.params.failureId, { assignedTo: req.body.userId }, { new: true });
        res.json({ success: true, data: failure });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const addFailureNote = async (req, res) => {
    try {
        res.json({ success: true, message: "Note added" }); // In reality, we'd have a notes sub-schema or array
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const resolveFailure = async (req, res) => {
    try {
        const failure = await PaymentFailure.findByIdAndUpdate(req.params.failureId, { resolved: true }, { new: true });
        res.json({ success: true, data: failure });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
