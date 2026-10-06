const fs = require('fs');
const file = 'client/src/features/public-chat/pages/PublicChatSandbox.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'await apiClient.post("/api/auth/chat/send-otp", { email: email.toLowerCase() });',
  'await apiClient.post("/api/auth/chat/send-email-otp", { email: email.toLowerCase() });'
);

content = content.replace(
  'const res = await apiClient.post("/api/auth/chat/verify-otp", {',
  'const res = await apiClient.post("/api/auth/chat/verify-email-otp", {'
);

content = content.replace(
  'setStep("whatsapp_otp");\\n      startWhatsappCountdown();',
  'await apiClient.post("/api/auth/chat/send-whatsapp-otp", { phoneNumber: `+${whatsappCountryCode}${whatsappPhone}` });\n      setStep("whatsapp_otp");\n      startWhatsappCountdown();'
);

content = content.replace(
  'const response = await apiClient.post("/api/auth/chat/onboard", {',
  'const response = await apiClient.post("/api/auth/chat/finalize-onboarding", {\n        whatsappOtp,'
);

fs.writeFileSync(file, content);
console.log('Sandbox Patched with Real Flow');
