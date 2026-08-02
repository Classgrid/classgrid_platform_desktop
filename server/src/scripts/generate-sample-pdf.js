import fs from "fs";
import path from "path";
import { generateInvoicePdfBuffer } from "../services/pdf-invoice.service.js";

async function run() {
    const org = {
        name: "Classgrid Demo Institution",
        billing_settings: {
            billing_contact_name: "Demo Admin",
            invoice_email: "demo@classgrid.in",
            phone: "+91 86239 47038",
            address_line1: "Sample Education Campus",
            address_line2: "",
            city: "Pune",
            state: "Maharashtra",
            gstin: ""
        }
    };

    const invoice = {
        invoiceNumber: "CG-DEMOIN-202608",
        status: "SENT",
        createdAt: new Date(),
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        lineItems: [
            // Layer 1: Base Platform Fee
            {
                provider: "classgrid",
                resourceLabel: "Base platform fee",
                totalQuantity: 1,
                unit: "month",
                unitRateInr: 1.00,
                amountInr: 1.00
            },
            // Layer 2: Module Fees
            {
                provider: "classgrid",
                resourceLabel: "Module: Attendance System",
                totalQuantity: 1,
                unit: "month",
                unitRateInr: 0.50,
                amountInr: 0.50
            },
            // Layer 3: Resource Usage
            {
                provider: "cloudflare_r2",
                resourceLabel: "Cloud storage (GB-days)",
                totalQuantity: 1.18,
                unit: "gb_day",
                unitRateInr: 0.16,
                amountInr: 0.19
            }
        ],
        subtotal: 1.69,
        taxPercent: 18,
        taxAmount: 0.31,
        total: 2.00
    };

    console.log("Generating 2 Rupee Sample PDF Invoice via Puppeteer...");
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
