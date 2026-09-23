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
    console.log('Connected! Checking disk space...');

    const df = await ssh.execCommand('df -h');
    console.log(df.stdout);

    console.log('\\nPruning docker to free up space (removing unused images/build cache)...');
    const prune = await ssh.execCommand('docker system prune -af --volumes');
    console.log(prune.stdout);

    const df2 = await ssh.execCommand('df -h');
    console.log('\\nDisk space after prune:');
    console.log(df2.stdout);
    
  } catch (e) {
    console.error('Error:', e);
  } finally {
    ssh.dispose();
  }
}
run();
