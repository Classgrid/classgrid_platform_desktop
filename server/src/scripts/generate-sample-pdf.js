import fs from "fs";
import path from "path";
import { generateInvoicePdfBuffer } from "../services/pdf-invoice.service.js";

async function run() {
    const org = {
        name: "Demo International School",
        email: "admin@demo-school.com",
        billing_settings: {
            billing_contact_name: "Principal Sharma",
            phone: "+91 9876543210",
            address_line1: "123 Education Hub, Sector 4",
            city: "Bangalore",
            state: "Karnataka",
            gstin: "29AABCU9603R1ZJ"
        }
    };

    const invoice = {
        invoiceNumber: "CG-DEMOIN-202608",
        status: "SENT",
        createdAt: new Date(),
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        lineItems: [
            // Layer 1: Base Platform Fee (from OrgSubscription.billing.basePricePerMonth)
            {
                provider: "classgrid",
                resourceLabel: "Base platform fee",
                totalQuantity: 1,
                unit: "month",
                unitRateInr: 99.00,
                amountInr: 99.00
            },
            // Layer 2: Module Fees (from OrgSubscription.billing.modulePrices per active feature_flag)
            {
                provider: "classgrid",
                resourceLabel: "Module: Attendance System",
                totalQuantity: 1,
                unit: "month",
                unitRateInr: 30.00,
                amountInr: 30.00
            },
            {
                provider: "classgrid",
                resourceLabel: "Module: Fee Collection System",
                totalQuantity: 1,
                unit: "month",
                unitRateInr: 40.00,
                amountInr: 40.00
            },
            {
                provider: "classgrid",
                resourceLabel: "Module: Admission Management",
                totalQuantity: 1,
                unit: "month",
                unitRateInr: 40.00,
                amountInr: 40.00
            },
            {
                provider: "classgrid",
                resourceLabel: "Module: Digital Classroom Management",
                totalQuantity: 1,
                unit: "month",
                unitRateInr: 25.00,
                amountInr: 25.00
            },
            {
                provider: "classgrid",
                resourceLabel: "Module: Online Exam Platform",
                totalQuantity: 1,
                unit: "month",
                unitRateInr: 25.00,
                amountInr: 25.00
            },
            // Layer 3: Resource Usage (from OrganizationUsageDaily aggregation)
            {
                provider: "cloudflare_r2",
                resourceLabel: "Cloud storage (GB-days)",
                totalQuantity: 45.2,
                unit: "gb_day",
                unitRateInr: 0.16,
                amountInr: 7.23
            },
            {
                provider: "aws_ses",
                resourceLabel: "Transactional emails sent",
                totalQuantity: 312,
                unit: "email",
                unitRateInr: 0.05,
                amountInr: 15.60
            },
            {
                provider: "aws_sns",
                resourceLabel: "SMS notifications sent",
                totalQuantity: 87,
                unit: "sms",
                unitRateInr: 0.25,
                amountInr: 21.75
            },
            {
                provider: "openai",
                resourceLabel: "AI assistant tokens consumed",
                totalQuantity: 48500,
                unit: "token",
                unitRateInr: 0.00025,
                amountInr: 12.13
            },
            {
                provider: "agora",
                resourceLabel: "Live class participant-minutes",
                totalQuantity: 540,
                unit: "minute",
                unitRateInr: 0.02,
                amountInr: 10.80
            },
            {
                provider: "ec2",
                resourceLabel: "API requests served",
                totalQuantity: 95400,
                unit: "request",
                unitRateInr: 0.0001,
                amountInr: 9.54
            }
        ],
        subtotal: 336.05,
        taxPercent: 18,
        taxAmount: 60.49,
        total: 396.54
    };

    console.log("Generating 500 Rupee Sample PDF Invoice via Puppeteer...");
    const pdfBuffer = await generateInvoicePdfBuffer(invoice, org);
    
    // Write to client/public
    const outPath = path.resolve(process.cwd(), "../client/public/sample-invoice.pdf");
    fs.writeFileSync(outPath, pdfBuffer);
    
    console.log("Success! Saved sample invoice to:", outPath);
    process.exit(0);
}

run().catch(err => {
    console.error("Error generating invoice:", err);
    process.exit(1);
});
