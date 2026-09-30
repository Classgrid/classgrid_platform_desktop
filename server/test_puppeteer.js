import puppeteer from 'puppeteer';

async function run() {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setContent('<h1>Test PDF</h1><p>It works.</p>');
    const pdfBuffer = await page.pdf({ format: 'A4' });
    await browser.close();
    console.log("PDF generated successfully via puppeteer. Buffer length:", pdfBuffer.length);
}
run();
