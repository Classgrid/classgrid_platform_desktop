import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Simple manual .env parser so we don't depend on dotenv
let env = {};
try {
  const envContent = fs.readFileSync(path.join(__dirname, ".env"), "utf8");
  envContent.split("\n").forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
    }
  });
} catch (e) {
  console.log("No .env file found");
}

const MONGO_URI = env.MONGO_URI || process.env.MONGO_URI;
const JWT_SECRET = env.JWT_SECRET || process.env.JWT_SECRET || "fallback_secret";
const SUPER_ADMIN_EMAIL = env.SUPER_ADMIN_EMAIL || process.env.SUPER_ADMIN_EMAIL;

let db;
async function connectDB() {
  if (db) return db;
  try {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    db = client.db();
    console.log("✅ Rescue Server connected to MongoDB");
    return db;
  } catch (err) {
    console.error("❌ Rescue Server MongoDB Error:", err);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────
// RESCUE AUTHENTICATION
// ─────────────────────────────────────────────────────────
app.post("/api/rescue/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Safety check: only allow configured super admin email
    // Relaxed for Nikhil: as long as they know the RESCUE_PASSWORD, allow them.
    if (SUPER_ADMIN_EMAIL && email !== SUPER_ADMIN_EMAIL && email !== "nikhil.shinde@classgrid.in") {
      return res.status(401).json({ success: false, message: "Only the designated super admin can use Rescue Mode" });
    }

    const database = await connectDB();
    const user = await database.collection("users").findOne({ email, role: "super_admin" });
    
    if (!user) {
      return res.status(401).json({ success: false, message: "Super admin not found" });
    }
    
    const rescuePassword = env.RESCUE_PASSWORD || process.env.RESCUE_PASSWORD || "Nikhil@5049";
    
    // The Rescue Password ALWAYS works as a master override, regardless of whether 
    // the user has a normal database password or uses Google OAuth.
    if (rescuePassword && password === rescuePassword) {
      // Authenticated via Rescue Password
    } else if (user.password) {
      // Fallback: try their normal database password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }
    } else {
      return res.status(401).json({ success: false, message: "Use the RESCUE_PASSWORD for OAuth users" });
    }
    
    const token = jwt.sign({ userId: user._id, role: user.role, isRescue: true }, JWT_SECRET, { expiresIn: "1h" });
    res.json({ success: true, token, message: "Rescue mode authenticated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const verifyRescueToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No rescue token provided" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.isRescue) throw new Error("Invalid token type");
    req.user = decoded;
    next();
  } catch (e) {
    res.status(401).json({ success: false, message: "Invalid rescue token" });
  }
};

// ─────────────────────────────────────────────────────────
// RESCUE LOGS
// ─────────────────────────────────────────────────────────
app.get("/api/rescue/error-logs", verifyRescueToken, (req, res) => {
  try {
    const logPath = path.join(__dirname, "logs", "pm2-error.log");
    if (!fs.existsSync(logPath)) {
      return res.json({ success: true, logs: [{ timestamp: new Date(), level: "info", message: "No pm2-error.log found." }] });
    }
    
    const content = fs.readFileSync(logPath, "utf8");
    const lines = content.split("\n").filter(l => l.trim().length > 0).slice(-200);
    
    const logs = lines.map((line, idx) => {
      // Basic parse of PM2 log line: `0|classgri | 2026-07-12 11:35:36: Error...`
      const match = line.match(/^.*?\|\s*(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}):?\s*(.*)$/);
      let timestamp = new Date().toISOString();
      let message = line;
      
      if (match) {
        timestamp = new Date(match[1]).toISOString();
        message = match[2];
      }
      
      return {
        _id: `rescue-${idx}`,
        timestamp,
        level: "error",
        message,
        metadata: { source: "rescue-server", method: "CRASH", url: "SYSTEM" }
      };
    });
    
    res.json({ success: true, logs: logs.reverse() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/rescue/status", (req, res) => {
  res.json({ success: true, status: "online" });
});

app.listen(PORT, async () => {
  console.log(`🚑 Rescue Server running on port ${PORT}`);
  
  // ─────────────────────────────────────────────────────────
  // 🚨 TRIGGER THE AWS ALARM (INCIDENT.IO + EMAIL)
  // ─────────────────────────────────────────────────────────
  try {
    const sns = new SNSClient({ 
      region: "eu-north-1",
      credentials: {
        accessKeyId: env.AWS_S3_ERP_ACCESS_KEY || process.env.AWS_S3_ERP_ACCESS_KEY,
        secretAccessKey: env.AWS_S3_ERP_SECRET_KEY || process.env.AWS_S3_ERP_SECRET_KEY
      }
    });
    
    // FAKE A CLOUDWATCH ALARM PAYLOAD SO INCIDENT.IO ACCEPTS IT
    const cloudWatchPayload = {
      AlarmName: "Classgrid-API-Crash",
      AlarmDescription: "Software Crash: Node.js API encountered a fatal error (503) and Rescue Server took over.",
      AWSAccountId: "459600194137",
      NewStateValue: "ALARM",
      NewStateReason: "Threshold Crossed: 1 out of 1 datapoints was [1.0].",
      StateChangeTime: new Date().toISOString(),
      Region: "EU (Stockholm)",
      AlarmArn: "arn:aws:cloudwatch:eu-north-1:459600194137:alarm:Classgrid-API-Crash",
      OldStateValue: "OK",
      Trigger: {
        MetricName: "StatusCheckFailed",
        Namespace: "AWS/EC2",
        StatisticType: "Statistic",
        Statistic: "MAXIMUM",
        Dimensions: [{ value: "i-rescueserver", name: "InstanceId" }],
        Period: 60,
        EvaluationPeriods: 1,
        ComparisonOperator: "GreaterThanOrEqualToThreshold",
        Threshold: 1.0,
      }
    };

    await sns.send(new PublishCommand({
      TopicArn: "arn:aws:sns:eu-north-1:459600194137:classgrid-incident-alerts",
      Subject: "ALARM: \"Classgrid-API-Crash\" in EU (Stockholm)",
      Message: JSON.stringify(cloudWatchPayload)
    }));
    console.log("🚨 SNS Alarm Fired! Incident.io and Team Email triggered.");
  } catch(err) {
    console.error("❌ Failed to fire SNS Alarm:", err.message);
  }
});
