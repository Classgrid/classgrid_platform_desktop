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

import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export function usePayInvoice() {
  return useMutation({
    mutationFn: async (invoiceId: string) => {
      // Step 1: Create Razorpay order
      const orderRes = await apiClient.post("/api/org-admin/dashboard/billing/razorpay-order", { invoiceId });
      const { key_id, order_id, amount, currency } = orderRes.data;
      
      // Step 2: Open Razorpay checkout
      return new Promise((resolve, reject) => {
        const options = {
          key: key_id,
          amount,
          currency,
          order_id,
          name: "Classgrid",
          description: "Platform Invoice Payment",
          image: "https://billing.classgrid.in/logo.png",
          handler: async (response: any) => {
            try {
              // Step 3: Verify payment
              try {
                const verifyRes = await apiClient.post("/api/org-admin/dashboard/billing/razorpay-verify", {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  invoiceId,
                });
                resolve(verifyRes.data);
              } catch (verifyError: any) {
                // Return the specific error message from the backend if it exists
                reject(new Error(verifyError.response?.data?.message || "Payment verification failed"));
              }
            } catch (error) {
              reject(error);
            }
          },
          modal: { 
            ondismiss: () => reject(new Error("Payment cancelled by user")) 
          },
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      });
    },
  });
}
