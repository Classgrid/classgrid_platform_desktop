import { config } from 'dotenv';
config();

import { handleToolCall } from './src/mcp/tools.js';

async function testSandbox() {
    console.log("🚀 Demonstrating Sandbox Environment Variable Access...");

    const pythonCode = `
import os
print("=== LIVE SANDBOX DEMONSTRATION ===")
print("Can I access the MongoDB URI?", os.environ.get("MONGO_URI", "NOT FOUND")[:30] + "...")
print("Can I access the Razorpay Secret?", os.environ.get("RAZORPAY_KEY_SECRET", "NOT FOUND")[:5] + "...")
print("Can I access the AWS SES Password?", os.environ.get("AWS_SES_SMTP_PASS", "NOT FOUND")[:5] + "...")
print("==================================")
`;

    const result = await handleToolCall('run_code', {
        language: 'python',
        code: pythonCode
    }, {
        sessionId: 'demo-test-123',
        userEmail: 'demo@classgrid.in'
    });

    console.log("\n✅ RESULT FROM SANDBOX:");
    console.log(result.content[0].text);
}

testSandbox().catch(console.error);
