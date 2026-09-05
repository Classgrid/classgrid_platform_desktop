/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import './email-provisioning.worker.js';

// Import other workers here as they are created
import './chat-persistence.worker.js';
import './attendance.worker.js';
import { initCronJobs } from './cleanup.worker.js';

import { initAdmissionCronJobs } from './admission-deadline-checker.cron.js';
import { initPromotionSchedulerCron } from './promotion-scheduler.cron.js';
import { initScheduledNotificationWorker } from './scheduled-notification.worker.js';
import { initOrganizationUsageDailyWorker } from './organization-usage-daily.worker.js';
import { initMonthlyInvoiceWorker } from './monthly-invoice.worker.js';
import { initBillingExportWorker } from './billing-export.worker.js';
import { initMarketingEmailWorker } from './marketing-email-blast.worker.js';

initCronJobs();
initAdmissionCronJobs();
initPromotionSchedulerCron();
initScheduledNotificationWorker();
initOrganizationUsageDailyWorker();
initMonthlyInvoiceWorker();
initBillingExportWorker();
initMarketingEmailWorker();
// import './analytics.worker.js';

console.log('👷 Background Workers Initialized');
