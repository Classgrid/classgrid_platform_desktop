const fs = require('fs');
let content = fs.readFileSync('server/src/routes/razorpay-webhook.routes.js', 'utf8');

const failedTarget = `                await PlatformTransaction.create({
                    organizationId: organizationId || null,
                    type: "razorpay",
                    amount: amountInr,
                    status: "failed",
                    razorpayOrderId: orderId,
                    razorpayPaymentId: paymentId,
                    note: \`FAILED: \${error_code} — \${error_description}\`,
                    userName: notes?.payerName || notes?.userName || "Unknown",
                    userEmail: paymentEntity.email || "",
                    userMobile: paymentEntity.contact || "",
                    paymentMethod: paymentEntity.method || "",
                    paymentTime: paymentEntity.created_at ? new Date(paymentEntity.created_at * 1000) : new Date(),
                });`;

const failedReplacement = `                let resolvedUserName = notes?.payerName || notes?.userName || "Unknown";
                let resolvedUserEmail = paymentEntity.email || notes?.payerEmail || "";
                let resolvedUserMobile = paymentEntity.contact || notes?.payerPhone || "";
                let resolvedUserId = notes?.user_id || null;

                if (resolvedUserId) {
                    try {
                        const User = (await import("../models/User.js")).default;
                        const user = await User.findById(resolvedUserId).select("name email phoneNumber");
                        if (user) {
                            if (resolvedUserName === "Unknown") resolvedUserName = user.name || "Unknown";
                            if (!resolvedUserEmail) resolvedUserEmail = user.email || "";
                            if (!resolvedUserMobile) resolvedUserMobile = user.phoneNumber || "";
                        }
                    } catch (e) {
                        console.error("[Razorpay Webhook] User lookup failed for failed payment:", e);
                    }
                }

                await PlatformTransaction.create({
                    organizationId: organizationId || null,
                    type: "razorpay",
                    amount: amountInr,
                    status: "failed",
                    razorpayOrderId: orderId,
                    razorpayPaymentId: paymentId,
                    note: \`FAILED: \${error_code} — \${error_description}\`,
                    userName: resolvedUserName,
                    userEmail: resolvedUserEmail,
                    userMobile: resolvedUserMobile,
                    userId: resolvedUserId,
                    paymentMethod: paymentEntity.method || "",
                    paymentTime: paymentEntity.created_at ? new Date(paymentEntity.created_at * 1000) : new Date(),
                });`;

if (content.includes(failedTarget)) {
    content = content.replace(failedTarget, failedReplacement);
    fs.writeFileSync('server/src/routes/razorpay-webhook.routes.js', content);
    console.log("Replaced failed block.");
} else {
    console.log("Target not found!");
}
