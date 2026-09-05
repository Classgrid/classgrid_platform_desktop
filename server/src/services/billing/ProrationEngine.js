/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

/**
 * ProrationEngine
 * Calculates partial periods for upgrades, downgrades, and cancellations.
 */
class ProrationEngine {
    static calculateProration(monthlyPricePaise, periodStart, periodEnd, effectiveDate) {
        if (monthlyPricePaise <= 0) return 0;

        const totalDays = Math.ceil((periodEnd - periodStart) / (1000 * 60 * 60 * 24));
        const unusedDays = Math.max(0, Math.ceil((periodEnd - effectiveDate) / (1000 * 60 * 60 * 24)));
        
        if (totalDays === 0 || unusedDays === 0) return 0;

        const dailyRate = monthlyPricePaise / totalDays;
        return Math.floor(dailyRate * unusedDays);
    }
}

export default ProrationEngine;
