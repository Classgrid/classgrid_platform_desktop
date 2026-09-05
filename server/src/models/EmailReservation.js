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

import mongoose from 'mongoose';

const EmailReservationSchema = new mongoose.Schema({
  organization_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  },
  reserved_email: {
    type: String,
    required: true,
    unique: true, // Atomic uniqueness
    lowercase: true,
    trim: true,
  },
  intended_user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // Could initially be null if reserved before final user creation
  },
  application_id: {
    type: mongoose.Schema.Types.ObjectId,
    // Ref: 'AdmissionApplication', // Will reference when we build Admission Engine
  },
  status: {
    type: String,
    enum: ['pending', 'provisioned', 'failed'],
    default: 'pending',
  },
  provider: {
    type: String,
    enum: ['google_workspace', 'zoho', 'cpanel', 'internal'],
    default: 'internal',
  },
  provider_reference_id: {
    type: String,
  },
  error_message: {
    type: String,
  },
  expires_at: {
    type: Date,
    // Optional: if we want reservations to expire if they don't complete
  }
}, { timestamps: true });

// Prevent duplicate reservations of the exact same email 
// unique: true on `reserved_email` acts as an atomic lock.

const EmailReservation = mongoose.model('EmailReservation', EmailReservationSchema);

export default EmailReservation;
