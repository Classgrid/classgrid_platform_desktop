import fs from 'fs';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

async function testWhisper() {
    try {
        const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
        const cfToken = process.env.CLOUDFLARE_WORKERS_AI_TOKEN;
        const cfUrl = `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/@cf/openai/whisper-large-v3-turbo`;
        const testAudio = fs.readFileSync('scratch/test.mp3');
        const smallAudio = testAudio.slice(0, 1024 * 1024); 

        // Let's test with application/octet-stream again on the valid MP3!
        // Because earlier I tested with a FAKE WAV file that might have been the reason it failed.
        const response1 = await fetch(cfUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${cfToken}`,
                'Content-Type': 'application/octet-stream'
            },
            body: smallAudio
        });

        console.log("Status with MP3 and octet-stream:", response1.status);
        console.log("Response:", await response1.text());

    } catch (err) {
        console.error(err);
    }
}
testWhisper();
