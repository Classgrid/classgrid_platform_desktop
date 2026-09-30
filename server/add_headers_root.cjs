const fs = require('fs');
const path = require('path');

const dir = 'c:/CLASSGRIDPLATFORM/classgrid_platoform-desktop-/server';

const header = `// MODEL STATUS:
// - Cloudflare Workers AI = ACTIVE (now in use)
// - Gemini 3.5 Flash = COMMENTED OUT (disabled)
// - Groq model = DEAD (removed from use)
`;

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Add header if not present
  if (!content.startsWith('// MODEL STATUS:')) {
    content = header + content;
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

const files = fs.readdirSync(dir);
for (const file of files) {
  const fullPath = path.join(dir, file);
  if (fs.statSync(fullPath).isFile() && fullPath.endsWith('.js')) {
    processFile(fullPath);
  }
}

console.log('Done.');
