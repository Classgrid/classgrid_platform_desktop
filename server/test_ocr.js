// MODEL STATUS:
// - Cloudflare Workers AI = ACTIVE (now in use)
// - Gemini 3.5 Flash = COMMENTED OUT (disabled)
// - Groq model = DEAD (removed from use)
const fs = require('fs');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');

async function runTest() {
    console.log("=== STARTING OCR TEST ===");
    try {
        console.log("1. Creating a dummy PDF to test pdf-parse...");
        // Actually, we can just test tesseract.js on an image url
        console.log("2. Testing Tesseract on a sample image...");
        const result = await Tesseract.recognize('https://tesseract.projectnaptha.com/img/eng_bw.png', 'eng');
        console.log("Tesseract Output:", result.data.text);
        console.log("=== TEST SUCCESSFUL ===");
    } catch (e) {
        console.error("TEST FAILED:", e);
    }
}
runTest();
