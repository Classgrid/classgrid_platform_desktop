import { NodeSSH } from 'node-ssh';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

async function buildSandbox() {
    const ssh = new NodeSSH();
    console.log("Connecting to EC2 Sandbox Environment...");
    
    try {
        await ssh.connect({
            host: '13.63.34.197',
            username: process.env.AGENT_USER || 'ubuntu',
            ...(process.env.AGENT_SSH_KEY
                ? { privateKey: process.env.AGENT_SSH_KEY.replace(/\\n/g, '\n') }
                : { password: process.env.AGENT_PASSWORD })
        });
        
        console.log("Connected! Updating Dockerfile on EC2...");
        
        const dockerfileContent = fs.readFileSync('agent-sandbox-env/Dockerfile', 'utf8');
        
        const b64 = Buffer.from(dockerfileContent).toString('base64');
        const updateCmd = `echo "${b64}" | base64 -d > agent-sandbox-env/Dockerfile`;
        await ssh.execCommand(updateCmd);
        
        console.log("Building Docker image. This may take 5-10 minutes...");
        const command = `cd agent-sandbox-env && docker build -t classgrid-ai-sandbox .`;
        
        const result = await ssh.execCommand(command, {
            onStdout(chunk) {
                process.stdout.write(chunk.toString('utf8'));
            },
            onStderr(chunk) {
                process.stderr.write(chunk.toString('utf8'));
            }
        });
        
        console.log("\n--- Build Complete ---");
        console.log("Exit Code:", result.code);
        
        ssh.dispose();
    } catch (e) {
        console.error("SSH Error:", e);
    }
}

buildSandbox();
