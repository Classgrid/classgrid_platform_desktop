const fs = require('fs');
const path = require('path');

const filePath = path.join('client', 'src', 'features', 'superadmin', 'pages', 'AgentReviewsPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /<Button[\s\n\r]*variant="link"[\s\n\r]*className="p-0 h-auto text-blue-600 hover:text-blue-800 flex items-center cursor-pointer"[\s\n\r]*onClick=\{[\s\S]*?\([\s\S]*?\}\}?>/m,
  '<Button \n                        variant="link" \n                        className="p-0 h-auto text-blue-600 hover:text-blue-800 flex items-center cursor-pointer" \n                        onClick={() => window.open(trimmedUrl, \'_blank\')}\n                      >'
);

fs.writeFileSync(filePath, content);
console.log('Successfully applied new tab fix');
