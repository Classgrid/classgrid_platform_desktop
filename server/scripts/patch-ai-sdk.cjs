const fs = require('fs');
const path = require('path');

const chunkJsPath = path.join(__dirname, '../node_modules/@classgrid/ai/dist/chunk-HXFZWYLB.js');
const chunkCjsPath = path.join(__dirname, '../node_modules/@classgrid/ai/dist/chunk-7LZFBQJS.cjs');

function patchFile(filePath) {
    if (!fs.existsSync(filePath)) {
        console.log(`[Patch] File not found: ${filePath}`);
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if already patched
    if (content.includes('"x-session-affinity": "classgrid-ai-production-cache"')) {
        console.log(`[Patch] Already patched: ${filePath}`);
        return;
    }

    // Insert the header
    const searchString = `"Content-Type": "application/json"`;
    const replaceString = `"Content-Type": "application/json",\n        "x-session-affinity": "classgrid-ai-production-cache"`;
    
    if (content.includes(searchString)) {
        content = content.replace(searchString, replaceString);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`[Patch] Successfully patched: ${filePath}`);
    } else {
        console.log(`[Patch] Could not find insertion point in: ${filePath}`);
    }
}

console.log("Applying Cloudflare Prefix Caching patch to @classgrid/ai SDK...");
patchFile(chunkJsPath);
patchFile(chunkCjsPath);
console.log("Patching complete!");
