import { handleToolCall } from './src/mcp/tools.js';

async function runTest() {
    console.log("🚀 Testing New AWS Sandbox Server via SSH Tunnel...");
    
    // Test 1: Python Execution
    console.log("\n--- TEST 1: Python Execution ---");
    const result1 = await handleToolCall('run_code', { 
        language: 'python', 
        code: 'import sys\nprint(f"Hello from AWS Python Sandbox! Python Version: {sys.version}")' 
    });
    console.log(result1.content[0].text);
    
    // Test 2: Terminal Command & Shared /data Folder
    console.log("\n--- TEST 2: Terminal Bash & Shared /data Persistence ---");
    // This creates a file in the shared /data folder, lists it, and reads it.
    const result2 = await handleToolCall('execute_terminal_command', { 
        command: 'echo "I am a persistent file saved by the AI" > /data/ai_memory.txt && ls -l /data && cat /data/ai_memory.txt' 
    });
    console.log(result2.content[0].text);
}

runTest();
