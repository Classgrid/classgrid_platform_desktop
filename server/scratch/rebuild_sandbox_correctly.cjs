const { NodeSSH } = require('node-ssh');
const fs = require('fs');
require('dotenv').config();

const ssh = new NodeSSH();

async function run() {
  try {
    const key = process.env.AGENT_SSH_KEY.replace(/\\n/g, '\n');
    console.log('Connecting to sandbox server...');
    
    await ssh.connect({
      host: '13.63.34.197',
      username: 'ubuntu',
      privateKey: key
    });
    console.log('Connected! Building my-agent-sandbox...');

    // Since we created agent-sandbox-env/Dockerfile earlier, let's just build it and tag it correctly
    const buildResult = await ssh.execCommand('cd ~/agent-sandbox-env && docker build -t my-agent-sandbox .');
    console.log('Build finished!');
    
    // Test if cairosvg is installed
    const testResult = await ssh.execCommand('docker run --rm my-agent-sandbox python -c "import cairosvg; print(\\"Successfully imported cairosvg!\\")"');
    console.log('TEST STDOUT:', testResult.stdout);
    if (testResult.stderr) console.log('TEST STDERR:', testResult.stderr);

  } catch (e) {
    console.error('Error:', e);
  } finally {
    ssh.dispose();
  }
}
run();
