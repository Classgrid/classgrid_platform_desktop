import { NodeSSH } from 'node-ssh';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function rebuildSandbox() {
    console.log("🚀 Connecting to AWS EC2 Sandbox...");
    const ssh = new NodeSSH();
    try {
        await ssh.connect({
            host: process.env.AGENT_SANDBOX_HOST || '13.63.34.197',
            username: process.env.AGENT_SANDBOX_USER || 'ubuntu',
            ...(process.env.AGENT_SSH_KEY 
                ? { privateKey: process.env.AGENT_SSH_KEY.replace(/\\n/g, '\n') } 
                : { privateKeyPath: 'C:\\Users\\nikhi\\Downloads\\Nikhil.pem' }),
            tryKeyboard: true,
        });

        console.log("✅ Connected! Updating Dockerfile...");
        
        const updateCmd = `sed -i 's/reportlab/reportlab pymupdf pdfplumber/g' /home/ubuntu/Dockerfile`;
        await ssh.execCommand(updateCmd);
        
        console.log("🐳 Rebuilding Docker image...");
        const buildCmd = `cd /home/ubuntu && sudo docker build -t my-agent-sandbox .`;
        
        const result = await ssh.execCommand(buildCmd, {
            onStdout(chunk) { process.stdout.write(chunk.toString('utf8')); },
            onStderr(chunk) { process.stderr.write(chunk.toString('utf8')); },
        });

        if (result.code === 0) {
            console.log("✅ Docker image rebuilt successfully!");
        } else {
            console.log("❌ Docker build failed.");
        }
    } catch (err) {
        console.error("SSH Error:", err);
    } finally {
        ssh.dispose();
    }
}

rebuildSandbox();

