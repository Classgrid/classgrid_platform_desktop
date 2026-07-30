import PaymentTransaction from "../../models/PaymentTransaction.js";
import Invoice from "../../models/Invoice.js";
import InvoiceLineItem from "../../models/InvoiceLineItem.js";
import BillingExportJob from "../../models/BillingExportJob.js";

// Helper to filter for only Classgrid SaaS Revenue
const getBaseRevenueMatch = (filters) => {
    const match = {
        status: "CAPTURED",
        // Here we'd add filter to ensure it's only Classgrid's merchant account or paymentFlow == CLASSGRID_SUBSCRIPTION
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
        const job = await BillingExportJob.create({
            exportType: "REVENUE_REPORT",
            format: req.query.format || "CSV",
            filters: req.query,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days
            requestedBy: req.user?._id
        });
        res.status(202).json({ success: true, data: job, message: "Export job queued" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
