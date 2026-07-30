import mongoose from "mongoose";

const billingExportJobSchema = new mongoose.Schema(
    {
        exportType: {
            type: String, // e.g. "REVENUE_REPORT", "FAILED_PAYMENTS_REPORT", "INVOICE_BATCH"
            required: true,
        },
        format: {
            type: String, // e.g. "CSV", "EXCEL", "PDF_ZIP"
            required: true,
        },
        filters: {
            type: mongoose.Schema.Types.Mixed, // The query filters used to generate the report
            default: null,
        },
        status: {
            type: String,
            enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "EXPIRED"],
            default: "PENDING",
        },
        fileUrl: {
            type: String, // Path to R2 bucket or signed URL
            default: null,
        },
        expiresAt: {
            type: Date, // Exports shouldn't live forever
            required: true,
        },
        errorDetails: {
            type: String,
            default: null,
        },
        requestedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        }
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.BillingExportJob || mongoose.model("BillingExportJob", billingExportJobSchema);
