const fs = require('fs');
let code = fs.readFileSync('server/src/controllers/ai-chat.controller.js', 'utf8');

const target = "Use 'microsoft_workspace_connector' tool to list_emails, mark_email_read, send_email, list_meetings";
const replacement = "Use 'microsoft_workspace_connector' tool to list_emails, read_email, mark_email_read, send_email, list_meetings";

const target2 = "If the user asks to summarize a meeting, use read_meeting_transcript.";
const replacement2 = "If the user asks to summarize a meeting, use read_meeting_transcript. CRITICAL: If the user asks you to read a specific email or its full content, ALWAYS use read_email with the messageId.";

if (code.includes(target) && code.includes(target2)) {
    code = code.replace(target, replacement);
    code = code.replace(target2, replacement2);
    fs.writeFileSync('server/src/controllers/ai-chat.controller.js', code);
    console.log('REPLACED');
} else {
    console.log('NOT FOUND');
}
