import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

async function testImg2Img() {
    const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const cfToken = process.env.CLOUDFLARE_WORKERS_AI_TOKEN;

    if (!cfAccountId || !cfToken) {
        console.error("Missing Cloudflare credentials in .env");
        return;
    }

    console.log("1. Fetching a source image (512x512)...");
    const sourceImageUrl = "https://picsum.photos/512";
    const imgRes = await fetch(sourceImageUrl);
    if (!imgRes.ok) {
        console.error("Failed to fetch source image:", imgRes.status);
        return;
    }
    
    const arrayBuffer = await imgRes.arrayBuffer();
    const imageArray = [...new Uint8Array(arrayBuffer)];
    
    console.log(`Successfully fetched image. Size: ${imageArray.length} bytes.`);
    console.log("2. Sending request to Cloudflare @cf/runwayml/stable-diffusion-v1-5-img2img...");

    const cfUrl = `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/@cf/runwayml/stable-diffusion-v1-5-img2img`;
    
    const startTime = Date.now();
    const cfApiRes = await fetch(cfUrl, {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${cfToken}`, 
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
            prompt: "Make it look like a futuristic cyberpunk city, neon lights", 
            image: imageArray, 
            strength: 0.5, 
            guidance: 7.5, 
            num_steps: 20 
        })
    });

    if (!cfApiRes.ok) {
        const errTxt = await cfApiRes.text();
        console.error(`❌ Cloudflare API Error: ${cfApiRes.status} ${errTxt}`);
        return;
    }

    const buffer = await cfApiRes.arrayBuffer();
    console.log(`✅ Success! Received response in ${Date.now() - startTime}ms. Output image size: ${buffer.byteLength} bytes.`);
}

testImg2Img();
