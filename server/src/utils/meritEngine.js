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

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 HOSTING & ARCHITECTURE RULE 🚨
 * 1. BACKEND IS HOSTED ON AWS EC2 AT API.CLASSGRID.IN
 * 2. FRONTEND IS HOSTED ON VERCEL
 * ─────────────────────────────────────────────────────────
 */

/**
 * BOARD_MULTIPLIERS
 * Used to normalize marks across different educational boards 
 * for equitable merit ranking in Junior Colleges.
 */
const BOARD_MULTIPLIERS = {
    CBSE: 1.00,             // Base
    ICSE: 1.02,             // Rigorous
    SSC_Maharashtra: 1.05,  // Strict grading
    SSC_Other_State: 1.03,
    IB: 1.08,               // High rigor
    Cambridge: 1.06
};

/**
 * calculateNormalizedMerit
 * Standardizes scores into a 100-point uniform scale.
 * 
 * @param {number} marks           Raw score (Percentage or CGPA)
 * @param {string} gradingSystem   'percentage' | 'cgpa_10' | 'ib_7'
 * @param {string} board           Board identifier
 * @returns {number}               Normalized percentage (capped at 100)
 */
export function calculateNormalizedMerit(marks, gradingSystem, board) {
    let basePercentage = 0;

    // 1. Standardize marks to 100-point base
    if (gradingSystem === 'percentage') {
        basePercentage = marks;
    } else if (gradingSystem === 'cgpa_10' && board === 'CBSE') {
        basePercentage = marks * 9.5; // CBSE standard conversion
    } else if (gradingSystem === 'ib_7') {
        basePercentage = (marks / 7) * 100;
    } else {
        basePercentage = marks; // Default fallback
    }

    // 2. Apply Normalization Multiplier
    const multiplier = BOARD_MULTIPLIERS[board] || 1.0;
    const normalized = basePercentage * multiplier;

    // 3. Precision & Bounds
    return parseFloat(Math.min(normalized, 100).toFixed(2));
}

export default { calculateNormalizedMerit, BOARD_MULTIPLIERS };
