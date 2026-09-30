const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'src/controllers/ai-chat.controller.js');
let content = fs.readFileSync(targetFile, 'utf8');

const startIndex = content.indexOf('WEBSITE DEPLOYMENT INSTRUCTIONS:');
const endIndex = content.indexOf('DOCUMENT RETRIEVAL RULE:');

if (startIndex !== -1 && endIndex !== -1) {
    const startPortion = content.substring(0, startIndex + 'WEBSITE DEPLOYMENT INSTRUCTIONS:\\n'.length);
    const endPortion = content.substring(endIndex);

    // EXACTLY the user's string, and nothing else.
    const perfectBlock = `"DO NOT use the cloudflare_r2_connector for deploying multi-file websites, as it requires massive JSON payloads that will cause you to hang!"

- Step 1: Write the HTML/CSS/JS code to the sandbox using run_code. - Step 2: Deploy the files by writing a Node.js script in the sandbox using run_code. (CRITICAL: @aws-sdk/client-s3 is NOT pre-installed! Your script MUST use child_process.execSync('npm install @aws-sdk/client-s3') before requiring it)\`;

        dynamicSystemPrompt += \`\\n\\n`;

    content = startPortion + perfectBlock + endPortion;
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log("SUCCESS: Applied exactly and only the user's string.");
} else {
    console.log("FAILED to find bounds");
}
