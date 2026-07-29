const fs = require('fs');
const filePath = 'client/src/features/org-admin/pages/BillingPage.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const startMarker = '<h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Billing & Subscription</h2>';
const endMarker = '{/* BILLING SETTINGS */}';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const newContent = content.substring(0, startIndex + startMarker.length) + '\n      </div>\n\n      ' + content.substring(endIndex);
  fs.writeFileSync(filePath, newContent);
  console.log('Fixed BillingPage.tsx dashboards successfully!');
} else {
  console.log('Markers not found! startIndex: ' + startIndex + ' endIndex: ' + endIndex);
}
