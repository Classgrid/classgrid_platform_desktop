const fs = require('fs');
const path = require('path');

const dir = 'c:/CLASSGRIDPLATFORM/classgrid_platoform-desktop-/server/src';

function processDir(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.js')) {
      processFile(fullPath);
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace `/* model: "something" */,` with `/* model: "something" */` (removing the comma)
  // Or rather, we can comment out the comma as well if it's on the same line.
  // Actually, we can just remove the comma if it immediately follows the comment.
  const regex = /(\/\*\s*model\s*:\s*['"][^'"]+['"]\s*\*\/)\s*,/g;
  
  content = content.replace(regex, (match, p1) => {
    return p1;
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed syntax in: ${filePath}`);
  }
}

processDir(dir);
console.log('Done.');
