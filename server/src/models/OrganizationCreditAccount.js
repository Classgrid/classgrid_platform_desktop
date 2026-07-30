import mongoose from "mongoose";

const organizationCreditAccountSchema = new mongoose.Schema(
    {
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            unique: true,
        },
        currentBalancePaise: {
            type: Number,
            default: 0,
        },
        currency: {
            type: String,
            default: "INR",
        },
        status: {
            type: String,
            enum: ["ACTIVE", "FROZEN"],
            default: "ACTIVE",
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.OrganizationCreditAccount || mongoose.model("OrganizationCreditAccount", organizationCreditAccountSchema);
