import fs from 'fs';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

async function testTranscribeTool() {
    try {
        const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
        const cfToken = process.env.CLOUDFLARE_WORKERS_AI_TOKEN;
        
        console.log("Simulating transcribe_audio tool from tools.js...");
        
        // Use a public audio URL (a small MP3 file)
        const fileUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
        console.log(`Fetching audio from URL: ${fileUrl}`);
        
        const audioResponse = await fetch(fileUrl);
        if (!audioResponse.ok) {
          throw new Error(`Failed to fetch audio file from URL. Status: ${audioResponse.status}`);
        }
        
        const mimeType = audioResponse.headers.get('content-type') || 'audio/webm';
        const cleanMime = mimeType.split(';')[0];
        console.log(`Detected MIME Type from headers: ${cleanMime}`);
        
        const audioBuffer = await audioResponse.arrayBuffer();
        
        // Take a slice to prevent timeout (Cloudflare has limits for large files in REST API)
        const slicedBuffer = audioBuffer.slice(0, 1024 * 1024); // First 1MB
        console.log(`Sending ${slicedBuffer.byteLength} bytes to Cloudflare...`);

        // Send to Cloudflare Workers AI Whisper
        const cfUrl = `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/@cf/openai/whisper-large-v3-turbo`;
        const aiResponse = await fetch(cfUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${cfToken}`,
            'Content-Type': cleanMime
          },
          body: slicedBuffer
        });

        if (!aiResponse.ok) {
          const errText = await aiResponse.text();
          throw new Error(`Error from Cloudflare API: ${aiResponse.status} - ${errText}`);
        }

        const aiResult = await aiResponse.json();
        
        if (aiResult.success && aiResult.result && aiResult.result.text) {
          console.log("\n✅ TRANSCRIPTION SUCCESSFUL! ✅\n");
          console.log("Result:", aiResult.result.text);
        } else {
          console.log("\n❌ TRANSCRIPTION FAILED ❌\n");
          console.log(`Unexpected format: ${JSON.stringify(aiResult)}`);
        }
    } catch (err) {
        console.error("\n❌ ERROR OCCURRED ❌\n", err.message);
    }
}
testTranscribeTool();
