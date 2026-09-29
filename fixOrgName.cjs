const fs = require('fs');
let f2 = fs.readFileSync('client/src/features/superadmin/billing/components/finance/RevenueComponents.tsx', 'utf8');
f2 = f2.replace(/item\.organization\?\.sidebar_name \|\| item\.organization\?\.name \|\| item\._id/g, 'item.organizationName || item._id');
fs.writeFileSync('client/src/features/superadmin/billing/components/finance/RevenueComponents.tsx', f2);
console.log("Fixed RevenueOrganizationTable");
