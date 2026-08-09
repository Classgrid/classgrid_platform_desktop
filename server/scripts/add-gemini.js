import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { syncUserToBlogSubscribers } from "../src/services/subscriber-sync.service.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

async function run() {
  console.log("Adding gemini@classgrid.in...");
  await syncUserToBlogSubscribers("gemini@classgrid.in", "Gemini");
  console.log("Done.");
  process.exit(0);
}

run();
