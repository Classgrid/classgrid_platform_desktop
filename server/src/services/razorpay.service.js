import Razorpay from "razorpay";
import crypto from "crypto";
import Organization from "../models/Organization.js";
import { decrypt } from "../utils/encryption.js";

class RazorpayService {
    getPlatformInstance() {
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keyId || !keySecret) throw new Error("Platform Razorpay keys not configured");
        return new Razorpay({ key_id: keyId, key_secret: keySecret });
    }

    /**
     * Initializes a Razorpay instance for a specific organization
     * @param {string} organizationId 
     * @param {string} moduleName - "fees" or "canteen" (determines which keys to use)
     * @returns {Promise<Razorpay>}
     */
    async getInstance(organizationId, moduleName = "fees") {
        const org = await Organization.findById(organizationId);
        if (!org) throw new Error("Organization not found");

        let keyId, keySecret;

        if (moduleName === "canteen") {
            keyId = org.canteen_config?.canteen_razorpay_key_id;
            keySecret = decrypt(org.canteen_config?.canteen_razorpay_key_secret);
        } else {
            keyId = org.fees_razorpay_key_id;
            keySecret = org.fees_razorpay_key_secret;
        }

        if (!keyId || !keySecret) {
            throw new Error(`Razorpay keys not configured for organization: ${org.name} (Module: ${moduleName})`);
        }

        return new Razorpay({
            key_id: keyId,
            key_secret: keySecret
        });
    }

    /**
     * Creates a Razorpay Order
     */
    async createOrder(organizationId, amount, currency = "INR", receipt = "", moduleName = "fees", notes = {}) {
        return this.createOrderPaise(
            organizationId,
            Math.round(Number(amount) * 100),
            currency,
            receipt,
            moduleName,
            notes
        );
    }

    async createOrderPaise(organizationId, amountPaise, currency = "INR", receipt = "", moduleName = "fees", notes = {}) {
        try {
            if (!Number.isSafeInteger(amountPaise) || amountPaise < 1) {
                throw new Error("Order amount must be a positive integer number of paise");
            }
            const rzp = await this.getInstance(organizationId, moduleName);
            const options = {
                amount: amountPaise,
                currency,
                receipt,
                notes,
                payment_capture: 1
            };
            return await rzp.orders.create(options);
        } catch (error) {
            console.error(`[Razorpay] Create Order Error for Org ${organizationId}:`, error);
            throw new Error(`Failed to create payment order: ${error.message}`);
        }
    }

    /**
     * Verifies the Razorpay Signature
     */
    async verifySignature(organizationId, orderId, paymentId, signature, moduleName = "fees") {
        try {
            const org = await Organization.findById(organizationId);
            if (!org) return false;
            
            let secret;
            if (moduleName === "canteen") {
                secret = decrypt(org.canteen_config?.canteen_razorpay_key_secret);
            } else {
                secret = org.fees_razorpay_key_secret;
            }
            if (!secret) return false;

            const generatedSignature = crypto
                .createHmac("sha256", secret)
                .update(`${orderId}|${paymentId}`)
                .digest("hex");

            const expected = Buffer.from(generatedSignature, "hex");
            const received = Buffer.from(String(signature), "hex");
            return expected.length === received.length && crypto.timingSafeEqual(expected, received);
        } catch (error) {
            console.error(`[Razorpay] Signature Verification Error for Org ${organizationId}:`, error);
            return false;
        }
    }

    /**
     * Verifies Webhook Signature
     */
    async verifyWebhookSignature(organizationId, body, signature, moduleName = "fees") {
        try {
            const org = await Organization.findById(organizationId);
            
            let webhookSecret;
            if (moduleName === "canteen") {
                webhookSecret = decrypt(org.canteen_config?.canteen_razorpay_webhook_secret);
            } else {
                webhookSecret = org.fees_razorpay_webhook_secret;
            }

            if (!webhookSecret) {
                console.warn(`[Razorpay] Webhook secret not configured for Org ${organizationId}`);
                return false;
            }

            let payload;
            if (Buffer.isBuffer(body)) {
                payload = body;
            } else if (typeof body === "string") {
                payload = body;
            } else {
                payload = JSON.stringify(body);
            }

            const expectedSignature = crypto
                .createHmac("sha256", webhookSecret)
                .update(payload)
                .digest("hex");

            return expectedSignature === signature;
        } catch (error) {
            console.error(`[Razorpay] Webhook Signature Error:`, error);
            return false;
        }
    }
    /**
     * Creates a Platform Order (Platform Subscription Fee) using primary keys
     */
    async createPlatformOrder(amount, receipt = "") {
        return this.createPlatformOrderPaise(Math.round(Number(amount) * 100), receipt);
    }

    async createPlatformOrderPaise(amountPaise, receipt = "", notes = {}) {
        try {
            if (!Number.isSafeInteger(amountPaise) || amountPaise < 1) {
                throw new Error("Order amount must be a positive integer number of paise");
            }
            const rzp = this.getPlatformInstance();
            const options = {
                amount: amountPaise,
                currency: "INR",
                receipt,
                notes,
                payment_capture: 1
            };

            return await rzp.orders.create(options);
        } catch (error) {
            console.error(`[Razorpay] Create Platform Order Error:`, error);
            throw new Error(`Failed to create platform payment order: ${error.message}`);
        }
    }

    /**
     * Verifies Platform Payment Signature
     */
    verifyPlatformSignature(orderId, paymentId, signature) {
        try {
            const secret = process.env.RAZORPAY_KEY_SECRET;
            if (!secret) return false;

            const generatedSignature = crypto
                .createHmac("sha256", secret)
                .update(`${orderId}|${paymentId}`)
                .digest("hex");

            const expected = Buffer.from(generatedSignature, "hex");
            const received = Buffer.from(String(signature), "hex");
            return expected.length === received.length && crypto.timingSafeEqual(expected, received);
        } catch (error) {
            console.error(`[Razorpay] Platform Signature Verification Error:`, error);
            return false;
        }
    }

    async fetchPayment(organizationId, paymentId, moduleName = "fees") {
        const instance = await this.getInstance(organizationId, moduleName);
        return instance.payments.fetch(paymentId);
    }

    async fetchPlatformPayment(paymentId) {
        return this.getPlatformInstance().payments.fetch(paymentId);
    }
}

export default new RazorpayService();
