const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.js')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('c:/CLASSGRIDPLATFORM/classgrid_platoform-desktop-/server/src');
const header = `// MODEL STATUS:
// - Cloudflare Workers AI = ACTIVE (now in use)
// - Gemini 3.5 Flash = COMMENTED OUT (disabled)
// - Groq model = DEAD (removed from use)
`;

let modifiedFiles = [];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let originalContent = content;
  
  // Flag to know if this is an AI file (skip mistral based files unless they have groq/gemini/llama)
  const isAiFile = content.includes('@cf/') || content.includes('gemini') || content.includes('groq') || content.includes('llama');
  
  if (!isAiFile) return;
  
  // 1. Remove existing block comments around model strings to normalize
  content = content.replace(/\/\*\s*(model\s*:\s*['"][^'"]*(?:gemini|llama|groq)[^'"]*['"])\s*\*\//gi, '$1');
  
  // 2. Wrap them in block comments
  content = content.replace(/(model\s*:\s*['"][^'"]*(?:gemini|llama|groq)[^'"]*['"])/gi, '/* $1 */');
  
  // If the file was changed OR it's an AI file that has models, ensure the header is present
  if (content !== originalContent || (content.match(/model\s*:\s*['"][^'"]*['"]/i) && isAiFile)) {
    if (!content.includes('MODEL STATUS:')) {
      content = header + content;
    }
    fs.writeFileSync(f, content, 'utf8');
    modifiedFiles.push(f);
  }
});
console.log('Modified files:', modifiedFiles.length);
console.log(modifiedFiles.join('\n'));
