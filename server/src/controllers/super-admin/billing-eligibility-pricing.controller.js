import BillingEligibilityRule from "../../models/BillingEligibilityRule.js";
import BillingMetricDefinition from "../../models/BillingMetricDefinition.js";
import OrganizationBillingUsageSnapshot from "../../models/OrganizationBillingUsageSnapshot.js";
import OrganizationPriceOverride from "../../models/OrganizationPriceOverride.js";
import { logAdminAction } from "../../services/auditLog.service.js";

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
        
        // RULE 6 ENFORCEMENT: Audit Log
        await logAdminAction(
            req, 
            "UPDATE_BILLING", 
            "organization", 
            null, 
            "Created eligibility rule", 
            { ruleId: rule._id }
        );

        res.status(201).json({ success: true, data: rule });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const updateEligibilityRule = async (req, res) => {
    try {
        const rule = await BillingEligibilityRule.findByIdAndUpdate(req.params.ruleId, req.body, { new: true });
        
        // RULE 6 ENFORCEMENT: Audit Log
        await logAdminAction(
            req, 
            "UPDATE_BILLING", 
            "organization", 
            null, 
            "Updated eligibility rule", 
            { ruleId: req.params.ruleId }
        );

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
        const { organizationId } = req.params;
        const OrganizationSubscription = (await import("../../models/OrganizationSubscription.js")).default;
        const subscription = await OrganizationSubscription.findOne({ organizationId });
        
        if (subscription) {
            const UsageAggregator = (await import("../../services/billing/UsageAggregator.js")).default;
            if (UsageAggregator && UsageAggregator.aggregateUsage) {
                await UsageAggregator.aggregateUsage(organizationId, subscription.currentPeriodStart, subscription.currentPeriodEnd);
            }
        }
        
        // RULE 6 ENFORCEMENT: Audit Log
        await logAdminAction(
            req, 
            "UPDATE_BILLING", 
            "organization", 
            organizationId, 
            "Triggered real usage recalculation via UsageAggregator", 
            {}
        );

        res.json({ success: true, message: "Usage recalculation completed for the organization." });
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

        // RULE 6 ENFORCEMENT: Audit Log
        await logAdminAction(
            req, 
            "UPDATE_BILLING", 
            "organization", 
            req.params.organizationId, 
            "Created price override", 
            { overrideId: override._id }
        );

        res.status(201).json({ success: true, data: override });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const updatePriceOverride = async (req, res) => {
    try {
        const override = await OrganizationPriceOverride.findByIdAndUpdate(req.params.overrideId, req.body, { new: true });
        
        // RULE 6 ENFORCEMENT: Audit Log
        await logAdminAction(
            req, 
            "UPDATE_BILLING", 
            "organization", 
            override?.organizationId || null, 
            "Updated price override", 
            { overrideId: req.params.overrideId }
        );

        res.json({ success: true, data: override });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const deletePriceOverride = async (req, res) => {
    try {
        const override = await OrganizationPriceOverride.findById(req.params.overrideId);
        if (!override) return res.status(404).json({ success: false, message: "Price override not found" });

        if (!override.effectiveUntil || override.effectiveUntil > new Date()) {
            override.effectiveUntil = new Date();
            await override.save();
        }
        await logAdminAction(
            req, "UPDATE_BILLING", "billing", override._id,
            "Ended organization price override",
            { organizationId: override.organizationId, effectiveUntil: override.effectiveUntil },
            override.organizationId
        );
        return res.json({ success: true, data: override });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};
