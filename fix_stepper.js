const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'client', 'src', 'components', 'marketing_ui', 'stepper.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace('pb-12', 'pb-32');
content = content.replace('step.description && isActive &&', 'step.description &&');

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed stepper.tsx!');
