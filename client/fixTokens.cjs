const fs = require('fs');
const file = 'c:/CLASSGRIDPLATFORM/classgrid_platoform-desktop-/client/src/components/ai/components/credits/AiUpgradePanel.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/tokens/g, 'Credits');
content = content.replace(/bg-emerald-600 hover:bg-emerald-700 text-white/g, '');
content = content.replace(/bg-emerald-500\/10 border border-emerald-500\/20/g, 'bg-muted border border-border');
content = content.replace(/text-emerald-600 dark:text-emerald-400/g, 'text-foreground');
content = content.replace(/<Zap className="w-5 h-5" \/>/g, '<Zap className="w-5 h-5 text-amber-500" />');

fs.writeFileSync(file, content);

const file2 = 'c:/CLASSGRIDPLATFORM/classgrid_platoform-desktop-/client/src/components/ai/components/credits/AiCreditsPanel.tsx';
if (fs.existsSync(file2)) {
    let content2 = fs.readFileSync(file2, 'utf8');
    content2 = content2.replace(/tokens/g, 'Credits');
    content2 = content2.replace(/Tokens/g, 'Credits');
    fs.writeFileSync(file2, content2);
}
console.log('done');
