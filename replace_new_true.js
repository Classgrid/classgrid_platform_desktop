const fs = require('fs');
const path = require('path');

function walkDir(dir) {
    if (dir.includes('node_modules') || dir.includes('.git')) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.js') || fullPath.endsWith('.cjs')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            const regex = /\bnew\s*:\s*true\b/g;
            if (regex.test(content)) {
                content = content.replace(regex, "returnDocument: 'after'");
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Updated', fullPath);
            }
        }
    }
}

walkDir(path.join(__dirname, 'server'));
console.log('Done');
