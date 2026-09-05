/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 CRITICAL AI AND SYSTEM RULES 🚨
 * 1. NEVER DELETE ANY ENVIRONMENT VARIABLES.
 * 2. LOCALHOST TESTING IS STRICTLY BANNED. NO AI WILL EVER TRY TO WORK LOCALLY.
 * 3. THIS REPO IS PRODUCTION-FIRST. DO NOT TOUCH OR REMOVE KEYS.
 * ─────────────────────────────────────────────────────────
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 NAMING CONVENTION RULE 🚨
 * 1. "CLASSGRID PLATFORM" is strictly the REPO NAME.
 * 2. "CLASSGRID ERP" is the actual PRODUCT NAME.
 * 3. NEVER use "Classgrid Platform" anywhere in the frontend UI or user-facing text.
 * ─────────────────────────────────────────────────────────
 */

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
