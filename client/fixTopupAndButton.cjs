const fs = require('fs');

// 1. Fix AiUpgradePanel.tsx button variant
const upgradePanelFile = 'c:/CLASSGRIDPLATFORM/classgrid_platoform-desktop-/client/src/components/ai/components/credits/AiUpgradePanel.tsx';
let upgradePanelContent = fs.readFileSync(upgradePanelFile, 'utf8');

// The user forbids green buttons. Let's make sure it's variant="secondary"
upgradePanelContent = upgradePanelContent.replace(/<Button \n                  onClick=\{handleTopUp\}/, '<Button \n                  variant="secondary"\n                  onClick={handleTopUp}');
fs.writeFileSync(upgradePanelFile, upgradePanelContent);

// 2. Fix Backend Routing
const indexFile = 'c:/CLASSGRIDPLATFORM/classgrid_platoform-desktop-/server/api/index.js';
let indexContent = fs.readFileSync(indexFile, 'utf8');

if (!indexContent.includes('import aiCreditsRoutes')) {
    // Add imports
    indexContent = indexContent.replace('import aiRoutes from "../src/routes/ai.routes.js";', 'import aiRoutes from "../src/routes/ai.routes.js";\nimport aiCreditsRoutes from "../src/routes/ai-credits.routes.js";\nimport aiCreditsTopupRoutes from "../src/routes/ai-credits-topup.routes.js";');
    
    // Add routes
    indexContent = indexContent.replace('app.use("/api/ai", aiRoutes);', 'app.use("/api/ai", aiRoutes);\napp.use("/api/ai/credits", aiCreditsRoutes);\napp.use("/api/ai/topup", aiCreditsTopupRoutes);');
    
    fs.writeFileSync(indexFile, indexContent);
}

console.log('Fixed Green Button and mounted AI Credits Routes in backend.');
