import express from "express";
import * as globalController from "../../controllers/super-admin/ai-usage-global.controller.js";
import * as orgController from "../../controllers/super-admin/ai-usage-orgs.controller.js";
import * as userController from "../../controllers/super-admin/ai-usage-users.controller.js";
import * as adminController from "../../controllers/super-admin/ai-credits-admin.controller.js";

const router = express.Router();

/**
 * PHASE 10: Super Admin AI Usage & Credits Routes
 * Mounted at: /api/super-admin/ai-usage
 * These routes are protected by Super Admin middleware.
 */

// 1. Global (Level 0)
router.get("/global/stats", globalController.getGlobalStats);
router.get("/global/models", globalController.getModelBreakdown);

// 2. Organizations (Level 1)
router.get("/orgs", orgController.listOrgsWithAiUsage);
router.get("/orgs/:orgId/detail", orgController.getOrgAiDetail);

// 3. Roles/Users (Level 2 & 3)
router.get("/orgs/:orgId/users", userController.listUsersInOrg);
router.get("/users/:userId/detail", userController.getUserAiDetail);

// 4. Admin Mutations
router.put("/users/:userId/block", adminController.blockAiUser);
router.put("/orgs/:orgId/block", adminController.blockAiOrg);
router.post("/users/:userId/reset", adminController.resetUserUsage);
router.post("/orgs/:orgId/reset", adminController.resetOrgUsage);
router.put("/orgs/:orgId/limits", adminController.updateOrgAiLimits);
router.post("/users/:userId/grant", adminController.grantCredits);
router.post("/users/:userId/credits/remove", adminController.removeGrantedCredits);
router.post("/users/:userId/credits/pause", adminController.pauseGrantedCredits);
router.post("/orgs/:orgId/grant", adminController.grantOrgCredits);
router.delete("/users/:userId/data", adminController.deleteUserAiData);

router.get("/global/granted-credits", globalController.listActiveGrantedCredits);

// 5. Security / OTP
router.post("/security-code/request", adminController.requestSecurityCode);
router.post("/security-code/verify", adminController.verifySecurityCode);

export default router;
