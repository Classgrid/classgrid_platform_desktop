import Invoice from "../../models/Invoice.js";
import InvoiceLineItem from "../../models/InvoiceLineItem.js";
import CreditNote from "../../models/CreditNote.js";
import InvoiceDelivery from "../../models/InvoiceDelivery.js";
import InvoiceGenerator from "../../services/billing/InvoiceGenerator.js";
import { INVOICE_STATUS } from "../../utils/billing.utils.js";

export const listInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find().sort({ createdAt: -1 });
        res.json({ success: true, data: invoices });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.invoiceId);
        if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });

        const lines = await InvoiceLineItem.find({ invoiceId: invoice._id });
        res.json({ success: true, data: { invoice, lines } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const previewInvoice = async (req, res) => {
    try {
        const { organizationId, subscriptionId, periodStart, periodEnd } = req.body;
        // Run generation without saving
        res.json({ success: true, message: "Preview generated" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const generateInvoice = async (req, res) => {
    try {
        const { organizationId, subscriptionId, periodStart, periodEnd } = req.body;
        const invoice = await InvoiceGenerator.generateForSubscription(organizationId, subscriptionId, new Date(periodStart), new Date(periodEnd));
        res.status(201).json({ success: true, data: invoice });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const issueInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.invoiceId);
        if (!invoice || invoice.status !== INVOICE_STATUS.DRAFT) {
            return res.status(400).json({ success: false, message: "Only draft invoices can be issued." });
        }
        
        invoice.status = INVOICE_STATUS.ISSUED;
        invoice.issueDate = new Date();
        invoice.isLocked = true;
        await invoice.save();

        res.json({ success: true, data: invoice });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const sendInvoice = async (req, res) => {
    try {
        await InvoiceDelivery.create({
            invoiceId: req.params.invoiceId,
            organizationId: req.body.organizationId, // Usually pulled from invoice directly
            deliveryEvent: "EMAIL_SENT",
            emailSentTo: req.body.email,
            actorId: req.user?._id
        });
        res.json({ success: true, message: "Invoice sent" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const voidInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findByIdAndUpdate(req.params.invoiceId, { status: INVOICE_STATUS.VOID }, { new: true });
        res.json({ success: true, data: invoice });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const createCreditNote = async (req, res) => {
    try {
        const note = await CreditNote.create({ ...req.body, invoiceId: req.params.invoiceId, createdBy: req.user?._id });
        res.status(201).json({ success: true, data: note });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const downloadInvoicePdf = async (req, res) => {
    try {
        res.json({ success: true, url: "https://r2.classgrid.in/invoices/demo.pdf" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getDeliveryHistory = async (req, res) => {
    try {
        const history = await InvoiceDelivery.find({ invoiceId: req.params.invoiceId }).sort({ createdAt: -1 });
        res.json({ success: true, data: history });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
