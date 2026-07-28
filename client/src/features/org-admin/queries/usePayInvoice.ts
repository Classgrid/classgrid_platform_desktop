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
          handler: async (response: any) => {
            try {
              // Step 3: Verify payment
              const verifyRes = await apiClient.post("/api/org-admin/dashboard/billing/razorpay-verify", {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                invoiceId,
              });
              resolve(verifyRes.data);
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
