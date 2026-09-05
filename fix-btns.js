const fs = require('fs');
let content = fs.readFileSync('client/src/features/superadmin/pages/LeadDetailsPage.tsx', 'utf8');

content = content.replace(
  'className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mb-2"',
  'className="w-full mb-2" variant="primary"'
);

content = content.replace(
  'className="w-full text-emerald-700 border-emerald-200 hover:bg-emerald-100"',
  'className="w-full"'
);

content = content.replace(
  '{regenerateMutation.isPending ? "Generating..." : "Generate New Activation Link"}',
  '{regenerateMutation.isPending ? "Sending..." : "Resend Activation Link"}'
);

fs.writeFileSync('client/src/features/superadmin/pages/LeadDetailsPage.tsx', content, 'utf8');
console.log('Fixed button styles');
