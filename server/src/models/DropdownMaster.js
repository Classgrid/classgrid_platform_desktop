import mongoose from "mongoose";

const dropdownMasterSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "ORG_TYPE",
        "ROLE_CATEGORY",
        "DEPARTMENT",
        "DESIGNATION",
        "QUALIFICATION",
        "EXP_DOMAIN",
        "RESPONSIBILITY",
        "SPECIALIZATION",
      ],
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    organization_types: {
      type: [String],
      default: [],
    },
    role_categories: {
      type: [String],
      default: [],
    },
    department_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DropdownMaster",
      },
    ],
    designation_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DropdownMaster",
      },
    ],
    is_active: {
      type: Boolean,
      default: true,
    },
    display_order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("DropdownMaster", dropdownMasterSchema);
