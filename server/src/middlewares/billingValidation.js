/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import mongoose from "mongoose";

const MAX_PAGE_SIZE = 200;

function findInvalidPaiseValue(value, path = "body") {
    if (!value || typeof value !== "object") return null;

    for (const [key, nestedValue] of Object.entries(value)) {
        const fieldPath = `${path}.${key}`;
        if (key.endsWith("Paise") && nestedValue !== undefined && nestedValue !== null && !Number.isSafeInteger(nestedValue)) {
            return `${fieldPath} must be an integer number of paise`;
        }
        if (nestedValue && typeof nestedValue === "object") {
            const nestedError = findInvalidPaiseValue(nestedValue, fieldPath);
            if (nestedError) return nestedError;
        }
    }
    return null;
}

export function validateBillingRequest(req, res, next) {
    for (const [key, value] of Object.entries(req.params || {})) {
        if (key.toLowerCase().endsWith("id") && value && !mongoose.isValidObjectId(value)) {
            return res.status(400).json({ success: false, code: "INVALID_IDENTIFIER", message: `${key} must be a valid identifier` });
        }
    }

    const paiseError = findInvalidPaiseValue(req.body);
    if (paiseError) {
        return res.status(400).json({ success: false, code: "INVALID_MONEY_VALUE", message: paiseError });
    }

    if (req.query.page !== undefined) {
        const page = Number(req.query.page);
        if (!Number.isInteger(page) || page < 1) {
            return res.status(400).json({ success: false, code: "INVALID_PAGE", message: "page must be a positive integer" });
        }
    }
    if (req.query.limit !== undefined) {
        const limit = Number(req.query.limit);
        if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) {
            return res.status(400).json({ success: false, code: "INVALID_LIMIT", message: `limit must be an integer between 1 and ${MAX_PAGE_SIZE}` });
        }
    }
    next();
}
