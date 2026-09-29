const fs = require('fs');
let code = fs.readFileSync('client/src/app/router.tsx', 'utf8');

// Add import
if (!code.includes('FraudLogsPage')) {
  code = code.replace(
    'import FailedPaymentsPage from "@/features/superadmin/billing/pages/FailedPaymentsPage";',
    'import FailedPaymentsPage from "@/features/superadmin/billing/pages/FailedPaymentsPage";\nimport FraudLogsPage from "@/features/superadmin/billing/pages/FraudLogsPage";'
  );
}

// Add route
if (!code.includes('<Route path="fraud-logs"')) {
  code = code.replace(
    '<Route path="failed-payments/:id" element={<FailedPaymentDetailsPage />} />',
    '<Route path="failed-payments/:id" element={<FailedPaymentDetailsPage />} />\n            <Route path="fraud-logs" element={<FraudLogsPage />} />'
  );
}

fs.writeFileSync('client/src/app/router.tsx', code);
console.log("Updated router.tsx for FraudLogsPage");
