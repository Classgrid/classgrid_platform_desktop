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
        status: "DRAFT",
        createdAt: new Date(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        lineItems: [
            {
                resourceLabel: "Classgrid Core ERP Software License (Monthly)",
                totalQuantity: 1,
                unit: "license",
                unitRateInr: 423.73,
                amountInr: 423.73
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
