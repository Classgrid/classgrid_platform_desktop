const fs = require('fs');
const path = require('path');

const chunkCjsPath = path.join(__dirname, '../node_modules/@classgrid/ai/dist/chunk-7LZFBQJS.cjs');
const patchedCorePath = path.join(__dirname, 'patched-ai-core.cjs');

console.log("Applying Cloudflare Prefix Caching and Parallel Tools patch to @classgrid/ai SDK...");
try {
    if (fs.existsSync(patchedCorePath)) {
        fs.copyFileSync(patchedCorePath, chunkCjsPath);
        console.log(`[Patch] Successfully injected patched core into: ${chunkCjsPath}`);
    } else {
        console.log(`[Patch] Error: patched-ai-core.cjs not found at ${patchedCorePath}`);
    }
} catch (error) {
    console.error(`[Patch] Failed to patch SDK:`, error);
}
console.log("Patching complete!");
