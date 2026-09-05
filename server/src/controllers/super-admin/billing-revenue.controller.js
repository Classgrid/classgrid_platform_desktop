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

import PaymentTransaction from "../../models/PaymentTransaction.js";
import Invoice from "../../models/Invoice.js";
import InvoiceLineItem from "../../models/InvoiceLineItem.js";
import OrganizationSubscriptionItem from "../../models/OrganizationSubscriptionItem.js";
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
        const invoiceFilter = {
            status: { $in: ["PAID", "PARTIALLY_PAID"] },
            amountPaidPaise: { $gt: 0 },
        };
        if (req.query.startDate || req.query.endDate) {
            invoiceFilter.issueDate = {};
            if (req.query.startDate) {
                const startDate = new Date(req.query.startDate);
                if (Number.isNaN(startDate.getTime())) {
                    return res.status(400).json({ success: false, message: "startDate must be a valid date" });
                }
                invoiceFilter.issueDate.$gte = startDate;
            }
            if (req.query.endDate) {
                const endDate = new Date(req.query.endDate);
                if (Number.isNaN(endDate.getTime())) {
                    return res.status(400).json({ success: false, message: "endDate must be a valid date" });
                }
                invoiceFilter.issueDate.$lte = endDate;
            }
        }

        const invoices = await Invoice.find(invoiceFilter).select("_id totalAmountPaise amountPaidPaise").lean();
        const invoiceById = new Map(invoices.map((invoice) => [invoice._id.toString(), invoice]));
        const [lineItems, activeItems] = await Promise.all([
            InvoiceLineItem.find({
                invoiceId: { $in: invoices.map((invoice) => invoice._id) },
                moduleVersionId: { $ne: null },
            })
                .populate({ path: "moduleVersionId", populate: { path: "moduleId", select: "name code" } })
                .lean(),
            OrganizationSubscriptionItem.find({ status: "ACTIVE" })
                .populate("billingModuleId", "name code")
                .lean(),
        ]);

        const activeCounts = new Map();
        for (const item of activeItems) {
            const moduleId = (item.billingModuleId?._id || item.billingModuleId)?.toString();
            if (moduleId) activeCounts.set(moduleId, (activeCounts.get(moduleId) || 0) + 1);
        }

        const byModule = new Map();
        for (const line of lineItems) {
            const module = line.moduleVersionId?.moduleId;
            const moduleId = (module?._id || module)?.toString();
            if (!moduleId) continue;
            const invoice = invoiceById.get(line.invoiceId.toString());
            const paidRatio = Math.min(
                Number(invoice?.amountPaidPaise || 0) / Math.max(Number(invoice?.totalAmountPaise || 0), 1),
                1,
            );
            const recognizedPaise = Math.round(Number(line.totalAmountPaise || line.subtotalPaise || 0) * paidRatio);
            const current = byModule.get(moduleId) || {
                moduleId,
                module: { _id: moduleId, name: module?.name, code: module?.code },
                activeCount: activeCounts.get(moduleId) || 0,
                recognizedRevenuePaise: 0,
            };
            current.recognizedRevenuePaise += recognizedPaise;
            byModule.set(moduleId, current);
        }
        for (const item of activeItems) {
            const module = item.billingModuleId;
            const moduleId = (module?._id || module)?.toString();
            if (moduleId && !byModule.has(moduleId)) {
                byModule.set(moduleId, {
                    moduleId,
                    module: { _id: moduleId, name: module?.name, code: module?.code },
                    activeCount: activeCounts.get(moduleId) || 0,
                    recognizedRevenuePaise: 0,
                });
            }
        }
        const results = [...byModule.values()].sort((a, b) => b.recognizedRevenuePaise - a.recognizedRevenuePaise);
        const totalRevenuePaise = results.reduce((sum, item) => sum + item.recognizedRevenuePaise, 0);
        for (const item of results) {
            item.percentageOfTotal = totalRevenuePaise
                ? Math.round((item.recognizedRevenuePaise / totalRevenuePaise) * 10000) / 100
                : 0;
        }
        res.json({ success: true, data: results });
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
