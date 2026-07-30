/**
 * moneyUtils.js
 * Utility functions for handling currency in strict integer paise.
 * ALL financial calculations must be done using these functions to prevent floating point errors.
 */

/**
 * Converts INR (rupees) to paise (integer)
 * @param {number|string} rupees 
 * @returns {number} Integer paise
 */
export function rupeesToPaise(rupees) {
    const num = parseFloat(rupees);
    if (isNaN(num)) return 0;
    return Math.round(num * 100);
}

/**
 * Converts paise (integer) to INR (rupees)
 * @param {number} paise 
 * @returns {number} Float rupees
 */
export function paiseToRupees(paise) {
    const num = parseInt(paise, 10);
    if (isNaN(num)) return 0;
    return num / 100;
}

/**
 * Formats paise as an INR currency string (e.g. ₹1,200.50)
 * @param {number} paise 
 * @returns {string} Formatted string
 */
export function formatPaise(paise) {
    const rupees = paiseToRupees(paise);
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(rupees);
}

/**
 * Calculates a percentage of a paise amount, rounding safely to nearest integer paise.
 * @param {number} paiseAmount 
 * @param {number} percentage (e.g., 18 for 18% GST)
 * @returns {number} Integer paise
 */
export function calculatePercentage(paiseAmount, percentage) {
    const amt = parseInt(paiseAmount, 10);
    const pct = parseFloat(percentage);
    if (isNaN(amt) || isNaN(pct)) return 0;
    return Math.round((amt * pct) / 100);
}

/**
 * Validates that an amount is a strict integer (valid paise representation).
 * @param {any} amount 
 * @returns {boolean}
 */
export function isIntegerPaise(amount) {
    return Number.isInteger(amount);
}
