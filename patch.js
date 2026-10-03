const fs = require('fs');
let content = fs.readFileSync('server/src/controllers/super-admin/ai-credits-admin.controller.js', 'utf8');

content = content.replace(/res\.status\(200\)\.json\(\{\s*success:\s*true,\s*message:([^}]+)\}\);/g, (match, p1) => {
    return `const io = req.app.get("io");
        if (io) {
            io.to("superadmin:ai_usage").emit("ai_usage_updated");
        }
        ${match}`;
});

fs.writeFileSync('server/src/controllers/super-admin/ai-credits-admin.controller.js', content);
console.log("Patched successfully!");
