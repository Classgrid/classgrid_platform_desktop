const fs = require('fs');
let content = fs.readFileSync('server/src/routes/razorpay-webhook.routes.js', 'utf8');

// Generic payment fix
content = content.replace(
    /note: `Webhook: \$\{event\} \| Type: \$\{paymentType\} \| \$\{email \|\| ""\} \| Notes: \$\{JSON\.stringify\(notes \|\| \{\}\)\}`,/,
    `note: \`Webhook: \${event} | Type: \${paymentType} | \${email || ""} | Notes: \${JSON.stringify(notes || {})}\`,
                            userName: notes?.payerName || notes?.userName || "Unknown",
                            userEmail: email || notes?.payerEmail || "",
                            userMobile: contact || notes?.payerPhone || "",
                            userId: notes?.user_id || null,
                            paymentMethod: method || "",
                            paymentTime: paymentEntity?.created_at ? new Date(paymentEntity.created_at * 1000) : new Date(),`
);

// SaaS Invoice fix
content = content.replace(
    /note: `Razorpay webhook: \$\{event\} \| Method: \$\{method\} \| Email: \$\{email\}`,/,
    `note: \`Razorpay webhook: \${event} | Method: \${method} | Email: \${email}\`,
                        userName: notes?.payerName || notes?.userName || "Unknown",
                        userEmail: email || notes?.payerEmail || "",
                        userMobile: contact || notes?.payerPhone || "",
                        userId: notes?.user_id || null,
                        paymentMethod: method || "",
                        paymentTime: paymentEntity?.created_at ? new Date(paymentEntity.created_at * 1000) : new Date(),`
);

fs.writeFileSync('server/src/routes/razorpay-webhook.routes.js', content);
console.log("Done");
