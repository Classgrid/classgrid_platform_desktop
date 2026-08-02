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

    // Generate HTML for the invoice
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Invoice ${invoice.invoiceNumber}</title>
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
                        <div>Invoice: ${invoice.invoiceNumber}</div>
                        <div>Status: ${invoice.status.toUpperCase()}</div>
                    </div>
                    <div class="details">
                        <div><strong>Classgrid Technology</strong></div>
                        <div>support@classgrid.in</div>
                        <div>Date: ${new Date(invoice.createdAt).toLocaleDateString()}</div>
                        <div>Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}</div>
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
                        ${invoice.lineItems.map(item => `
                            <tr>
                                <td>${item.resourceLabel}</td>
                                <td class="right">${item.totalQuantity} ${item.unit}</td>
                                <td class="right">₹${item.unitRateInr.toFixed(2)}</td>
                                <td class="right">₹${item.amountInr.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <table style="width: 50%; margin-left: auto;">
                    <tr>
                        <td>Subtotal:</td>
                        <td class="right">₹${invoice.subtotal.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>GST (${invoice.taxPercent}%):</td>
                        <td class="right">₹${invoice.taxAmount.toFixed(2)}</td>
                    </tr>
                    <tr class="total-row">
                        <td>Total Amount:</td>
                        <td class="right">₹${invoice.total.toFixed(2)}</td>
                    </tr>
                </table>

                <div class="footer">
                    Thank you for your business. For any billing inquiries, please contact support@classgrid.in.
                </div>
            </div>
        </body>
        </html>
    `;

    // Launch puppeteer to generate PDF
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
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
