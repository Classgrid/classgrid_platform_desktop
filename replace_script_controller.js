const fs = require('fs');
let code = fs.readFileSync('server/src/controllers/ai-chat.controller.js', 'utf8');

const target = "whatsappConnected = !!(process.env.WHATSAPP_PHONE_ID && process.env.WHATSAPP_ACCESS_TOKEN);";
const replacement = "whatsappConnected = connectedMcps.includes('whatsapp');";

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('server/src/controllers/ai-chat.controller.js', code);
    console.log('REPLACED');
} else {
    console.log('NOT FOUND');
}
