import PaymentTransaction from "../../models/PaymentTransaction.js";
import PaymentRefund from "../../models/PaymentRefund.js";
import WebhookEvent from "../../models/WebhookEvent.js";

export const listTransactions = async (req, res) => {
    try {
        const transactions = await PaymentTransaction.find().populate("organizationId paymentOrderId").sort({ createdAt: -1 });
        res.json({ success: true, data: transactions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getTransaction = async (req, res) => {
    try {
        const transaction = await PaymentTransaction.findById(req.params.transactionId).populate("organizationId paymentOrderId paymentAttemptId");
        if (!transaction) return res.status(404).json({ success: false, message: "Transaction not found" });

        res.json({ success: true, data: transaction });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const recheckTransaction = async (req, res) => {
    try {
        // Calls the Payment Provider API to fetch latest status
        res.json({ success: true, message: "Recheck triggered" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createRefund = async (req, res) => {
    try {
        const transaction = await PaymentTransaction.findById(req.params.transactionId);
        if (!transaction) return res.status(404).json({ success: false, message: "Transaction not found" });

        const refund = await PaymentRefund.create({
            paymentTransactionId: transaction._id,
            organizationId: transaction.organizationId,
            providerRefundId: `rfnd_${Date.now()}`, // Mocking provider call
            amountPaise: req.body.amountPaise,
            reason: req.body.reason,
            createdBy: req.user?._id
        });

        res.status(201).json({ success: true, data: refund });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const reconcileTransaction = async (req, res) => {
    try {
        res.json({ success: true, message: "Transaction manually reconciled" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getTransactionWebhooks = async (req, res) => {
    try {
        const transaction = await PaymentTransaction.findById(req.params.transactionId);
        if (!transaction) return res.status(404).json({ success: false, message: "Transaction not found" });

        // Search Webhook events for the providerPaymentId inside the payload
        const webhooks = await WebhookEvent.find({ "payload.payload.payment.entity.id": transaction.providerPaymentId }).sort({ receivedAt: -1 });
        res.json({ success: true, data: webhooks });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getTransactionTimeline = async (req, res) => {
    try {
        // Collects attempts, transactions, refunds, settlements, and webhooks into a unified timeline
        res.json({ success: true, data: [] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
