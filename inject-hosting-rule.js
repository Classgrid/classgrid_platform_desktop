const fs = require('fs');
const path = require('path');

const jsPolicyComment = `/*
 * ─────────────────────────────────────────────────────────
 * 🚨 HOSTING & ARCHITECTURE RULE 🚨
 * 1. BACKEND IS HOSTED ON AWS EC2 AT API.CLASSGRID.IN
 * 2. FRONTEND IS HOSTED ON VERCEL
 * ─────────────────────────────────────────────────────────
 */\n`;

const envPolicyComment = `# ─────────────────────────────────────────────────────────
# 🚨 HOSTING & ARCHITECTURE RULE 🚨
# 1. BACKEND IS HOSTED ON AWS EC2 AT API.CLASSGRID.IN
# 2. FRONTEND IS HOSTED ON VERCEL
# ─────────────────────────────────────────────────────────\n`;

const mdPolicyComment = `<!--
─────────────────────────────────────────────────────────
🚨 HOSTING & ARCHITECTURE RULE 🚨
1. BACKEND IS HOSTED ON AWS EC2 AT API.CLASSGRID.IN
2. FRONTEND IS HOSTED ON VERCEL
─────────────────────────────────────────────────────────
-->\n`;

function injectPolicy(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !fullPath.includes('node_modules') && !fullPath.includes('.git') && !fullPath.includes('.next')) {
      injectPolicy(fullPath);
    } else if (stat.isFile()) {
      if (/\.(js|ts|tsx|jsx)$/.test(file)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (!content.includes('HOSTING & ARCHITECTURE RULE')) {
            let newContent = content;
            if (content.startsWith('"use client"') || content.startsWith("'use client'")) {
              const firstNewline = content.indexOf('\n');
              newContent = content.substring(0, firstNewline + 1) + '\n' + jsPolicyComment + content.substring(firstNewline + 1);
            } else if (content.includes('🚨 NAMING CONVENTION RULE 🚨')) {
              const endOfPreviousPolicy = content.indexOf('*/', content.indexOf('🚨 NAMING CONVENTION RULE 🚨')) + 3;
              newContent = content.substring(0, endOfPreviousPolicy) + '\n' + jsPolicyComment + content.substring(endOfPreviousPolicy);
            } else if (content.includes('🚨 CRITICAL AI AND SYSTEM RULES 🚨')) {
              const endOfPreviousPolicy = content.indexOf('*/', content.indexOf('🚨 CRITICAL AI AND SYSTEM RULES 🚨')) + 3;
              newContent = content.substring(0, endOfPreviousPolicy) + '\n' + jsPolicyComment + content.substring(endOfPreviousPolicy);
            } else {
              newContent = jsPolicyComment + content;
            }
            fs.writeFileSync(fullPath, newContent, 'utf8');
          }
        } catch (err) {
          console.error("Error processing file:", fullPath);
        }
      } else if (file.includes('.env')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (!content.includes('HOSTING & ARCHITECTURE RULE')) {
            let newContent = content;
            if (content.includes('🚨 NAMING CONVENTION RULE 🚨')) {
              const endOfPreviousPolicy = content.indexOf('\n\n', content.indexOf('🚨 NAMING CONVENTION RULE 🚨')) + 2;
              if (endOfPreviousPolicy > 1) {
                newContent = content.substring(0, endOfPreviousPolicy) + envPolicyComment + '\n' + content.substring(endOfPreviousPolicy);
              } else {
                newContent = envPolicyComment + '\n' + content;
              }
            } else {
              newContent = envPolicyComment + '\n' + content;
            }
            fs.writeFileSync(fullPath, newContent, 'utf8');
          }
        } catch (err) {
          console.error("Error processing env file:", fullPath);
        }
      } else if (/\.md$/.test(file)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (!content.includes('HOSTING & ARCHITECTURE RULE')) {
            fs.writeFileSync(fullPath, mdPolicyComment + '\n' + content, 'utf8');
          }
        } catch (err) {
          console.error("Error processing md file:", fullPath);
        }
      }
    }
  }
}

console.log("Processing ERP Repo...");
injectPolicy('C:/CLASSGRIDPLATFORM/classgrid_platoform-desktop-');
console.log("Processing Marketing Repo...");
injectPolicy('C:/classgrid_marketting/Classgrid_marketting');
console.log('Done!');
