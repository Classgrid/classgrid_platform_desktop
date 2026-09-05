/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

export const generateInvoicePdfBuffer = async (invoice, org) => {
    let logoSrc = 'https://classgrid.in/logo.png';
    try {
        const localLogoPath = path.resolve(process.cwd(), '../client/public/logo.png');
        if (fs.existsSync(localLogoPath)) {
            logoSrc = 'data:image/png;base64,' + fs.readFileSync(localLogoPath).toString('base64');
        }
    } catch (e) {
        console.error("Failed to load local logo for PDF", e);
    }

    // Normalize invoice amounts (handle SaasInvoice Mongoose schema which uses Paise)
    const normalizedInvoice = {
        ...invoice,
        subtotal: invoice.subtotal !== undefined ? invoice.subtotal : (invoice.subtotalPaise || 0) / 100,
        taxPercent: invoice.taxPercent || 18,
        taxAmount: invoice.taxAmount !== undefined ? invoice.taxAmount : (invoice.taxAmountPaise || 0) / 100,
        total: invoice.total !== undefined ? invoice.total : (invoice.totalAmountPaise || 0) / 100,
        lineItems: (invoice.lineItems || []).map(item => ({
            ...item,
            unitRateInr: item.unitRateInr !== undefined ? item.unitRateInr : (item.unitRatePaise || 0) / 100,
            amountInr: item.amountInr !== undefined ? item.amountInr : (item.amountPaise || 0) / 100,
        }))
    };

    // Generate HTML for the invoice
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Invoice ${normalizedInvoice.invoiceNumber}</title>
            <style>
                body { font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; color: #333; margin: 0; padding: 40px; }
                .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, .15); }
                .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 20px; }
                .title { font-size: 32px; font-weight: bold; color: #2563eb; }
                .details { text-align: right; }
                .bill-to { margin-bottom: 30px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
                th { background-color: #f9fafb; font-weight: bold; }
                .right { text-align: right; }
                .total-row { font-weight: bold; font-size: 18px; }
                .footer { text-align: center; color: #777; font-size: 12px; margin-top: 50px; border-top: 1px solid #eee; padding-top: 20px; }
            </style>
        </head>
        <body>
            <div class="invoice-box">
                <div class="header">
                    <div>
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 15px;">
                            <img src="${logoSrc}" alt="Classgrid Logo" style="height: 48px; width: auto; object-fit: contain;" onerror="this.onerror=null; this.src='https://billing.classgrid.in/logo.png';"/>
                            <div class="title" style="margin: 0; font-size: 28px;">Classgrid ERP</div>
                        </div>
                        <div>Invoice: ${normalizedInvoice.invoiceNumber}</div>
                        <div>Status: ${(normalizedInvoice.status || 'SENT').toUpperCase()}</div>
                    </div>
                    <div class="details">
                        <div><strong>Classgrid Technology</strong></div>
                        <div>support@classgrid.in</div>
                        <div>Date: ${new Date(normalizedInvoice.createdAt || Date.now()).toLocaleDateString()}</div>
                        <div>Due Date: ${new Date(normalizedInvoice.dueDate || Date.now()).toLocaleDateString()}</div>
                    </div>
                </div>

                <div class="bill-to">
                    <h3>Bill To:</h3>
                    <div><strong>${org.name}</strong></div>
                    <div>${org.billing_settings?.billing_contact_name || ''}</div>
                    <div>${org.billing_settings?.invoice_email || org.email || ''}</div>
                    <div>${org.billing_settings?.phone || ''}</div>
                    <div>${org.billing_settings?.address_line1 || ''}</div>
                    <div>${org.billing_settings?.city ? org.billing_settings.city + ',' : ''} ${org.billing_settings?.state || ''}</div>
                    <div>${org.billing_settings?.gstin ? 'GSTIN: ' + org.billing_settings.gstin : ''}</div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Resource Description</th>
                            <th class="right">Usage</th>
                            <th class="right">Rate</th>
                            <th class="right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${normalizedInvoice.lineItems.length > 0 ? normalizedInvoice.lineItems.map(item => `
                            <tr>
                                <td>${item.resourceLabel || 'Base Platform Fee'}</td>
                                <td class="right">${item.totalQuantity || 1} ${item.unit || 'unit'}</td>
                                <td class="right">₹${(item.unitRateInr || 0).toFixed(2)}</td>
                                <td class="right">₹${(item.amountInr || 0).toFixed(2)}</td>
                            </tr>
                        `).join('') : `
                            <tr>
                                <td>Classgrid Demo Invoice</td>
                                <td class="right">1 unit</td>
                                <td class="right">₹${normalizedInvoice.subtotal.toFixed(2)}</td>
                                <td class="right">₹${normalizedInvoice.subtotal.toFixed(2)}</td>
                            </tr>
                        `}
                    </tbody>
                </table>

                <table style="width: 50%; margin-left: auto;">
                    <tr>
                        <td>Subtotal:</td>
                        <td class="right">₹${normalizedInvoice.subtotal.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>GST (${normalizedInvoice.taxPercent}%):</td>
                        <td class="right">₹${normalizedInvoice.taxAmount.toFixed(2)}</td>
                    </tr>
                    <tr class="total-row">
                        <td>Total Amount:</td>
                        <td class="right">₹${normalizedInvoice.total.toFixed(2)}</td>
                    </tr>
                </table>

                <div class="footer">
                    Thank you for your business. For any billing inquiries, please contact support@classgrid.in.
                </div>
            </div>
        </body>
        </html>
    `;

    const browser = await puppeteer.launch({
        headless: "new",
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
    });
    
    await browser.close();
    
    return pdfBuffer;
};
