const fs = require('fs');
const file = 'c:/CLASSGRIDPLATFORM/classgrid_platoform-desktop-/client/src/features/superadmin/components/GlobalAiConfigPanel.tsx';
let content = fs.readFileSync(file, 'utf8');

// For individual Usage
content = content.replace(
  /onChange=\{\(e\) => setIndividualUsage\(Math\.max\(1000, Math\.min\(100000000, Number\(e\.target\.value\) \|\| 1000\)\)\)\}/g,
  `onChange={(e) => setIndividualUsage(Number(e.target.value))}`
);

// For Org pool
content = content.replace(
  /onChange=\{\(e\) => setOrgPool\(Math\.max\(10000, Math\.min\(100000000, Number\(e\.target\.value\) \|\| 10000\)\)\)\}/g,
  `onChange={(e) => setOrgPool(Number(e.target.value))}`
);

fs.writeFileSync(file, content);
console.log("Replaced locks in GlobalAiConfigPanel.tsx");
