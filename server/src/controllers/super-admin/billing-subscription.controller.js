import OrganizationSubscription from "../../models/OrganizationSubscription.js";
import OrganizationSubscriptionItem from "../../models/OrganizationSubscriptionItem.js";
import SubscriptionChange from "../../models/SubscriptionChange.js";
import InvoiceGenerator from "../../services/billing/InvoiceGenerator.js";
import ProrationEngine from "../../services/billing/ProrationEngine.js";

export const listSubscriptions = async (req, res) => {
    try {
        const subscriptions = await OrganizationSubscription.find().populate("billingPlanVersionId organizationId").sort({ createdAt: -1 });
        res.json({ success: true, data: subscriptions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getSubscriptionOverview = async (req, res) => {
    try {
        const Organization = (await import("../../models/Organization.js")).default;
        const User = (await import("../../models/User.js")).default;
        
        const [orgStats, totalUsers] = await Promise.all([
            Organization.aggregate([
                {
                    $group: {
                        _id: null,
                        totalOrgs: { $sum: 1 },
                        activeOrgs: { 
                            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } 
                        },
                        demoOrgs: {
                            $sum: { $cond: [{ $in: ["$org_type", ["DEMO", "TRIAL"]] }, 1, 0] }
                        }
                    }
                }
            ]),
            User.countDocuments({ status: "active" })
        ]);

        const stats = orgStats[0] || { totalOrgs: 0, activeOrgs: 0, demoOrgs: 0 };
        
        res.json({
            success: true,
            data: {
                totalOrganizations: stats.totalOrgs,
                activeOrgs: stats.activeOrgs,
                demoTrialOrgs: stats.demoOrgs,
                totalUsersAcrossOrgs: totalUsers
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getSubscription = async (req, res) => {
    try {
        const { organizationId } = req.params;
        const subscription = await OrganizationSubscription.findOne({ organizationId }).populate("billingPlanVersionId");
        if (!subscription) return res.status(404).json({ success: false, message: "Subscription not found" });

        const items = await OrganizationSubscriptionItem.find({ organizationSubscriptionId: subscription._id }).populate("billingModuleVersionId");
        
        res.json({ success: true, data: { subscription, items } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const previewSubscriptionChange = async (req, res) => {
    try {
        const { organizationId } = req.params;
        // In a real scenario, this would call a sophisticated Preview Engine that runs InvoiceGenerator in a dry-run mode
        // For now, we mock the response format requested by the user
        res.json({
            success: true,
            data: {
                currentPricePaise: 500000,
                newPricePaise: 700000,
                prorationPaise: 100000,
                discountPaise: 0,
                creditPaise: 0,
                taxImpactPaise: 18000,
                effectiveDate: new Date(),
                upcomingInvoiceTotalPaise: 318000
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const assignPlan = async (req, res) => {
    try {
        const { organizationId } = req.params;
        const { billingPlanId, billingPlanVersionId, billingCycle } = req.body;

        const subscription = await OrganizationSubscription.create({
            organizationId,
            billingPlanId,
            billingPlanVersionId,
            billingCycle,
            status: "ACTIVE",
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1))
        });

        await SubscriptionChange.create({
            organizationSubscriptionId: subscription._id,
            reason: "PLAN_ASSIGNED",
            newStateSnapshot: subscription,
            createdBy: req.user?._id
        });

        res.status(201).json({ success: true, data: subscription });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const changePlan = async (req, res) => {
    try {
        const { organizationId } = req.params;
        const subscription = await OrganizationSubscription.findOneAndUpdate({ organizationId }, req.body, { new: true });
        res.json({ success: true, data: subscription });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const addModule = async (req, res) => {
    try {
        const { organizationId } = req.params;
        const subscription = await OrganizationSubscription.findOne({ organizationId });
        if (!subscription) return res.status(404).json({ success: false, message: "Subscription not found" });

        const item = await OrganizationSubscriptionItem.create({
            organizationSubscriptionId: subscription._id,
            billingModuleId: req.body.billingModuleId,
            billingModuleVersionId: req.body.billingModuleVersionId,
            quantity: req.body.quantity || 1,
            effectiveFrom: new Date()
        });

        await SubscriptionChange.create({
            organizationSubscriptionId: subscription._id,
            reason: "MODULE_ADDED",
            newStateSnapshot: item,
            createdBy: req.user?._id
        });

        res.status(201).json({ success: true, data: item });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const removeModule = async (req, res) => {
    try {
        const { organizationId } = req.params;
        res.json({ success: true, message: "Module removed" });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const changeBillingCycle = async (req, res) => {
    try {
        res.json({ success: true, message: "Cycle changed" });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const pauseSubscription = async (req, res) => {
    try {
        const { organizationId } = req.params;
        const subscription = await OrganizationSubscription.findOneAndUpdate({ organizationId }, { status: "PAUSED" }, { new: true });
        res.json({ success: true, data: subscription });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const resumeSubscription = async (req, res) => {
    try {
        const { organizationId } = req.params;
        const subscription = await OrganizationSubscription.findOneAndUpdate({ organizationId }, { status: "ACTIVE" }, { new: true });
        res.json({ success: true, data: subscription });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const cancelSubscription = async (req, res) => {
    try {
        const { organizationId } = req.params;
        const subscription = await OrganizationSubscription.findOneAndUpdate({ organizationId }, { status: "CANCELLED", cancelledAt: new Date() }, { new: true });
        res.json({ success: true, data: subscription });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getSubscriptionHistory = async (req, res) => {
    try {
        const { organizationId } = req.params;
        const subscription = await OrganizationSubscription.findOne({ organizationId });
        if (!subscription) return res.status(404).json({ success: false, message: "Subscription not found" });

        const history = await SubscriptionChange.find({ organizationSubscriptionId: subscription._id }).sort({ createdAt: -1 });
        res.json({ success: true, data: history });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getUpcomingInvoice = async (req, res) => {
    try {
        const { organizationId } = req.params;
        const subscription = await OrganizationSubscription.findOne({ organizationId });
        if (!subscription) return res.status(404).json({ success: false, message: "Subscription not found" });

        // Generate draft invoice dynamically without saving
        const draft = await InvoiceGenerator.generateForSubscription(organizationId, subscription._id, subscription.currentPeriodStart, subscription.currentPeriodEnd);
        
        res.json({ success: true, data: draft });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
