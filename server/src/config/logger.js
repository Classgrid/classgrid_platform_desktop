import winston from "winston";
import "winston-daily-rotate-file";
import "winston-mongodb";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import crypto from "crypto";
import { asyncContext } from "../utils/async-context.js";

// Ensure env variables are loaded if used directly
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { combine, timestamp, printf, colorize, json, metadata } = winston.format;

// Custom log format for readable console
const consoleFormat = printf(({ level, message, timestamp, ...meta }) => {
    return `${timestamp} ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ""}`;
});

// Format that injects contextual data from AsyncLocalStorage
const injectContextFormat = winston.format((info) => {
    const context = asyncContext.getStore();
    if (context) {
        // Only inject if not explicitly provided in the log
        if (info.userId === undefined) info.userId = context.userId;
        if (info.orgId === undefined) info.orgId = context.orgId;
        if (info.traceId === undefined) info.traceId = context.traceId;
        if (info.ip === undefined) info.ip = context.ip;
    }
    return info;
});

// Create rotating file transport for API access logs
const fileTransport = new winston.transports.DailyRotateFile({
    filename: path.join(__dirname, "../../../logs", "api-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "14d",
    format: combine(injectContextFormat(), timestamp(), json())
});

const transports = [
    fileTransport,
    new winston.transports.Console({
        format: combine(injectContextFormat(), colorize(), timestamp(), consoleFormat)
    })
];

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

// Add MongoDB transport if URI is available
if (mongoUri) {
    transports.push(
        new winston.transports.MongoDB({
            // Store ALL logs (info, warn, error) — no level filter
            db: mongoUri,
            collection: "systemlogs",
            format: combine(injectContextFormat(), timestamp(), metadata()),
            expireAfterSeconds: 432000, // 5 days
            capped: true,
            cappedSize: 10485760, // 10MB
            cappedMax: 10000 // Max 10,000 logs
        })
    );
}

// Configure main logger
export const accessLogger = winston.createLogger({
    level: "info",
    transports: transports
});

// Express middleware for logging specific route traffic
export const winstonMiddleware = (req, res, next) => {
    // Skip logging high-frequency polling routes to prevent log spam
    if (
        req.originalUrl.includes("/api/super-admin/error-logs") ||
        req.originalUrl.includes("/api/super-admin/health") ||
        req.originalUrl.includes("/api/super-admin/feature-flags")
    ) {
        return next();
    }

    const start = Date.now();
    // Inject traceId into request
    req.traceId = req.traceId || crypto.randomUUID();
    
    // Log once request finishes
    res.on("finish", () => {
        const duration = Date.now() - start;
        
        // Safely capture and redact request body
        let safeBody = undefined;
        if (req.body && Object.keys(req.body).length > 0) {
            safeBody = { ...req.body };
            const sensitiveKeys = ["password", "token", "secret", "key", "authorization", "credit_card"];
            
            const redact = (obj) => {
                for (const key in obj) {
                    if (typeof obj[key] === 'object' && obj[key] !== null) {
                        redact(obj[key]);
                    } else if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
                        obj[key] = "[REDACTED]";
                    }
                }
            };
            redact(safeBody);
        }

        const logData = {
            traceId: req.traceId,
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            ip: req.ip,
            durationMs: duration,
            orgId: req.effectiveOrganizationId || (req.user ? req.user.organization_id : "none"),
            userId: req.user ? req.user.id : "unauthenticated",
            ...(safeBody && { body: safeBody })
        };

        if (res.statusCode >= 400) {
            accessLogger.error(`API Request Failed: ${req.method} ${req.originalUrl}`, logData);
        } else {
            accessLogger.info("API Request Dispatched", logData);
        }
    });

    const runContext = {
        traceId: req.traceId,
        ip: req.ip,
        orgId: req.effectiveOrganizationId || (req.user ? req.user.organization_id : "none"),
        userId: req.user ? req.user.id : "unauthenticated"
    };

    // Run the rest of the request within this context
    asyncContext.run(runContext, () => {
        next();
    });
};

export default accessLogger;
