const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/routes/voice.routes.js');
let content = fs.readFileSync(filePath, 'utf8');

const newCode = `
/**
 * POST /api/voice/transcribe
 * Transcribes audio for dictation (Ask AI Panel) without broadcasting a message
 */
router.post('/transcribe', isAuthenticated, upload.single('audio'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) return res.status(400).json({ error: "No audio file provided" });

        const transcription = await transcribeAudio(file.buffer, file.originalname);

        res.status(200).json({ 
            success: true, 
            text: transcription 
        });

    } catch (err) {
        console.error("[Voice Transcribe Route] Error:", err);
        res.status(500).json({ error: err.message });
    }
});

export default router;`;

content = content.replace('export default router;', newCode);
fs.writeFileSync(filePath, content);
console.log('Done!');
