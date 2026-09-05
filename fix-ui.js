const fs = require('fs');

let content = fs.readFileSync('client/src/features/superadmin/components/LeadTable.tsx', 'utf8');
content = content.replace(
  'text = "Provisioned";\n          color = "bg-emerald-500";\n          textColor = "text-emerald-500";',
  'text = "Sandbox";\n          color = "bg-amber-500";\n          textColor = "text-amber-600";'
);
fs.writeFileSync('client/src/features/superadmin/components/LeadTable.tsx', content, 'utf8');

let pageContent = fs.readFileSync('client/src/features/superadmin/pages/LeadsPage.tsx', 'utf8');
pageContent = pageContent.replace(
  '<option value="converted">Provisioned</option>',
  '<option value="converted">Sandbox</option>'
);
fs.writeFileSync('client/src/features/superadmin/pages/LeadsPage.tsx', pageContent, 'utf8');

console.log('Fixed UI text');
