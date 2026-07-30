import BillingPlan from "../../models/BillingPlan.js";
import BillingPlanVersion from "../../models/BillingPlanVersion.js";
import BillingModule from "../../models/BillingModule.js";
import BillingModuleVersion from "../../models/BillingModuleVersion.js";
import PlanModule from "../../models/PlanModule.js";

// ── Plans ──

export const listPlans = async (req, res) => {
    try {
        const plans = await BillingPlan.find().populate("activeVersionId").sort({ createdAt: -1 });
        res.json({ success: true, data: plans });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createPlan = async (req, res) => {
    try {
        const { name, code, description, currency, allowedOrgTypes, allowedStructureTypes } = req.body;
        const plan = await BillingPlan.create({
            name, code, description, currency, allowedOrgTypes, allowedStructureTypes, status: "DRAFT", createdBy: req.user?._id
        });
        res.status(201).json({ success: true, data: plan });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getPlan = async (req, res) => {
    try {
        const plan = await BillingPlan.findById(req.params.planId).populate("activeVersionId");
        if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });
        res.json({ success: true, data: plan });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updatePlanEligibility = async (req, res) => {
    try {
        const { allowedOrgTypes, allowedStructureTypes } = req.body;
        const plan = await BillingPlan.findByIdAndUpdate(
            req.params.planId, 
            { allowedOrgTypes, allowedStructureTypes, updatedBy: req.user?._id }, 
            { new: true }
        );
        if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });
        res.json({ success: true, data: plan });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createPlanVersion = async (req, res) => {
    try {
        const { planId } = req.params;
        const { monthlyBasePricePaise, annualBasePricePaise, organizationLimit, trialPeriodDays, effectiveFrom, modules } = req.body;
        
        const plan = await BillingPlan.findById(planId);
        if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });

        // Get next version number
        const lastVersion = await BillingPlanVersion.findOne({ planId }).sort({ versionNumber: -1 });
        const versionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

        const version = await BillingPlanVersion.create({
            planId, versionNumber, monthlyBasePricePaise, annualBasePricePaise, organizationLimit, trialPeriodDays, effectiveFrom, createdBy: req.user?._id
        });

        // Add Plan Modules
        if (modules && modules.length > 0) {
            const planModules = modules.map(m => ({
                billingPlanVersionId: version._id,
                billingModuleId: m.moduleId,
                pricingType: m.pricingType,
                includedQuantity: m.includedQuantity,
                monthlyPricePaise: m.monthlyPricePaise,
                annualPricePaise: m.annualPricePaise,
                isIncluded: m.isIncluded,
                isOptional: m.isOptional,
                effectiveFrom
            }));
            await PlanModule.insertMany(planModules);
        }

        res.status(201).json({ success: true, data: version });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const listPlanVersions = async (req, res) => {
    try {
        const versions = await BillingPlanVersion.find({ planId: req.params.planId }).sort({ versionNumber: -1 });
        res.json({ success: true, data: versions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const archivePlan = async (req, res) => {
    try {
        const plan = await BillingPlan.findByIdAndUpdate(req.params.planId, { status: "ARCHIVED" }, { new: true });
        res.json({ success: true, data: plan });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── Modules ──

export const listModules = async (req, res) => {
    try {
        const modules = await BillingModule.find().populate("activeVersionId").sort({ createdAt: -1 });
        res.json({ success: true, data: modules });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createModule = async (req, res) => {
    try {
        const { name, code, category, description, pricingType, trialAllowed, allowedOrgTypes, allowedStructureTypes } = req.body;
        const module = await BillingModule.create({
            name, code, category, description, pricingType, trialAllowed, allowedOrgTypes, allowedStructureTypes, createdBy: req.user?._id
        });
        res.status(201).json({ success: true, data: module });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getModule = async (req, res) => {
    try {
        const module = await BillingModule.findById(req.params.moduleId).populate("activeVersionId");
        if (!module) return res.status(404).json({ success: false, message: "Module not found" });
        res.json({ success: true, data: module });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateModuleEligibility = async (req, res) => {
    try {
        const { allowedOrgTypes, allowedStructureTypes } = req.body;
        const module = await BillingModule.findByIdAndUpdate(
            req.params.moduleId, 
            { allowedOrgTypes, allowedStructureTypes, updatedBy: req.user?._id }, 
            { new: true }
        );
        if (!module) return res.status(404).json({ success: false, message: "Module not found" });
        res.json({ success: true, data: module });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createModuleVersion = async (req, res) => {
    try {
        const { moduleId } = req.params;
        const { monthlyPricePaise, annualPricePaise, taxCategory, unitType, effectiveFrom } = req.body;
        
        const module = await BillingModule.findById(moduleId);
        if (!module) return res.status(404).json({ success: false, message: "Module not found" });

        const lastVersion = await BillingModuleVersion.findOne({ moduleId }).sort({ versionNumber: -1 });
        const versionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

        const version = await BillingModuleVersion.create({
            moduleId, versionNumber, monthlyPricePaise, annualPricePaise, taxCategory, unitType, effectiveFrom, createdBy: req.user?._id
        });

        res.status(201).json({ success: true, data: version });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const listModuleVersions = async (req, res) => {
    try {
        const versions = await BillingModuleVersion.find({ moduleId: req.params.moduleId }).sort({ versionNumber: -1 });
        res.json({ success: true, data: versions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const archiveModule = async (req, res) => {
    try {
        const module = await BillingModule.findByIdAndUpdate(req.params.moduleId, { status: "ARCHIVED" }, { new: true });
        res.json({ success: true, data: module });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
