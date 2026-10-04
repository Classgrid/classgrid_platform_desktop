const fs = require('fs');
const file = 'c:/CLASSGRIDPLATFORM/classgrid_platoform-desktop-/client/src/components/ai/components/credits/AiUpgradePanel.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /if\s*\(\s*response\s*&&\s*response\.checkout_url\s*\)\s*\{\s*window\.location\.href\s*=\s*response\.checkout_url;\s*\}/;

const replacement = `if (response && response.checkout_url) {
        try {
          const urlObj = new URL(response.checkout_url);
          const theme = document.documentElement.classList.contains("dark") ? "dark" : "light";
          urlObj.searchParams.set("theme", theme);
          window.location.href = urlObj.toString();
        } catch (e) {
          window.location.href = response.checkout_url;
        }
      }`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
console.log("Updated AiUpgradePanel.tsx successfully.");
