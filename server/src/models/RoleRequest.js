import mongoose from "mongoose";

const roleRequestSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    organization_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    processed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    rejection_reason: {
      type: String,
      default: null,
    },
    tenant_join_code: {
      type: String,
      default: null, // The code used when requesting, for audit trail
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate pending requests for the same user, org, and role
roleRequestSchema.index(
  { user_id: 1, organization_id: 1, role: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } }
);

export default mongoose.models.RoleRequest || mongoose.model("RoleRequest", roleRequestSchema);
