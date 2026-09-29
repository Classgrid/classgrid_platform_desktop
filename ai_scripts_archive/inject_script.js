const fs = require("fs");
const path = require("path");

const COMMENT_BLOCK = `/*
 * =========================================================================================
 * 🚨 CRITICAL AI & SYSTEM RULE 🚨
 * NO FRONTEND GITHUB ACTIONS: NEVER create yaml files that build/deploy the frontend to EC2.
 * The frontend is hosted 100% on Vercel. EC2 is only for the backend.
 * =========================================================================================
 */\n\n`;

function processDirectory(directory) {
  const files = fs.readdirSync(directory);

  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!["node_modules", "dist", ".git", "build", ".next", "scratch"].includes(file)) {
        processDirectory(fullPath);
      }
    } else {
      if (fullPath.endsWith(".js") || fullPath.endsWith(".ts") || fullPath.endsWith(".tsx") || fullPath.endsWith(".jsx")) {
        const content = fs.readFileSync(fullPath, "utf8");
        if (!content.includes("NO FRONTEND GITHUB ACTIONS")) {
          fs.writeFileSync(fullPath, COMMENT_BLOCK + content, "utf8");
          console.log(`Injected into ${fullPath}`);
        }
      }
    }
  }
}

processDirectory("./client/src");
processDirectory("./server/src");
console.log("Done injecting rules into all frontend and backend source files!");
