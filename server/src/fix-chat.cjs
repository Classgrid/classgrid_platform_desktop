const fs = require('fs');
let content = fs.readFileSync('c:/CLASSGRIDPLATFORM/classgrid_platoform-desktop-/server/src/services/chat.js', 'utf8');
content = content.replace(/recommended\/\*\s*[Mm]odel:\s*'groq'\s*\*\//g, "recommendedModel: 'groq'");
fs.writeFileSync('c:/CLASSGRIDPLATFORM/classgrid_platoform-desktop-/server/src/services/chat.js', content, 'utf8');
