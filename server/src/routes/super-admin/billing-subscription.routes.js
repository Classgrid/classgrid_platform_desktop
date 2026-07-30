import express from "express";
import * as Controller from "../../controllers/super-admin/billing-subscription.controller.js";

const router = express.Router();

router.get("/subscriptions", Controller.listSubscriptions);
router.get("/subscriptions/overview", Controller.getSubscriptionOverview);
router.get("/subscriptions/:organizationId", Controller.getSubscription);

router.post("/subscriptions/:organizationId/preview", Controller.previewSubscriptionChange);
router.post("/subscriptions/:organizationId/assign-plan", Controller.assignPlan);
router.post("/subscriptions/:organizationId/change-plan", Controller.changePlan);
router.post("/subscriptions/:organizationId/add-module", Controller.addModule);
router.post("/subscriptions/:organizationId/remove-module", Controller.removeModule);
router.post("/subscriptions/:organizationId/change-cycle", Controller.changeBillingCycle);
router.post("/subscriptions/:organizationId/pause", Controller.pauseSubscription);
router.post("/subscriptions/:organizationId/resume", Controller.resumeSubscription);
router.post("/subscriptions/:organizationId/cancel", Controller.cancelSubscription);

router.get("/subscriptions/:organizationId/history", Controller.getSubscriptionHistory);
router.get("/subscriptions/:organizationId/upcoming-invoice", Controller.getUpcomingInvoice);

export default router;
