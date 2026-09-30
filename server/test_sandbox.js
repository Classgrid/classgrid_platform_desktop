async function testSandbox() {
    const sandboxUrl = 'https://autumn-sky-3042.nikhil-shinde-6b9.workers.dev';
    
    console.log("Testing Cloudflare Sandbox Execution...");
    try {
        const response = await fetch(sandboxUrl, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer classgrid-super-secret-key-2026'
            },
            body: JSON.stringify({ 
                action: 'run_code', 
                language: 'python', 
                code: 'print("Testing 123... The AI Sandbox is ALIVE!")' 
            })
        });
        
        const result = await response.json();
        console.log("Sandbox Response:");
        console.log(result);
    } catch (e) {
        console.error("Test failed:", e);
    }
}

testSandbox();
