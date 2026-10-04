const fs = require('fs');
const file = 'c:/CLASSGRIDPLATFORM/classgrid_platoform-desktop-/client/src/features/superadmin/pages/AiUsageDashboardPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace {formatNumber(row.remaining)} / {formatNumber(row.granted)}
// with {formatNumber(row.used)} / {formatNumber(row.granted)}

content = content.replace(
  /\{formatNumber\(row\.remaining\)\}\s*\/\s*\{formatNumber\(row\.granted\)\}/g,
  `{formatNumber(row.used)} / {formatNumber(row.granted)}`
);

fs.writeFileSync(file, content);
console.log("Updated active granted credits display format.");
