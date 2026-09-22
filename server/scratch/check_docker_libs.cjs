const { NodeSSH } = require('node-ssh');
const fs = require('fs');

const ssh = new NodeSSH();

async function run() {
  try {
    const keyPath = 'C:\\Users\\nikhi\\Downloads\\Nikhil.pem';
    if (!fs.existsSync(keyPath)) {
        console.log(`Key not found at ${keyPath}`);
        return;
    }
    const key = fs.readFileSync(keyPath, 'utf8');
    
    console.log('Connecting to sandbox server using Nikhil.pem...');
    await ssh.connect({
      host: '13.63.34.197',
      username: 'ubuntu',
      privateKey: key
    });
    console.log('Connected! Checking docker image...');

    // Wait for the build process to release the lock if it's running
    const testCmd = await ssh.execCommand('docker run --rm agent-sandbox-env pip freeze | grep -E "cairosvg|pandas|PyPDF2|Pillow|moviepy|pytesseract"');
    
    if (testCmd.stdout) {
        console.log('\n--- PROOF: LIBRARIES INSTALLED IN DOCKER ---');
        console.log(testCmd.stdout);
        console.log('--------------------------------------------\n');
    } else {
        console.log('Could not find them. The Docker build from earlier might still be running! Here is the output:');
        console.log(testCmd.stderr);
    }
    
  } catch (e) {
    console.error('Error:', e);
  } finally {
    ssh.dispose();
  }
}
run();
