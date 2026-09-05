/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

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

import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import EmailReservation from '../models/EmailReservation.js';

const isDev = process.env.NODE_ENV !== 'production';

let emailProvisioningQueue = null;
let emailProvisioningWorker = null;

if (!isDev) {
    const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
      maxRetriesPerRequest: null,
    });
    connection.on('error', (err) => console.warn('[EmailWorker] Redis error:', err.message));

    emailProvisioningQueue = new Queue('EmailProvisioningQueue', { connection });

    emailProvisioningWorker = new Worker(
      'EmailProvisioningQueue',
      async (job) => {
        const { reservationId, provider, orgSubdomain, requestedEmail, password } = job.data;
        
        console.log(`[Worker] Started processing email provision for: ${requestedEmail}`);
        
        try {
          let referenceId = null;

          if (provider === 'google_workspace') {
            console.log(`[Worker] Simulated calling Google Workspace API for ${requestedEmail}...`);
            referenceId = 'google_ws_' + Date.now();
          } else if (provider === 'zoho') {
            console.log(`[Worker] Simulated calling Zoho Mail API for ${requestedEmail}...`);
            referenceId = 'zoho_' + Date.now();
          } else {
            console.log(`[Worker] Reserved ${requestedEmail} Internally...`);
            referenceId = 'internal_' + Date.now();
          }

          await new Promise(resolve => setTimeout(resolve, 2000));

          await EmailReservation.findByIdAndUpdate(reservationId, {
            status: 'provisioned',
            provider_reference_id: referenceId
          });

          console.log(`[Worker] ✅ Success provisioning ${requestedEmail} [Ref: ${referenceId}]`);
          return { success: true, referenceId };

        } catch (error) {
          console.error(`[Worker] ❌ Failed to provision ${requestedEmail}:`, error);
          await EmailReservation.findByIdAndUpdate(reservationId, {
            status: 'failed',
            error_message: error.message
          });
          throw error;
        }
      },
      { 
        connection, 
        concurrency: 5,
        limiter: {
          max: 10,
          duration: 1000
        } 
      }
    );

    emailProvisioningWorker.on('completed', (job) => {
      console.log(`Job ${job.id} has completed successfully!`);
    });

    emailProvisioningWorker.on('failed', (job, err) => {
      console.log(`Job ${job.id} has failed with error ${err.message}`);
    });
} else {
    console.log('👷 Email Provisioning Worker skipped (no Redis in dev)');
}

export { emailProvisioningQueue, emailProvisioningWorker };
