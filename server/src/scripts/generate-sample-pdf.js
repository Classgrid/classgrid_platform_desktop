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
        invoiceNumber: "INV-DEMO-001",
        status: "SENT",
        createdAt: new Date(),
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Due on 5th
        lineItems: [
            {
                provider: "classgrid",
                resourceLabel: "Base platform fee",
                totalQuantity: 1,
                unit: "month",
                unitRateInr: 200.00,
                amountInr: 200.00
            },
            {
                provider: "classgrid",
                resourceLabel: "Module: Fee Management",
                totalQuantity: 1,
                unit: "month",
                unitRateInr: 100.00,
                amountInr: 100.00
            },
            {
                provider: "classgrid",
                resourceLabel: "Active Student Profiles",
                totalQuantity: 200,
                unit: "students",
                unitRateInr: 0.50,
                amountInr: 100.00
            },
            {
                provider: "aws",
                resourceLabel: "Cloud Storage (AWS S3)",
                totalQuantity: 5,
                unit: "GB",
                unitRateInr: 4.746,
                amountInr: 23.73
            }
        ],
        subtotal: 423.73,
        taxPercent: 18,
        taxAmount: 76.27,
        total: 500.00
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
