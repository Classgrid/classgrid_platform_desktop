/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import PricingEngine from "../../services/billing/PricingEngine.js";
import OrganizationPriceOverride from "../../models/OrganizationPriceOverride.js";
import PlanModule from "../../models/PlanModule.js";

jest.mock("../../models/OrganizationPriceOverride.js");
jest.mock("../../models/PlanModule.js");

describe("PricingEngine", () => {
    it("should prioritize Organization Override over Plan Module", async () => {
        // Mock Org Override finding a match
        OrganizationPriceOverride.findOne.mockReturnValue({
            sort: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue({
                    monthlyPricePaise: 40000,
                    annualPricePaise: 400000,
                    includedQuantity: 0
                })
            })
        });

        const result = await PricingEngine.resolveModulePrice("org1", "planV1", "modV1", 50000, 500000, "MONTHLY");

        expect(result.amountPaise).toBe(40000);
        expect(result.source).toBe("ORGANIZATION_OVERRIDE");
    });
});
