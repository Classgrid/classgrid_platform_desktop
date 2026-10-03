import fs from 'fs';
let f = fs.readFileSync('src/controllers/super-admin/ai-credits-admin.controller.js', 'utf8');
f = f.replace(/io\.to\("superadmin:ai_usage"\)\.emit\("ai_usage_updated"\);/g, 'io.to("superadmin:ai_usage").emit("ai_usage_updated");\n            if (typeof userId !== "undefined" && userId) io.to(userId.toString()).emit("ai_token_update");\n            if (typeof orgId !== "undefined" && orgId) io.to(`org:${orgId}`).emit("ai_token_update");');
fs.writeFileSync('src/controllers/super-admin/ai-credits-admin.controller.js', f);
console.log("Patched admin controller");
