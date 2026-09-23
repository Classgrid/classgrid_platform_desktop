const { NodeSSH } = require('node-ssh');
const fs = require('fs');

const ssh = new NodeSSH();

async function run() {
  try {
    const key = fs.readFileSync('C:/Users/nikhi/Downloads/Nikhil.pem', 'utf8');
    
    await ssh.connect({
      host: '13.63.34.197',
      username: 'ubuntu',
      privateKey: key
    });
    console.log('Connected! Fixing the Dockerfile newline bug...');

    const catResult = await ssh.execCommand('cat ~/agent-sandbox-env/Dockerfile');
    let df = catResult.stdout;
    
    // Fix the broken line
    df = df.replace('RUN npm install -g mongodb mongoose express axios cors dotenv\\n\\nRUN useradd -m agent', 'RUN npm install -g mongodb mongoose express axios cors dotenv\n\nRUN useradd -m agent');
    
    await ssh.execCommand(`cat << 'EOF' > ~/agent-sandbox-env/Dockerfile\n${df}\nEOF`);
    console.log('Modified Dockerfile to add mongodb, mongoose, express with PROPER newlines...');

    console.log('Rebuilding image (this will take 5 seconds because we are using cache!)...');

    // Run the build
    const buildResult = await ssh.execCommand('cd ~/agent-sandbox-env && docker build -t my-agent-sandbox .');
    console.log('Build finished! Status:', buildResult.code === 0 ? 'SUCCESS' : 'FAILED');
    if (buildResult.stderr) console.log('STDERR:', buildResult.stderr);
    
    if (buildResult.code === 0) {
        console.log('\\n--- FINAL VERIFICATION NPM LIST ---');
        const testResult = await ssh.execCommand('docker run --rm my-agent-sandbox npm list -g --depth=0');
        console.log(testResult.stdout);
    }
    
  } catch (e) {
    console.error('Error:', e);
  } finally {
    ssh.dispose();
  }
}
run();
