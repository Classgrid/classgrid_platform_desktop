const fs = require('fs');
const file = 'c:/CLASSGRIDPLATFORM/classgrid_platoform-desktop-/client/src/features/superadmin/components/ai-usage/AiUserDetailPanel.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/Total Tokens Consumed/g, 'Total Credits Consumed');
content = content.replace(/Lifetime token consumption/g, 'Lifetime credit consumption');
content = content.replace(/tokens/g, 'Credits');
content = content.replace(/Tokens/g, 'Credits');

fs.writeFileSync(file, content);
console.log('done fixing terminology');
