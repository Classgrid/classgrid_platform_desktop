const fs = require('fs');
const file = 'c:/CLASSGRIDPLATFORM/classgrid_platoform-desktop-/client/src/components/ai/components/credits/AiCreditsPanel.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /\} else if \(lowerStatus === 'success' \|\| lowerStatus === 'active'\) \{\s*displayStatus = 'Active';\s*colorClass = 'bg-emerald-500\/10 text-emerald-600';\s*\}/;

const replacement = `} else if (lowerStatus === 'success' || lowerStatus === 'active') {
                              const now = new Date().getTime();
                              const isTopup = txn.type === "topup";
                              const endDateStr = isTopup ? balanceData?.ai_credits_end_date : balanceData?.promotion_credits_end_date;
                              
                              if (endDateStr && new Date(endDateStr).getTime() < now) {
                                  displayStatus = 'Expired';
                                  colorClass = 'bg-red-500/10 text-red-600';
                              } else {
                                  displayStatus = 'Active';
                                  colorClass = 'bg-emerald-500/10 text-emerald-600';
                              }
                            }`;

if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(file, content);
    console.log("Fixed AiCreditsPanel.tsx");
} else {
    console.log("Regex did not match");
}
