import PDFDocument from 'pdfkit';
import fs from 'fs';

const doc = new PDFDocument();
doc.pipe(fs.createWriteStream('test_pdfkit.pdf'));
doc.fontSize(25).text('Hello from PDFKit!', 100, 100);
doc.end();
console.log('PDF Generated');
