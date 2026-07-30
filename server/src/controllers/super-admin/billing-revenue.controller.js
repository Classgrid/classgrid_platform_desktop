import PaymentTransaction from "../../models/PaymentTransaction.js";
import Invoice from "../../models/Invoice.js";
import InvoiceLineItem from "../../models/InvoiceLineItem.js";
import BillingExportJob from "../../models/BillingExportJob.js";
import ReconciliationRun from "../../models/ReconciliationRun.js";
import ReconciliationMismatch from "../../models/ReconciliationMismatch.js";
import Razorpay from "razorpay";
import { logAdminAction } from "../../services/auditLog.service.js";

// Helper to filter for only Classgrid SaaS Revenue
const getBaseRevenueMatch = (filters) => {
    const match = {
        status: "CAPTURED",
        paymentFlow: "CLASSGRID_SUBSCRIPTION",
        merchantType: "CLASSGRID",
    };
    if (filters.startDate && filters.endDate) {
        match.capturedAt = { $gte: new Date(filters.startDate), $lte: new Date(filters.endDate) };
    }
    return match;
};

export const getRevenueOverview = async (req, res) => {
    try {
        const match = getBaseRevenueMatch(req.query);
        const revenue = await PaymentTransaction.aggregate([
            { $match: match },
            {
                $group: {
                    _id: null,
                    grossRevenuePaise: { $sum: "$amountCapturedPaise" },
                    totalGatewayFeesPaise: { $sum: "$feePaise" },
                    netRevenuePaise: { $sum: { $subtract: ["$amountCapturedPaise", "$feePaise"] } },
                    transactionCount: { $sum: 1 }
                }
            }
        ]);
        res.json({ success: true, data: revenue[0] || { grossRevenuePaise: 0, totalGatewayFeesPaise: 0, netRevenuePaise: 0, transactionCount: 0 } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getRevenueByOrganization = async (req, res) => {
    try {
        const match = getBaseRevenueMatch(req.query);
        const revenue = await PaymentTransaction.aggregate([
            { $match: match },
            {
                $group: {
                    _id: "$organizationId",
                    grossRevenuePaise: { $sum: "$amountCapturedPaise" },
                    transactionCount: { $sum: 1 },
                    latestTransactionDate: { $max: "$capturedAt" }
                }
            },
            {
                $lookup: {
                    from: "organizations",
                    localField: "_id",
                    foreignField: "_id",
                    as: "organization"
                }
            },
            { $unwind: "$organization" },
            { $sort: { grossRevenuePaise: -1 } }
        ]);
        res.json({ success: true, data: revenue });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getRevenueByModule = async (req, res) => {
    try {
        // This is a simplified aggregate, real logic requires joining Payment -> Invoice -> InvoiceLineItem
        res.json({ success: true, data: [] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getRevenueByInvoice = async (req, res) => {
    try {
        const match = { status: { $in: ["PAID", "PARTIALLY_PAID"] } };
        const invoices = await Invoice.find(match).populate("organizationId").sort({ issueDate: -1 }).limit(100);
        res.json({ success: true, data: invoices });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const exportRevenue = async (req, res) => {
    try {
        const filters = { ...req.query, ...(req.body?.filters || {}) };
        const job = await BillingExportJob.create({
            exportType: "REVENUE_REPORT",
            format: req.body?.format || req.query.format || "CSV",
            filters,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days
            requestedBy: req.user?._id
        });

        // RULE 6 ENFORCEMENT: Audit Log
        await logAdminAction(
            req, 
            "UPDATE_BILLING", 
            "organization", 
            null, 
            "Exported revenue report", 
            { jobId: job._id }
        );

        res.status(202).json({ success: true, data: job, message: "Export job queued" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const reconcileRevenue = async (req, res) => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
        return res.status(503).json({
            success: false,
            code: "PAYMENT_PROVIDER_NOT_CONFIGURED",
            message: "Razorpay reconciliation is not configured",
        });
    }

    const requestedDate = req.body?.targetDate ? new Date(req.body.targetDate) : new Date();
    if (Number.isNaN(requestedDate.getTime())) {
        return res.status(400).json({ success: false, message: "targetDate must be a valid date" });
    }

    const start = new Date(requestedDate);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    const run = await ReconciliationRun.create({
        targetDate: start,
        provider: "RAZORPAY",
        status: "IN_PROGRESS",
        runBy: req.user?._id || null,
    });

    try {
        const transactions = await PaymentTransaction.find({ capturedAt: { $gte: start, $lt: end } }).limit(500);
        const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
        const mismatches = [];

        for (const transaction of transactions) {
            const internalState = {
                status: transaction.status,
                amountCapturedPaise: transaction.amountCapturedPaise,
                currency: transaction.currency,
                providerPaymentId: transaction.providerPaymentId,
            };
            let providerPayment;
            try {
                providerPayment = await razorpay.payments.fetch(transaction.providerPaymentId);
            } catch (providerError) {
                mismatches.push({
                    reconciliationRunId: run._id,
                    providerTransactionId: transaction.providerPaymentId,
                    internalTransactionId: transaction._id,
                    mismatchType: "MISSING_IN_PROVIDER",
                    providerState: { errorCode: providerError?.error?.code || providerError?.statusCode || "FETCH_FAILED" },
                    internalState,
                });
                continue;
            }

            const providerState = {
                id: providerPayment.id,
                status: providerPayment.status,
                amount: providerPayment.amount,
                currency: providerPayment.currency,
            };
            if (providerPayment.amount !== transaction.amountCapturedPaise) {
                mismatches.push({
                    reconciliationRunId: run._id,
                    providerTransactionId: transaction.providerPaymentId,
                    internalTransactionId: transaction._id,
                    mismatchType: "AMOUNT_MISMATCH",
                    providerState,
                    internalState,
                });
            }
            const expectedStatus = providerPayment.status === "captured" ? "CAPTURED" : providerPayment.status?.toUpperCase();
            if (expectedStatus !== transaction.status) {
                mismatches.push({
                    reconciliationRunId: run._id,
                    providerTransactionId: transaction.providerPaymentId,
                    internalTransactionId: transaction._id,
                    mismatchType: "STATUS_MISMATCH",
                    providerState,
                    internalState,
                });
            }
        }

        if (mismatches.length) await ReconciliationMismatch.insertMany(mismatches);
        run.totalTransactionsChecked = transactions.length;
        run.mismatchesFound = mismatches.length;
        run.status = "COMPLETED";
        await run.save();
        await logAdminAction(
            req, "UPDATE_BILLING", "billing", run._id, "Reconciled Razorpay revenue",
            { targetDate: start, checked: transactions.length, mismatches: mismatches.length }
        );
        return res.json({ success: true, data: run });
    } catch (error) {
        run.status = "FAILED";
        run.errorDetails = error.message;
        await run.save();
        return res.status(500).json({ success: false, message: "Revenue reconciliation failed" });
    }
};
