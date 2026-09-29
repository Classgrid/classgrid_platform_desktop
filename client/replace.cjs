const fs = require('fs');
const file = 'src/features/billing-portal/pages/CheckoutPage.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'import { Spinner } from "@/components/marketing_ui/spinner";',
  'import { Spinner } from "@/components/marketing_ui/spinner";\nimport { NotFoundPage } from "@/features/system/pages/NotFoundPage";'
);

content = content.replace(
  /if \(step === "invalid"\) \{[\s\S]*?\}\s*if \(step === "failed"\)/g,
  'if (step === "invalid") {\n    return <NotFoundPage />;\n  }\n\n  if (step === "failed")'
);

fs.writeFileSync(file, content);
console.log("Replacement successful!");
