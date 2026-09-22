import 'dotenv/config';

async function test() {
    const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const cfToken = process.env.CLOUDFLARE_WORKERS_AI_TOKEN;
    const cfUrl = `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/@cf/black-forest-labs/flux-1-schnell`;
    
    try {
        console.log("Sending request to:", cfUrl);
        const imageRes = await fetch(cfUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${cfToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt: "a boy" })
        });
        
        console.log("Status:", imageRes.status);
        console.log("Headers:", imageRes.headers.get('content-type'));
        
        if (imageRes.headers.get('content-type')?.includes('application/json')) {
            const json = await imageRes.json();
            console.log("Response JSON:", JSON.stringify(json).substring(0, 500));
        } else {
            console.log("Received binary data.");
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
