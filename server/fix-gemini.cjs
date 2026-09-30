const fs = require('fs');

const filesToFix = [
  'c:/CLASSGRIDPLATFORM/classgrid_platoform-desktop-/server/src/services/ai/proctor.service.js',
  'c:/CLASSGRIDPLATFORM/classgrid_platoform-desktop-/server/src/services/ai/ocr-quiz.service.js'
];

for (const file of filesToFix) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/const model = genAI\.getGenerativeModel\(\{ \/\* model: "gemini-3\.5-flash" \*\/ \}\);/g, 'const model = null; // genAI.getGenerativeModel({ model: "gemini-3.5-flash" });');
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed', file);
}
