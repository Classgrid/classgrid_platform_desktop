import express from "express";
import rateLimit from "express-rate-limit";
import multer from "multer";
import multerS3 from "multer-s3";
import { s3Client, BUCKET_NAME } from "../config/s3Client.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import {
    MAX_STORAGE_UPLOAD_SIZE_BYTES,
    STORAGE_UPLOAD_RATE_LIMIT_PER_MINUTE,
    createFolder,
    deleteObject,
    deleteObjects,
    getObjectMetadata,
    getPresignedUrl,
    getStorageAnalyticsBreakdown,
    getStorageAnalyticsFiles,
    getStorageAnalyticsSummary,
    getStorageConfiguration,
    getStorageHealth,
    listObjects,
    renameObject,
    testStorageConnection,
    uploadFile,
} from "../controllers/storage.controller.js";

const router = express.Router();

const rateLimitValidation = {
    ip: false,
    xForwardedForHeader: false,
};

function buildStorageErrorResponse(req, message) {
    const traceId = typeof req?.traceId === "string"
        ? req.traceId.trim()
        : "";
    const requestId = /^[A-Za-z0-9._:-]{1,128}$/.test(traceId)
        ? traceId
        : "";

    return {
        success: false,
        message,
        ...(requestId ? { requestId } : {}),
    };
}

function storageUserKey(req) {
    return String(req.user?._id || req.user?.id || req.user?.email || "authenticated-super-admin");
}

const storageUpload = multer({
    storage: multerS3({
        s3: s3Client,
        bucket: BUCKET_NAME,
        key: function (req, file, cb) {
            const prefix = req.query.prefix || "";
            // Keep spaces, allow the frontend sanitation to pass through, but handle any necessary prepending
            cb(null, `${prefix}${file.originalname}`);
        },
        metadata: function (req, file, cb) {
            cb(null, { "created-at": new Date().toISOString() });
        },
        contentType: multerS3.AUTO_CONTENT_TYPE,
    }),
    limits: {
        fileSize: MAX_STORAGE_UPLOAD_SIZE_BYTES,
    },
});

const uploadRateLimiter = rateLimit({
    windowMs: 2 * 60 * 60 * 1000,
    max: STORAGE_UPLOAD_RATE_LIMIT_PER_MINUTE,
    keyGenerator: storageUserKey,
    validate: rateLimitValidation,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.warn(
            `[Storage] userId=${String(req.user?._id || "unknown")} action=upload status=rate-limited`,
        );
        return res.status(429).json(buildStorageErrorResponse(
            req,
            `Upload rate limit exceeded. Maximum ${STORAGE_UPLOAD_RATE_LIMIT_PER_MINUTE} uploads per 2 hours.`,
        ));
    },
});

const connectionTestRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    keyGenerator: storageUserKey,
    validate: rateLimitValidation,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => res.status(429).json(buildStorageErrorResponse(
        req,
        "Connection test rate limit exceeded. Maximum 10 tests per minute.",
    )),
});

const analyticsRefreshRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 6,
    keyGenerator: storageUserKey,
    validate: rateLimitValidation,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => !["true", "1"].includes(String(req.query?.refresh || "").toLowerCase()),
    handler: (req, res) => res.status(429).json(buildStorageErrorResponse(
        req,
        "Analytics refresh rate limit exceeded. Maximum 6 refreshes per minute.",
    )),
});

function isSuperAdmin(req, res, next) {
    if (req.user?.role !== "super_admin") {
        return res.status(403).json(buildStorageErrorResponse(
            req,
            "Super admin access is required.",
        ));
    }

    return next();
}

function singleStorageUpload(req, res, next) {
    storageUpload.single("file")(req, res, (error) => {
        if (!error) {
            return next();
        }

        console.warn(
            `[Storage] userId=${String(req.user?._id || "unknown")} action=upload status=rejected reason=${error.code || error.name || "invalid-upload"}`,
        );

        if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json(buildStorageErrorResponse(
                req,
                "File size exceeds the 500 GB limit.",
            ));
        }

        return res.status(400).json(buildStorageErrorResponse(
            req,
            "Invalid multipart file upload.",
        ));
    });
}

router.use(isAuthenticated, isSuperAdmin);

router.get("/configuration", getStorageConfiguration);
router.get("/health", getStorageHealth);
router.post(
    "/test-connection",
    connectionTestRateLimiter,
    testStorageConnection,
);
router.get(
    "/analytics/summary",
    analyticsRefreshRateLimiter,
    getStorageAnalyticsSummary,
);
router.get(
    "/analytics/files",
    analyticsRefreshRateLimiter,
    getStorageAnalyticsFiles,
);
router.get(
    "/analytics/breakdown",
    analyticsRefreshRateLimiter,
    getStorageAnalyticsBreakdown,
);

router.get("/objects", listObjects);
router.post("/upload", uploadRateLimiter, singleStorageUpload, uploadFile);
router.delete("/object", deleteObject);
router.delete("/objects", deleteObjects);
router.post("/folder", createFolder);
router.post("/presigned-url", getPresignedUrl);
router.get("/metadata", getObjectMetadata);
router.post("/rename", renameObject);

export default router;
