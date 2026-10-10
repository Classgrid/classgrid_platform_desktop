import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const key = process.env.BEDROCK_API_KEY;
    const modelId = "us.anthropic.claude-3-5-sonnet-20241022-v2:0";
    
    console.log("Testing with Bearer Token on model:", modelId);
    
    try {
        const res = await fetch(`https://bedrock-runtime.us-east-1.amazonaws.com/model/${modelId}/converse`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": key,
                "Authorization": `Bearer ${key}`
            },
            body: JSON.stringify({
                messages: [{ role: "user", content: [{ text: "hi" }] }]
            })
        });
        
        const text = await res.text();
        console.log("Status:", res.status);
        console.log("Response:", text);
    } catch (e) {
        console.error(e);
    }
}
main();
