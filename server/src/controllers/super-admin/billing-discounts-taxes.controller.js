import Discount from "../../models/Discount.js";
import OrganizationCreditAccount from "../../models/OrganizationCreditAccount.js";
import OrganizationCreditEntry from "../../models/OrganizationCreditEntry.js";
import TaxRule from "../../models/TaxRule.js";
import TaxRuleVersion from "../../models/TaxRuleVersion.js";

// ── Discounts ──

export const listDiscounts = async (req, res) => {
    try {
        const discounts = await Discount.find().sort({ createdAt: -1 });
        res.json({ success: true, data: discounts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createDiscount = async (req, res) => {
    try {
        const discount = await Discount.create({ ...req.body, createdBy: req.user?._id });
        res.status(201).json({ success: true, data: discount });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const updateDiscount = async (req, res) => {
    try {
        const discount = await Discount.findByIdAndUpdate(req.params.discountId, req.body, { new: true });
        res.json({ success: true, data: discount });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const archiveDiscount = async (req, res) => {
    try {
        const discount = await Discount.findByIdAndUpdate(req.params.discountId, { status: "ARCHIVED" }, { new: true });
        res.json({ success: true, data: discount });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// ── Credits ──

export const getCreditAccount = async (req, res) => {
    try {
        const account = await OrganizationCreditAccount.findOne({ organizationId: req.params.organizationId });
        if (!account) return res.status(404).json({ success: false, message: "Account not found" });

        const history = await OrganizationCreditEntry.find({ organizationCreditAccountId: account._id }).sort({ createdAt: -1 });
        res.json({ success: true, data: { account, history } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const grantCredits = async (req, res) => {
    try {
        const { organizationId } = req.params;
        const { amountPaise, reason } = req.body;

        let account = await OrganizationCreditAccount.findOne({ organizationId });
        if (!account) {
            account = await OrganizationCreditAccount.create({ organizationId });
        }

        const balanceAfterPaise = account.currentBalancePaise + amountPaise;

        await OrganizationCreditEntry.create({
            organizationCreditAccountId: account._id,
            entryType: "CREDIT_GRANTED",
            amountPaise,
            balanceAfterPaise,
            reason,
            createdBy: req.user?._id
        });

        account.currentBalancePaise = balanceAfterPaise;
        await account.save();

        res.status(201).json({ success: true, data: account });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const reverseCredits = async (req, res) => {
    try {
        const { organizationId } = req.params;
        const { amountPaise, reason } = req.body;

        const account = await OrganizationCreditAccount.findOne({ organizationId });
        if (!account || account.currentBalancePaise < amountPaise) {
            return res.status(400).json({ success: false, message: "Insufficient balance" });
        }

        const balanceAfterPaise = account.currentBalancePaise - amountPaise;

        await OrganizationCreditEntry.create({
            organizationCreditAccountId: account._id,
            entryType: "CREDIT_REVERSED",
            amountPaise: -amountPaise,
            balanceAfterPaise,
            reason,
            createdBy: req.user?._id
        });

        account.currentBalancePaise = balanceAfterPaise;
        await account.save();

        res.status(201).json({ success: true, data: account });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// ── Taxes ──

export const listTaxRules = async (req, res) => {
    try {
        const rules = await TaxRule.find().populate("activeVersionId").sort({ createdAt: -1 });
        res.json({ success: true, data: rules });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createTaxRule = async (req, res) => {
    try {
        const rule = await TaxRule.create({ ...req.body, createdBy: req.user?._id });
        res.status(201).json({ success: true, data: rule });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const createTaxRuleVersion = async (req, res) => {
    try {
        const { taxRuleId } = req.params;
        
        const lastVersion = await TaxRuleVersion.findOne({ taxRuleId }).sort({ versionNumber: -1 });
        const versionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

        const version = await TaxRuleVersion.create({
            ...req.body,
            taxRuleId,
            versionNumber,
            createdBy: req.user?._id
        });

        await TaxRule.findByIdAndUpdate(taxRuleId, { activeVersionId: version._id });

        res.status(201).json({ success: true, data: version });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
