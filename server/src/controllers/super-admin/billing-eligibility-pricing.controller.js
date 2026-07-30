import BillingEligibilityRule from "../../models/BillingEligibilityRule.js";
import BillingMetricDefinition from "../../models/BillingMetricDefinition.js";
import OrganizationBillingUsageSnapshot from "../../models/OrganizationBillingUsageSnapshot.js";
import OrganizationPriceOverride from "../../models/OrganizationPriceOverride.js";

// ── Eligibility Rules ──

export const listEligibilityRules = async (req, res) => {
    try {
        const rules = await BillingEligibilityRule.find().sort({ createdAt: -1 });
        res.json({ success: true, data: rules });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createEligibilityRule = async (req, res) => {
    try {
        const rule = await BillingEligibilityRule.create(req.body);
        res.status(201).json({ success: true, data: rule });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const updateEligibilityRule = async (req, res) => {
    try {
        const rule = await BillingEligibilityRule.findByIdAndUpdate(req.params.ruleId, req.body, { new: true });
        res.json({ success: true, data: rule });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// ── Metrics & Usage ──

export const listMetrics = async (req, res) => {
    try {
        const metrics = await BillingMetricDefinition.find().sort({ code: 1 });
        res.json({ success: true, data: metrics });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getUsage = async (req, res) => {
    try {
        const usage = await OrganizationBillingUsageSnapshot.find({ organizationId: req.params.organizationId }).sort({ billingPeriodStart: -1 });
        res.json({ success: true, data: usage });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const recalculateUsage = async (req, res) => {
    try {
        // Mock recalculation trigger
        res.json({ success: true, message: "Usage recalculation queued for the organization." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── Price Overrides ──

export const listPriceOverrides = async (req, res) => {
    try {
        const overrides = await OrganizationPriceOverride.find({ organizationId: req.params.organizationId }).sort({ effectiveFrom: -1 });
        res.json({ success: true, data: overrides });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createPriceOverride = async (req, res) => {
    try {
        const override = await OrganizationPriceOverride.create({
            ...req.body,
            organizationId: req.params.organizationId,
            createdBy: req.user?._id
        });
        res.status(201).json({ success: true, data: override });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const updatePriceOverride = async (req, res) => {
    try {
        const override = await OrganizationPriceOverride.findByIdAndUpdate(req.params.overrideId, req.body, { new: true });
        res.json({ success: true, data: override });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
