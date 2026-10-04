const fs = require('fs');
const path = require('path');
const dirs = ['C:\\CLASSGRIDPLATFORM\\classgrid_platoform-desktop-', 'C:\\V2classgrid-', 'C:\\classgrid_marketting', 'C:\\classgrid-sites', 'C:\\gridx', 'C:\\classgrid-ai-sdk'];
const exts = ['.js', '.jsx', '.ts', '.tsx', '.css', '.scss', '.html'];
const ignore = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage'];

let total = 0;
function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (let f of fs.readdirSync(dir)) {
        if (ignore.includes(f)) continue;
        let full = path.join(dir, f);
        try {
            let stat = fs.statSync(full);
            if (stat.isDirectory()) walk(full);
            else if (exts.includes(path.extname(full))) {
                let content = fs.readFileSync(full, 'utf8');
                total += content.split('\n').length;
            }
        } catch(e){}
    }
}
for (let d of dirs) walk(d);
console.log(total);
