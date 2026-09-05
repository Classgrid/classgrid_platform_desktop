const fs = require('fs');
let content = fs.readFileSync('client/src/features/superadmin/pages/LeadDetailsPage.tsx', 'utf8');

content = content.replace(
  "window.open(`/superadmin/detail/${provisionedData?.orgId || provisionedData?.orgName || 'unknown'}`, '_self')",
  "window.open(`/superadmin/detail/${lead?.provisionedOrganizationId || provisionedData?.orgId || provisionedData?.orgName || 'unknown'}`, '_self')"
);

fs.writeFileSync('client/src/features/superadmin/pages/LeadDetailsPage.tsx', content, 'utf8');
console.log('Fixed View Organization Details link');
