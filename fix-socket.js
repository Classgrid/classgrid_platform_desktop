const fs = require('fs');
let code = fs.readFileSync('client/src/lib/socketClient.ts', 'utf8');

// Cleanup previous echoes
code = code.replace(/export function joinAiUsageDashboard\(\).*$/gm, '');
code = code.replace(/export function leaveAiUsageDashboard\(\).*$/gm, '');

// Ensure clean format
code = code.trim();

// Insert before export default {
code = code.replace('export default {', `export function joinAiUsageDashboard() {
  socket?.emit("join_ai_usage_dashboard");
}

export function leaveAiUsageDashboard() {
  socket?.emit("leave_ai_usage_dashboard");
}

export default {`);

// Insert into export default {
code = code.replace('emitThreadTyping,', 'emitThreadTyping,\n  joinAiUsageDashboard,\n  leaveAiUsageDashboard,');

fs.writeFileSync('client/src/lib/socketClient.ts', code);
console.log('Done!');
