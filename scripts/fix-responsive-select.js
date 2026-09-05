/*
 * ─────────────────────────────────────────────────────────
 * 🚨 CRITICAL AI AND SYSTEM RULES 🚨
 * 1. NEVER DELETE ANY ENVIRONMENT VARIABLES.
 * 2. LOCALHOST TESTING IS STRICTLY BANNED. NO AI WILL EVER TRY TO WORK LOCALLY.
 * 3. THIS REPO IS PRODUCTION-FIRST. DO NOT TOUCH OR REMOVE KEYS.
 * ─────────────────────────────────────────────────────────
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 NAMING CONVENTION RULE 🚨
 * 1. "CLASSGRID PLATFORM" is strictly the REPO NAME.
 * 2. "CLASSGRID ERP" is the actual PRODUCT NAME.
 * 3. NEVER use "Classgrid Platform" anywhere in the frontend UI or user-facing text.
 * ─────────────────────────────────────────────────────────
 */
const fs = require('fs');
const path = require('path');
function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      fileList = walk(path.join(dir, file), fileList);
    } else {
      if (file.endsWith('.tsx')) fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}
const allFiles = walk('client/src');
let count = 0;
allFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('<ResponsiveSelect') && !content.includes('ResponsiveSelect } from')) {
    content = 'import { ResponsiveSelect } from "@/components/marketing_ui/responsive-select";\n' + content;
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed:', file);
    count++;
  }
});
console.log('Total fixed:', count);
