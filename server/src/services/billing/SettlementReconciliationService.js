import PaymentSettlement from "../../models/PaymentSettlement.js";
import PaymentTransaction from "../../models/PaymentTransaction.js";

/**
 * SettlementReconciliationService
 * Compares Razorpay settlements to our database and detects mismatches.
 */
class SettlementReconciliationService {
    static async processSettlementWebhook(settlementPayload) {
        // e.g. from Razorpay's settlement.processed webhook
        const providerSettlementId = settlementPayload.id;
        
        let settlement = await PaymentSettlement.findOne({ providerSettlementId });
        if (!settlement) {
            settlement = new PaymentSettlement({
                providerSettlementId,
                merchantOrganizationId: null, // Would need mapping
                amountSettledPaise: settlementPayload.amount,
                feesTotalPaise: settlementPayload.fees,
                taxTotalPaise: settlementPayload.tax,
                currency: settlementPayload.currency,
                utr: settlementPayload.utr,
                settledAt: new Date(settlementPayload.created_at * 1000)
            });
        }
        
        settlement.status = "PROCESSED";
        await settlement.save();

        // Optional: We could parse the breakdown and map to individual PaymentTransactions
        // and update their Settlement Status.
    }
}

export default SettlementReconciliationService;
