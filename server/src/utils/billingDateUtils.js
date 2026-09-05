/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

/**
 * billingDateUtils.js
 * Centralizes date arithmetic for subscriptions, ensuring all billing cycles strictly operate in UTC at 00:00:00 boundary.
 */

/**
 * Returns the current date forced to UTC 00:00:00 for stable daily billing calculations.
 * @returns {Date}
 */
export function getBillingToday() {
    const today = new Date();
    return new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
}

/**
 * Calculates the end date of a billing cycle given the start date and cycle type.
 * @param {Date} startDate 
 * @param {string} cycle - "MONTHLY", "QUARTERLY", "BIANNUAL", "ANNUAL"
 * @returns {Date}
 */
export function calculateCycleEndDate(startDate, cycle) {
    const end = new Date(startDate);
    switch (cycle) {
        case "MONTHLY":
            end.setUTCMonth(end.getUTCMonth() + 1);
            break;
        case "QUARTERLY":
            end.setUTCMonth(end.getUTCMonth() + 3);
            break;
        case "BIANNUAL":
            end.setUTCMonth(end.getUTCMonth() + 6);
            break;
        case "ANNUAL":
            end.setUTCFullYear(end.getUTCFullYear() + 1);
            break;
        default:
            end.setUTCMonth(end.getUTCMonth() + 1);
    }
    return end;
}

/**
 * Computes the remaining days in a billing period for proration calculations.
 * @param {Date} current 
 * @param {Date} end 
 * @returns {number} Integer number of days remaining
 */
export function getDaysRemaining(current, end) {
    const diffTime = end.getTime() - current.getTime();
    if (diffTime <= 0) return 0;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Computes total days in a period.
 * @param {Date} start 
 * @param {Date} end 
 * @returns {number}
 */
export function getTotalPeriodDays(start, end) {
    const diffTime = end.getTime() - start.getTime();
    if (diffTime <= 0) return 1; // Prevent division by zero
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
