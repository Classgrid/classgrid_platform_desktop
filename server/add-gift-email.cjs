const fs = require('fs');

const appendText = `

// ------------- AI CREDITS: GIFT CREDITS -------------
export const getAiCreditGiftHtml = (userName, creditsGifted, message) => {
    return getEmailWrapper(\`
        <div style="text-align: center; margin-bottom: 24px;">
            <div style="background: #dbeafe; color: #1d4ed8; padding: 12px; border-radius: 8px; display: inline-block; font-weight: 700; font-size: 16px;">
                🎁 You Received a Gift!
            </div>
        </div>
        <p>Hi \${userName},</p>
        <p>Good news! <strong>\${creditsGifted} AI Credits</strong> have been gifted to your account by the Classgrid Platform Team.</p>
        \${message ? \`<p style="background: #f9fafb; padding: 16px; border-left: 4px solid #3b82f6; font-style: italic; color: #4b5563; border-radius: 4px;">"\${message}"</p>\` : ""}
        <p>These credits are immediately available for you to use across all AI features.</p>
    \`);
};
`;

let fileContent = fs.readFileSync('src/services/email-templates.service.js', 'utf8');
if (!fileContent.includes('getAiCreditGiftHtml')) {
    fs.appendFileSync('src/services/email-templates.service.js', appendText);
    console.log("Appended email template");
} else {
    console.log("Template already exists");
}
