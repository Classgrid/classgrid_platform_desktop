const fs = require('fs');
const file = 'c:/CLASSGRIDPLATFORM/classgrid_platoform-desktop-/client/src/components/ai/components/credits/AiCreditsPanel.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /balanceData\?\.ai_credits_end_date : balanceData\?\.promotion_credits_end_date/g;

const replacement = `balance?.ai_credits_end_date : balance?.promotion_credits_end_date`;

if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(file, content);
    console.log("Fixed AiCreditsPanel.tsx balanceData reference error");
} else {
    console.log("Regex did not match");
}
