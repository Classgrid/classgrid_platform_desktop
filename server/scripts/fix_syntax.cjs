const fs = require('fs');
const file = 'c:/CLASSGRIDPLATFORM/classgrid_platoform-desktop-/server/src/workers/marketing-email-blast.worker.js';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/\\`/g, '`');
content = content.replace(/\\\${/g, '${');
fs.writeFileSync(file, content);
