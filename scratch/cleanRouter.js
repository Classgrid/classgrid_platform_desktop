const fs = require('fs');
const p = 'client/src/app/router.tsx';
let c = fs.readFileSync(p, 'utf8');

const lines = c.split(/\r?\n/);
let found = false;
const newLines = lines.filter(line => {
  if (line.includes('import { PublicChatLoginPage } from "@/features/public-chat/pages/PublicChatLoginPage";')) {
    if (!found) {
      found = true;
      return true; // Keep the first one
    }
    return false; // Remove the second one
  }
  return true;
});

fs.writeFileSync(p, newLines.join('\n'));
console.log('Done cleaning imports');
