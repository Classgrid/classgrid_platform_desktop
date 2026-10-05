# AI Credits Bug Verification & Fallback Plan

This document tracks the specific claims made regarding the recent fixes to the AI Credits system. If testing reveals that any of these claims fail, the fallback plans below will be immediately implemented.

## 1. Issue: "Adding a new grant makes an old exhausted grant show as ACTIVE again"
* **My Claim:** Fixed. The frontend "waterfall" logic walks oldest-first. If you use 5,000 credits, the oldest 5,000 credit grant will permanently show as `EXHAUSTED`. New grants added on top will show as `ACTIVE` and will not revive the exhausted ones.
* **How to Verify:** Look at the user's list. The old 5,000 grant must say `EXHAUSTED`. The new 10,000 grant must say `ACTIVE`.
* **Fallback Fix if False:** If the old grant revives, it means `usedBudget` in `AiUserDetailPanel.tsx` is calculating to 0 for that row. We will fix it by strictly locking the `EXHAUSTED` state to a hardcoded property on the transaction object during the backend cron job or DB save, instead of calculating it dynamically in the UI waterfall.

## 2. Issue: "Pausing or Revoking ONE row causes ALL rows to show as Paused/Revoked"
* **My Claim:** Fixed. The system no longer uses the global `promotion_credits_paused` or `promotion_credits_revoked` boolean flags on the User profile. It now sets `status: 'paused'` or `status: 'revoked'` on the exact `AiCreditTransaction` document.
* **How to Verify:** Click Revoke on a single row. Only that row should turn red. Click Pause on another row. Only that row should turn yellow.
* **Fallback Fix if False:** If all rows still change color, it means the frontend is still defaulting to reading a global state somewhere. We will strip out lines 491-502 in `AiUserDetailPanel.tsx` and strictly pass the `row.status` directly down into the `ViewGrantedCreditsDetails` and action button components.

## 3. Issue: "Unpausing a paused grant causes it to instantly show as EXHAUSTED"
* **My Claim:** Fixed. When a grant is paused, its credits are subtracted from BOTH `promotion_credits_balance` and `total_promotion_credits_granted`. When unpaused, it adds them back to BOTH fields. The frontend waterfall math now correctly ignores paused/revoked grants, so when you unpause, the math perfectly aligns and it shows as `ACTIVE`.
* **How to Verify:** Pause an active 5,000 grant. The total issued goes down by 5,000. Unpause it. The total issued goes up by 5,000, and the row says `ACTIVE`.
* **Fallback Fix if False:** If it shows `EXHAUSTED`, it means the backend `$inc` logic in `ai-credits-admin.controller.js` failed to update `total_promotion_credits_granted`. We will fix it by forcing a manual recalculation loop in the backend controller that forcefully overrides the balance integers by aggressively summing up all `status="success"` rows on every save.

## 4. Issue: "Adding new Paid Top-Ups revives exhausted/expired promo grants"
* **My Claim:** Fixed. Paid top-ups are added strictly to `ai_credits_balance`. Promo grants belong to `promotion_credits_balance`. The waterfall logic in the Promo Grants table strictly filters by `type: 'grant'`. Top-ups cannot interfere with promo math.
* **How to Verify:** Buy ₹1 worth of tokens. The Top-Up history will show it. The Promo Grants table will remain completely unchanged.
* **Fallback Fix if False:** If promo rows change, it means the frontend is accidentally injecting `ai_credits_balance` into the `remaining` calculation for promos. We will isolate the state slices in `AiCreditsPanel.tsx` to strictly prevent cross-pool bleeding.

---
**Timestamp:** 2026-10-04 21:46 IST
**Next Step:** User will verify on the deployed production instance. If any item fails, reference this document to execute the fallback plan.
