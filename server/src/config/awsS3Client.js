/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import accessLogger from './logger.js';
import { asyncContext } from '../utils/async-context.js';

// Parse AWS S3 ERP environment variables
const region = process.env.AWS_S3_ERP_REGION || 'eu-north-1';
const accessKeyId = process.env.AWS_S3_ERP_ACCESS_KEY;
const secretAccessKey = process.env.AWS_S3_ERP_SECRET_KEY;
const S3_BUCKET_NAME = process.env.AWS_S3_ERP_BUCKET_NAME || 'erp-classgrid';
const S3_PUBLIC_URL = process.env.AWS_CLOUDFRONT_ERP_DOMAIN || 'https://cdn.classgrid.in';

if (!accessKeyId || !secretAccessKey) {
    console.error('⚠️ Missing AWS S3 ERP credentials. S3 uploads will fail.');
}

// Initialize the AWS S3 client for ERP / Branding assets
export const awsS3Client = new S3Client({
    region,
    credentials: {
        accessKeyId: accessKeyId || '',
        secretAccessKey: secretAccessKey || '',
    },
});

/**
 * Gets a presigned URL allowing the client browser to PUT a file directly to AWS S3.
 * Used for white-labeled branding assets (logos, favicons) served via CloudFront.
 * 
 * @param {string} fileName - The intended filename
 * @param {string} mimeType - The file's MIME type
 * @param {number} expiresInSeconds - Link validity duration
 * @param {string} customPath - Optional custom object Key
 */
export async function getAwsS3PresignedUploadUrl(fileName, mimeType, expiresInSeconds = 3600, customPath = null) {
    let uniqueFilename = customPath;
    if (!uniqueFilename) {
        const ext = path.extname(fileName || '') || '';
        uniqueFilename = `assets/branding/${Date.now()}-${uuidv4()}${ext}`;
    }

    const command = new PutObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: uniqueFilename,
        ContentType: mimeType,
    });

    const url = await getSignedUrl(awsS3Client, command, { expiresIn: expiresInSeconds });
    
    // Track the presigned URL generation (implies upload)
    const context = asyncContext.getStore();
    const userId = context?.userId;
    const orgId = context?.orgId;
    
    accessLogger.info("Presigned URL generated for AWS S3 Upload (Branding/ERP)", {
        action: "file_upload_presigned_aws",
        fileName: fileName,
        mimeType,
        s3Key: uniqueFilename,
        userId: userId,
        organizationId: orgId
    });

    return {
        uploadUrl: url,
        publicUrl: `${S3_PUBLIC_URL}/${uniqueFilename}` // This is the CloudFront URL
    };
}
