const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const match = env.match(/AGENT_SSH_KEY="(.*?)"/s);
if (match) {
    const key = match[1].replace(/\\n/g, '\n');
    fs.writeFileSync('sandbox.pem', key);
    console.log('Wrote sandbox.pem');
} else {
    console.log('AGENT_SSH_KEY not found in .env');
}
